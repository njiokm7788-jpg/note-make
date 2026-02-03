import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react';
import { isImageFile } from '../utils/fileUtils';

export interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalFile: File | null;
  annotatedFile: File | null;
  onOriginalSelect: (file: File) => void;
  onAnnotatedSelect: (file: File) => void;
  activePasteTarget?: 'original' | 'annotated' | null;
  onSetActivePasteTarget?: (target: 'original' | 'annotated' | null) => void;
}

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

function UploadDropZone({
  title,
  description,
  file,
  onSelect,
  inputId,
  isActivePasteTarget,
  onMouseEnter,
  onMouseLeave,
}: {
  title: string;
  description: string;
  file: File | null;
  onSelect: (file: File) => void;
  inputId: string;
  isActivePasteTarget?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const preview = useFilePreview(file);

  const handleFile = useCallback(
    (selectedFile: File) => {
      if (isImageFile(selectedFile)) {
        onSelect(selectedFile);
      }
    },
    [onSelect]
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
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFile(droppedFile);
      }
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        handleFile(selectedFile);
      }
    },
    [handleFile]
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-slate-700">{title}</h3>
        {file && <span className="text-xs text-green-600">已选择</span>}
      </div>

      <div
        className={`
          relative border-2 border-dashed rounded-xl p-4 transition-all duration-200 cursor-pointer
          ${isDragging
            ? 'border-primary-500 bg-primary-50'
            : file
            ? 'border-green-400 bg-green-50'
            : 'border-slate-300 bg-white hover:border-primary-400 hover:bg-slate-50'
          }
          ${isActivePasteTarget ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById(inputId)?.click()}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <input
          id={inputId}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
        />

        {preview ? (
          <div className="flex items-center gap-3">
            <div className="h-16 w-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shrink-0">
              <img
                src={preview}
                alt={title}
                className="h-full w-full object-cover"
                draggable={false}
              />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-slate-700 truncate">{file?.name}</div>
              <div className="text-xs text-slate-500">点击可替换</div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
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
            <div className="min-w-0">
              <div className="text-sm text-slate-600">
                <span className="text-primary-600 font-medium">点击选择</span> 或拖拽图片到此处
              </div>
              <div className="text-xs text-slate-400">{description}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function UploadModal({
  isOpen,
  onClose,
  originalFile,
  annotatedFile,
  onOriginalSelect,
  onAnnotatedSelect,
  activePasteTarget,
  onSetActivePasteTarget,
}: UploadModalProps) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const originalInputId = `upload-modal-original-${useId()}`;
  const annotatedInputId = `upload-modal-annotated-${useId()}`;

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      return;
    }

    const timer = setTimeout(() => setShouldRender(false), 200);
    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;

    document.body.style.overflow = 'hidden';
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();

      // Focus trap: Tab key handling
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    // Focus the close button when modal opens
    closeButtonRef.current?.focus();

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  if (!shouldRender) return null;

  return (
    <div
      className={`
        fixed inset-0 z-50 flex items-center justify-center p-4
        transition-opacity duration-200 ease-out
        ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `}
      onClick={handleBackdropClick}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40"
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`
          relative bg-white rounded-2xl shadow-xl border border-slate-200
          w-full max-w-2xl max-h-[85vh] overflow-y-auto
          transition-all duration-200 ease-out
          ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold text-slate-800">上传图片</h2>
            <p className="text-sm text-slate-500">
              分别上传原图与标注图（两张都需要）
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="关闭"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UploadDropZone
              title="原图"
              description="不含任何标注/遮罩的干净原图"
              file={originalFile}
              onSelect={onOriginalSelect}
              inputId={originalInputId}
              isActivePasteTarget={activePasteTarget === 'original'}
              onMouseEnter={() => onSetActivePasteTarget?.('original')}
              onMouseLeave={() => onSetActivePasteTarget?.(null)}
            />
            <UploadDropZone
              title="标注图"
              description="包含 AI 标注/遮罩/涂抹的图片"
              file={annotatedFile}
              onSelect={onAnnotatedSelect}
              inputId={annotatedInputId}
              isActivePasteTarget={activePasteTarget === 'annotated'}
              onMouseEnter={() => onSetActivePasteTarget?.('annotated')}
              onMouseLeave={() => onSetActivePasteTarget?.(null)}
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="text-sm font-semibold text-slate-700 mb-2">小提示</h4>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• 支持拖拽图片到对应区域</li>
              <li>• 点击缩略图可替换当前选择</li>
              <li>• 按 ESC 或点击遮罩可关闭弹窗</li>
              <li>• 支持 Ctrl+V 粘贴图片</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
