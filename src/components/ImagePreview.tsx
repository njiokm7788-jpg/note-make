import { useState } from 'react';

interface ImagePreviewProps {
  src: string;
  title: string;
  subtitle?: string;
}

export function ImagePreview({ src, title, subtitle }: ImagePreviewProps) {
  const [isZoomed, setIsZoomed] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-2 h-full min-h-0">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-700">{title}</h3>
          {subtitle && (
            <span className="text-xs text-slate-500">{subtitle}</span>
          )}
        </div>
        <div 
          className="relative bg-slate-100 rounded-xl overflow-hidden border border-slate-200 cursor-zoom-in group flex flex-1 min-h-0 items-center justify-center"
          onClick={() => setIsZoomed(true)}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(45deg, #e2e8f0 25%, transparent 25%),
                linear-gradient(-45deg, #e2e8f0 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, #e2e8f0 75%),
                linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)
              `,
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
            }}
          />
          <img
            src={src}
            alt={title}
            className="relative w-full h-auto max-h-[60vh] object-contain transition-transform group-hover:scale-[1.02]"
          />
          {/* 放大提示 */}
          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
            点击放大
          </div>
        </div>
      </div>

      {/* 放大查看模态框 */}
      {isZoomed && (
        <ImageZoomModal
          src={src}
          title={title}
          onClose={() => setIsZoomed(false)}
        />
      )}
    </>
  );
}

interface ImageZoomModalProps {
  src: string;
  title: string;
  onClose: () => void;
}

function ImageZoomModal({ src, title, onClose }: ImageZoomModalProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(prev => Math.min(Math.max(0.5, prev + delta), 5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/90 flex flex-col"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between px-6 py-4 bg-black/50">
        <h3 className="text-white font-medium">{title}</h3>
        <div className="flex items-center gap-4">
          {/* 缩放控制 */}
          <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5">
            <button
              onClick={() => setScale(prev => Math.max(0.5, prev - 0.25))}
              className="text-white hover:text-primary-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="text-white text-sm font-mono min-w-[4rem] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale(prev => Math.min(5, prev + 0.25))}
              className="text-white hover:text-primary-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          
          {/* 重置按钮 */}
          <button
            onClick={resetView}
            className="text-white/70 hover:text-white text-sm transition-colors"
          >
            重置
          </button>
          
          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className="text-white hover:text-red-400 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* 图片区域 */}
      <div 
        className="flex-1 overflow-hidden flex items-center justify-center"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={(e) => e.target === e.currentTarget && onClose()}
        style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
      >
        {/* 棋盘格背景 */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(45deg, #fff 25%, transparent 25%),
              linear-gradient(-45deg, #fff 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, #fff 75%),
              linear-gradient(-45deg, transparent 75%, #fff 75%)
            `,
            backgroundSize: '30px 30px',
            backgroundPosition: '0 0, 0 15px, 15px -15px, -15px 0px',
          }}
        />
        <img
          src={src}
          alt={title}
          className="max-w-full max-h-full object-contain select-none pointer-events-none"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          }}
          draggable={false}
        />
      </div>

      {/* 底部提示 */}
      <div className="px-6 py-3 bg-black/50 text-center">
        <p className="text-white/60 text-sm">
          滚轮缩放 · 拖拽平移 · 点击空白处关闭
        </p>
      </div>
    </div>
  );
}
