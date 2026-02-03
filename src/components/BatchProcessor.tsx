import { useState, useCallback, useEffect, type ChangeEvent, type DragEvent } from 'react';
import {
  generateId,
  isImageFile,
  downloadBatchResults,
  type ImagePair,
} from '../utils/fileUtils';
import type { ProcessingOptions } from '../utils/imageProcessor';

interface BatchProcessorProps {
  options: ProcessingOptions;
}

// 文件预览 Hook
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

// 上传区域组件
function UploadDropZone({
  title,
  description,
  files,
  onFilesSelect,
  inputId,
}: {
  title: string;
  description: string;
  files: File[];
  onFilesSelect: (files: File[]) => void;
  inputId: string;
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback(
    (selectedFiles: FileList | null) => {
      if (!selectedFiles) return;
      const imageFiles = Array.from(selectedFiles).filter(isImageFile);
      if (imageFiles.length > 0) {
        onFilesSelect([...files, ...imageFiles]);
      }
    },
    [files, onFilesSelect]
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
    },
    [handleFiles]
  );

  const removeFile = useCallback(
    (index: number) => {
      onFilesSelect(files.filter((_, i) => i !== index));
    },
    [files, onFilesSelect]
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        <span className="text-xs text-slate-500">{files.length} 张</span>
      </div>

      <div
        className={`
          relative border-2 border-dashed rounded-xl p-4 transition-all duration-200 cursor-pointer min-h-[120px]
          ${isDragging
            ? 'border-primary-500 bg-primary-50'
            : files.length > 0
            ? 'border-green-400 bg-green-50'
            : 'border-slate-300 bg-white hover:border-primary-400 hover:bg-slate-50'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById(inputId)?.click()}
      >
        <input
          id={inputId}
          type="file"
          accept="image/*"
          multiple
          onChange={handleInputChange}
          className="hidden"
        />

        {files.length === 0 ? (
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-primary-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div className="text-sm text-slate-600">
              <span className="text-primary-600 font-medium">点击选择</span> 或拖拽图片到此处
            </div>
            <div className="text-xs text-slate-400">{description}</div>
          </div>
        ) : (
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {files.map((file, index) => (
              <FilePreviewItem
                key={`${file.name}-${index}`}
                file={file}
                index={index}
                onRemove={removeFile}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 文件预览项组件
function FilePreviewItem({
  file,
  index,
  onRemove,
}: {
  file: File;
  index: number;
  onRemove: (index: number) => void;
}) {
  const preview = useFilePreview(file);

  return (
    <div className="flex items-center gap-3 bg-white rounded-lg p-2 border border-slate-200">
      <div className="h-12 w-12 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shrink-0">
        {preview ? (
          <img
            src={preview}
            alt={file.name}
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-slate-500">第 {index + 1} 张</div>
        <div className="text-sm font-medium text-slate-700 truncate">{file.name}</div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(index);
        }}
        className="p-1 text-slate-400 hover:text-red-500 transition-colors"
        title="删除"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

interface ProcessingStatus {
  current: number;
  total: number;
  currentFileName: string;
  successCount: number;
  failedCount: number;
  errors: Array<{ fileName: string; error: string }>;
}

export function BatchProcessor({ options }: BatchProcessorProps) {
  const [originalFiles, setOriginalFiles] = useState<File[]>([]);
  const [annotatedFiles, setAnnotatedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<ProcessingStatus>({
    current: 0,
    total: 0,
    currentFileName: '',
    successCount: 0,
    failedCount: 0,
    errors: [],
  });

  // 按顺序配对文件
  const pairs: ImagePair[] = [];
  const pairCount = Math.min(originalFiles.length, annotatedFiles.length);
  for (let i = 0; i < pairCount; i++) {
    pairs.push({
      id: generateId(),
      originalFile: originalFiles[i],
      annotatedFile: annotatedFiles[i],
      originalName: originalFiles[i].name,
    });
  }

  const handleBatchProcess = useCallback(async () => {
    if (pairs.length === 0) return;

    setIsProcessing(true);
    setStatus({
      current: 0,
      total: pairs.length,
      currentFileName: '',
      successCount: 0,
      failedCount: 0,
      errors: [],
    });

    try {
      await downloadBatchResults(
        pairs,
        options,
        (current, total, fileName, success, error) => {
          setStatus((prev) => ({
            current,
            total,
            currentFileName: fileName || '',
            successCount: success ? prev.successCount + 1 : prev.successCount,
            failedCount: success ? prev.failedCount : prev.failedCount + 1,
            errors: error
              ? [...prev.errors, { fileName: fileName || '', error }]
              : prev.errors,
          }));
        }
      );
    } catch (error) {
      console.error('批量处理出错:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [pairs, options]);

  const mismatchWarning = originalFiles.length !== annotatedFiles.length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800">批量处理</h2>
        <span className="text-sm text-slate-500">
          已配对 {pairs.length} 对图片
        </span>
      </div>

      {/* 配对说明 */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-700">
            <div className="font-medium mb-1">按顺序配对规则</div>
            <div className="text-xs text-blue-600">
              第 1 张原图配第 1 张标注图，第 2 张原图配第 2 张标注图，以此类推。请确保上传顺序正确。
            </div>
          </div>
        </div>
      </div>

      {/* 数量不匹配警告 */}
      {mismatchWarning && (originalFiles.length > 0 || annotatedFiles.length > 0) && (
        <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="text-sm text-amber-700">
              <div className="font-medium">文件数量不匹配</div>
              <div className="text-xs text-amber-600">
                原图 {originalFiles.length} 张，标注图 {annotatedFiles.length} 张。只有前 {pairs.length} 对会被处理。
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 处理进度显示 */}
      {isProcessing && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="space-y-3">
            {/* 进度条 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-700 font-medium">
                  处理进度: {status.current}/{status.total}
                </span>
                <span className="text-blue-600">
                  {Math.round((status.current / status.total) * 100)}%
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-full transition-all duration-300 ease-out"
                  style={{ width: `${(status.current / status.total) * 100}%` }}
                />
              </div>
            </div>

            {/* 当前处理文件 */}
            {status.currentFileName && (
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
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
                <span className="truncate">正在处理: {status.currentFileName}</span>
              </div>
            )}

            {/* 成功/失败统计 */}
            <div className="flex items-center gap-4 text-xs">
              <span className="text-green-600">
                成功: {status.successCount}
              </span>
              {status.failedCount > 0 && (
                <span className="text-red-600">
                  失败: {status.failedCount}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 处理完成后的错误报告 */}
      {!isProcessing && status.errors.length > 0 && (
        <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-start gap-2 mb-2">
            <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <div className="text-sm font-medium text-red-700 mb-1">
                处理完成，但有 {status.errors.length} 个文件失败
              </div>
              <div className="text-xs text-red-600 space-y-1 max-h-32 overflow-y-auto">
                {status.errors.map((err, idx) => (
                  <div key={idx} className="flex items-start gap-1">
                    <span className="shrink-0">•</span>
                    <span className="break-all">
                      {err.fileName}: {err.error}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 处理成功提示 */}
      {!isProcessing && status.current > 0 && status.errors.length === 0 && (
        <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-green-700 font-medium">
              成功处理 {status.successCount} 个文件
            </span>
          </div>
        </div>
      )}

      {/* 左右并排上传区域 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <UploadDropZone
          title="原图"
          description="不含任何标注/遮罩的干净原图"
          files={originalFiles}
          onFilesSelect={setOriginalFiles}
          inputId="batch-original-input"
        />
        <UploadDropZone
          title="标注图"
          description="包含 AI 标注/遮罩/涂抹的图片"
          files={annotatedFiles}
          onFilesSelect={setAnnotatedFiles}
          inputId="batch-annotated-input"
        />
      </div>

      {/* 处理按钮 */}
      <button
        onClick={handleBatchProcess}
        disabled={pairs.length === 0 || isProcessing}
        className={`
          w-full py-3 px-4 rounded-xl font-medium transition-all duration-200
          ${pairs.length > 0 && !isProcessing
            ? 'bg-primary-500 text-white hover:bg-primary-600 active:scale-98'
            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }
        `}
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
            处理中...
          </span>
        ) : (
          `批量处理并下载 (${pairs.length} 对)`
        )}
      </button>
    </div>
  );
}
