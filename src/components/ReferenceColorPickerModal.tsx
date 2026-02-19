import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type MouseEvent,
} from 'react';

export interface ReferenceColorPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentColor: string;
  onPickColor: (color: string) => void;
}

function toHex(value: number): string {
  return value.toString(16).padStart(2, '0').toUpperCase();
}

export function ReferenceColorPickerModal({
  isOpen,
  onClose,
  currentColor,
  onPickColor,
}: ReferenceColorPickerModalProps) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();

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

    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        if (!firstElement || !lastElement) return;

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    return () => {
      setReferenceImageUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, []);

  const handleBackdropClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  const handleReferenceFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const nextUrl = URL.createObjectURL(file);
    setReferenceImageUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return nextUrl;
    });

    e.currentTarget.value = '';
  }, []);

  const handlePickColor = useCallback(
    (e: MouseEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      if (img.clientWidth <= 0 || img.clientHeight <= 0 || img.naturalWidth <= 0 || img.naturalHeight <= 0) {
        return;
      }

      const rect = img.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const mappedX = Math.min(
        img.naturalWidth - 1,
        Math.max(0, Math.floor((clickX / img.clientWidth) * img.naturalWidth))
      );
      const mappedY = Math.min(
        img.naturalHeight - 1,
        Math.max(0, Math.floor((clickY / img.clientHeight) * img.naturalHeight))
      );

      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, mappedX, mappedY, 1, 1, 0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      onPickColor(`#${toHex(r)}${toHex(g)}${toHex(b)}`);
    },
    [onPickColor]
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
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />

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
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold text-slate-800">参考图取色</h2>
            <p className="text-sm text-slate-500">上传参考图，点击图片位置即可取色</p>
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

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">当前补偿色</span>
              <span
                className="w-6 h-6 rounded border border-slate-300"
                style={{ backgroundColor: currentColor }}
              />
              <span className="text-xs font-mono text-slate-500">{currentColor}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleReferenceFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 rounded border border-slate-300 hover:bg-slate-200"
              >
                上传参考图
              </button>
              {referenceImageUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setReferenceImageUrl((prev) => {
                      if (prev) URL.revokeObjectURL(prev);
                      return null;
                    });
                  }}
                  className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700"
                >
                  清空
                </button>
              )}
            </div>
          </div>

          {referenceImageUrl ? (
            <div className="space-y-2">
              <p className="text-xs text-purple-600">提示：点击图片任意位置即可拾取颜色</p>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
                <img
                  src={referenceImageUrl}
                  alt="参考图"
                  onClick={handlePickColor}
                  className="max-w-full h-auto max-h-[56vh] rounded-md cursor-crosshair mx-auto"
                />
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              请先上传参考图，再点击图像取色
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

