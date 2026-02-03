import { useState, useRef, useEffect, useCallback } from 'react';

interface FloatingUploadButtonProps {
  originalFile: File | null;
  annotatedFile: File | null;
  onClick: () => void;
  onClear: () => void;
}

type UploadStatus = 'empty' | 'partial' | 'complete';

function getUploadStatus(originalFile: File | null, annotatedFile: File | null): UploadStatus {
  if (originalFile && annotatedFile) return 'complete';
  if (originalFile || annotatedFile) return 'partial';
  return 'empty';
}

const statusColors: Record<UploadStatus, string> = {
  empty: 'bg-slate-400',
  partial: 'bg-amber-400',
  complete: 'bg-green-500',
};

const STORAGE_KEY = 'floating-upload-button-position';
const DRAG_THRESHOLD = 5; // 移动超过 5px 才视为拖动

function loadPosition(): { x: number; y: number } | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return null;
}

function savePosition(x: number, y: number) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ x, y }));
  } catch {}
}

export function FloatingUploadButton({
  originalFile,
  annotatedFile,
  onClick,
  onClear,
}: FloatingUploadButtonProps) {
  const status = getUploadStatus(originalFile, annotatedFile);
  const hasFiles = status !== 'empty';

  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; elemX: number; elemY: number } | null>(null);
  const hasDraggedRef = useRef(false); // 是否真正发生了拖动
  const isMouseDownRef = useRef(false); // 鼠标是否按下

  useEffect(() => {
    const saved = loadPosition();
    if (saved) setPosition(saved);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      elemX: rect.left,
      elemY: rect.top,
    };
    isMouseDownRef.current = true;
    hasDraggedRef.current = false;
    e.preventDefault();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDownRef.current || !dragStartRef.current) return;

      const { mouseX, mouseY, elemX, elemY } = dragStartRef.current;
      const deltaX = e.clientX - mouseX;
      const deltaY = e.clientY - mouseY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // 只有移动超过阈值才开始拖动
      if (!hasDraggedRef.current && distance < DRAG_THRESHOLD) return;

      hasDraggedRef.current = true;
      if (!isDragging) setIsDragging(true);

      const newX = elemX + deltaX;
      const newY = elemY + deltaY;
      const maxX = window.innerWidth - 80;
      const maxY = window.innerHeight - 100;
      const clampedX = Math.max(0, Math.min(newX, maxX));
      const clampedY = Math.max(0, Math.min(newY, maxY));

      setPosition({ x: clampedX, y: clampedY });
    };

    const handleMouseUp = () => {
      if (!isMouseDownRef.current) return;

      const wasDragged = hasDraggedRef.current;
      isMouseDownRef.current = false;
      hasDraggedRef.current = false;
      dragStartRef.current = null;
      setIsDragging(false);

      // 如果发生了拖动，保存位置
      if (wasDragged && position) {
        savePosition(position.x, position.y);
      }
      // 如果没有拖动，触发点击
      if (!wasDragged) {
        onClick();
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, position, onClick]);

  const positionStyle = position
    ? { left: position.x, top: position.y, right: 'auto', bottom: 'auto' }
    : { right: 24, bottom: 24 };

  return (
    <div
      ref={containerRef}
      className="fixed z-40 flex flex-col items-end gap-2"
      style={positionStyle}
    >
      {/* 清空按钮 - 仅在有文件时显示 */}
      {hasFiles && (
        <button
          type="button"
          onClick={onClear}
          className="w-8 h-8 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center text-slate-500 hover:text-red-500 hover:border-red-300 transition-colors"
          title="清空上传"
          aria-label="清空上传"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* 主按钮 */}
      <button
        type="button"
        onMouseDown={handleMouseDown}
        className={`relative w-14 h-14 rounded-2xl bg-white shadow-lg border border-slate-200 flex items-center justify-center text-primary-600 hover:bg-primary-50 hover:border-primary-300 active:scale-95 transition-all duration-200 ${isDragging ? 'cursor-grabbing' : 'cursor-pointer'}`}
        title="上传图片 (可拖拽移动)"
        aria-label="上传图片"
      >
        {/* 上传图标 */}
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>

        {/* 状态徽章 */}
        <span
          className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${statusColors[status]} transition-colors`}
          title={status === 'complete' ? '已就绪' : status === 'partial' ? '部分上传' : '未上传'}
        />
      </button>
    </div>
  );
}
