/**
 * OffscreenCanvas 对象池
 * 复用已创建的 OffscreenCanvas 实例，减少 GC 压力
 */
export class CanvasPool {
  private pool: OffscreenCanvas[] = [];
  private maxSize: number;

  constructor(maxSize: number = 10) {
    this.maxSize = maxSize;
  }

  /**
   * 从池中获取一个 OffscreenCanvas，自动调整尺寸
   */
  acquire(width: number, height: number): OffscreenCanvas {
    const canvas = this.pool.pop();
    if (canvas) {
      canvas.width = width;
      canvas.height = height;
      return canvas;
    }
    return new OffscreenCanvas(width, height);
  }

  /**
   * 归还 OffscreenCanvas 到池中
   */
  release(canvas: OffscreenCanvas): void {
    if (this.pool.length < this.maxSize) {
      this.pool.push(canvas);
    }
  }
}

export const canvasPool = new CanvasPool(10);
