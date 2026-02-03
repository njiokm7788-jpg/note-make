import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react';

export interface UploadStatusBarProps {
  originalFile: File | null;
  annotatedFile: File | null;
  onOpenDrawer: () => void;
  onClear: () => void;
  uploadProgress?: number;
  error?: string;
}

type UploadStatus =
  | 'empty'
  | 'partial-original'
  | 'partial-annotated'
  | 'complete'
  | 'uploading'
  | 'error';

function useFilePreview(file: File | null) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }

    let cancelled = false;
    const reader = new FileReader();

    reader.onload = (e) => {
      if (cancelled) return;
      const result = e.target?.result;
      setPreview(typeof result === 'string' ? result : null);
    };

    reader.onerror = () => {
      if (cancelled) return;
      setPreview(null);
    };

    reader.readAsDataURL(file);

    return () => {
      cancelled = true;
      try {
        reader.abort();
      } catch {
        // ignore
      }
    };
  }, [file]);

  return preview;
}

function getUploadStatus({
  originalFile,
  annotatedFile,
  uploadProgress,
  error,
}: Pick<
  UploadStatusBarProps,
  'originalFile' | 'annotatedFile' | 'uploadProgress' | 'error'
>): UploadStatus {
  if (error) return 'error';

  if (typeof uploadProgress === 'number' && !Number.isNaN(uploadProgress) && uploadProgress < 100) {
    return 'uploading';
  }

  if (originalFile && annotatedFile) return 'complete';
  if (originalFile) return 'partial-original';
  if (annotatedFile) return 'partial-annotated';
  return 'empty';
}

function isFileDrag(e: DragEvent<HTMLDivElement>) {
  return Array.from(e.dataTransfer.types).includes('Files');
}

function StatusPill({ status, progress }: { status: UploadStatus; progress?: number }) {
  if (status === 'error') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
        出错
      </span>
    );
  }

  if (status === 'uploading') {
    const progressText =
      typeof progress === 'number' && !Number.isNaN(progress) ? `${Math.round(progress)}%` : '...';
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
        <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        上传中 {progressText}
      </span>
    );
  }

  if (status === 'complete') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
        已就绪
      </span>
    );
  }

  if (status === 'partial-original' || status === 'partial-annotated') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
        缺 1 张
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-400" />
      未选择
    </span>
  );
}

function FileThumb({
  label,
  file,
  preview,
}: {
  label: string;
  file: File | null;
  preview: string | null;
}) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div
        className={`
          h-10 w-10 shrink-0 overflow-hidden rounded-lg border
          ${file ? 'border-slate-200 bg-slate-50' : 'border-slate-200 bg-white'}
        `}
      >
        {preview ? (
          <img
            src={preview}
            alt={label}
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-slate-400">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium text-slate-700">{label}</div>
        <div className="text-xs text-slate-500 truncate">
          {file ? file.name : '未选择'}
        </div>
      </div>
    </div>
  );
}

export function UploadStatusBar({
  originalFile,
  annotatedFile,
  onOpenDrawer,
  onClear,
  uploadProgress,
  error,
}: UploadStatusBarProps) {
  const status = getUploadStatus({ originalFile, annotatedFile, uploadProgress, error });
  const originalPreview = useFilePreview(originalFile);
  const annotatedPreview = useFilePreview(annotatedFile);

  const [isDragging, setIsDragging] = useState(false);
  const dragDepthRef = useRef(0);
  const openedByDragRef = useRef(false);

  const handleDragEnter = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      dragDepthRef.current += 1;
      setIsDragging(true);
      if (!openedByDragRef.current) {
        openedByDragRef.current = true;
        onOpenDrawer();
      }
    },
    [onOpenDrawer]
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsDragging(false);
      openedByDragRef.current = false;
    }
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      dragDepthRef.current = 0;
      setIsDragging(false);
      openedByDragRef.current = false;
      onOpenDrawer();
    },
    [onOpenDrawer]
  );

  const hasAnyFile = Boolean(originalFile || annotatedFile);

  const statusText = (() => {
    if (status === 'error') return error || '发生未知错误';
    if (status === 'uploading') return '正在上传，请稍候…';
    if (status === 'complete') return '已选择 2 张图片，点击展开可替换';
    if (status === 'partial-original') return '已选择原图，缺少标注图';
    if (status === 'partial-annotated') return '已选择标注图，缺少原图';
    return '点击展开上传面板，或将图片拖拽到页面';
  })();

  const showProgress =
    status === 'uploading' &&
    typeof uploadProgress === 'number' &&
    !Number.isNaN(uploadProgress) &&
    uploadProgress >= 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpenDrawer}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenDrawer();
        }
      }}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        w-full rounded-2xl border shadow-sm transition-colors duration-200 cursor-pointer select-none
        ${isDragging ? 'border-primary-400 bg-primary-50' : 'border-slate-200 bg-white hover:bg-slate-50'}
        ${status === 'error' ? 'border-red-300 bg-red-50 hover:bg-red-50' : ''}
      `}
    >
      <div className="flex items-start gap-3 p-3">
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="text-sm font-semibold text-slate-800 truncate">上传</h3>
              <StatusPill status={status} progress={uploadProgress} />
            </div>
            <div className="flex items-center gap-2">
              {hasAnyFile && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClear();
                  }}
                  className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  清空
                </button>
              )}
              <div className="text-slate-400">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>

          <p className={`text-xs ${status === 'error' ? 'text-red-700' : 'text-slate-600'} truncate`}>
            {statusText}
          </p>

          <div className="mt-1 flex items-center gap-4 min-w-0">
            <FileThumb label="原图" file={originalFile} preview={originalPreview} />
            <FileThumb label="标注图" file={annotatedFile} preview={annotatedPreview} />
          </div>

          {showProgress && (
            <div className="mt-2">
              <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-primary-500 transition-all duration-200"
                  style={{ width: `${Math.min(100, Math.max(0, uploadProgress))}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

