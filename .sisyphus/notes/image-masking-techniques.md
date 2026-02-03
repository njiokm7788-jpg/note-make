# 图像遮罩叠加技术参考文档

## 项目背景

本文档整理了实现"反向遮罩叠加模式"所需的关键技术、GitHub 参考项目和核心算法实现。

**目标功能**:
- 清晰原图检测文字区域（生成遮罩）
- 在带笔记的模糊图片文字区域添加色块
- 合成"清晰字体+笔记"的结果图片

---

## 核心 GitHub 参考项目

### 1. javascript-canvas-image-mask ⭐⭐⭐⭐⭐
**链接**: https://github.com/Bariskau/javascript-canvas-image-mask

**核心价值**: 最简洁的 Canvas 遮罩实现

**关键代码**:
```javascript
function applyMask() {
  // 获取图像数据
  const idata = canvases.drawing.ctx.getImageData(0, 0, options.width, options.height);
  const data32 = new Uint32Array(idata.data.buffer);
  
  // 像素级操作：左移实现遮罩效果
  let i = 0, len = data32.length;
  while (i < len) data32[i] = data32[i++] << 8;
  
  // 应用遮罩
  canvases.preview.ctx.putImageData(idata, 0, 0);
  canvases.preview.ctx.globalCompositeOperation = "source-in";
  canvases.preview.ctx.drawImage(elements.image, 0, 0);
}
```

**适用场景**: 像素级图像处理和遮罩应用

---

### 2. canvas-image-processing ⭐⭐⭐⭐⭐
**链接**: https://github.com/jsplumb/canvas-image-processing

**核心价值**: 完整的 Canvas 图像处理库

**包含功能**:
- 亮度/对比度调整
- 饱和度调节
- 模糊/锐化滤镜
- 图像变换

**技术博客**: https://jsplumbtoolkit.com/blog/2023/11/19/image-processing-with-html-canvas

**适用场景**: 图像预处理和后期调整

---

### 3. canvas-masking ⭐⭐⭐⭐
**链接**: https://github.com/codepo8/canvas-masking

**核心价值**: 遮罩效果演示

**Demo**: http://codepo8.github.io/canvas-masking/

**适用场景**: 快速验证遮罩概念和效果

---

### 4. react-mask-editor ⭐⭐⭐⭐
**链接**: https://github.com/la-voliere/react-mask-editor

**核心价值**: React 组件化的遮罩编辑器

**使用方式**:
```javascript
import { MaskEditor, toMask } from "react-mask-editor";

function App() {
  return (
    <MaskEditor
      src="image.jpg"
      onChange={(mask) => console.log(toMask(mask))}
    />
  );
}
```

**适用场景**: React 项目的遮罩编辑 UI 参考

---

## 核心技术原理

### 1. Canvas globalCompositeOperation 模式

| 模式 | 效果描述 | 适用场景 |
|------|----------|----------|
| `source-over` | 正常叠加，新图覆盖旧图 | 标准图像叠加 |
| `source-in` | 仅在目标区域内显示源图 | 遮罩区域内显示内容 |
| `destination-in` | 仅保留源图与目标图重叠部分 | 反向遮罩 |
| `source-out` | 在目标区域外显示源图 | 反选遮罩区域 |
| `destination-out` | 从目标图中减去源图 | 擦除效果 |

**我们的选择**: 组合使用 `source-in` 和 `source-over`

---

### 2. 文字区域检测算法

#### 基于亮度阈值（现有实现）
```javascript
function extractTextMask(imageData, options) {
  const { textThreshold, maskExpand } = options;
  const { data, width, height } = imageData;
  const mask = new Array(height).fill(null).map(() => new Array(width).fill(false));
  
  // 1. 基于亮度检测文字像素
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      
      // 计算亮度
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      
      // 深色区域判定为文字
      mask[y][x] = luminance < textThreshold;
    }
  }
  
  // 2. 遮罩扩展（可选）
  if (maskExpand > 0) {
    return expandMask(mask, maskExpand);
  }
  
  return mask;
}
```

#### 遮罩扩展算法
```javascript
function expandMask(mask, expand) {
  const height = mask.length;
  const width = mask[0].length;
  const expanded = mask.map(row => [...row]);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (mask[y][x]) {
        // 向周围扩展
        for (let dy = -expand; dy <= expand; dy++) {
          for (let dx = -expand; dx <= expand; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
              expanded[ny][nx] = true;
            }
          }
        }
      }
    }
  }
  
  return expanded;
}
```

---

### 3. 色块遮罩叠加算法

#### 方案 A: 像素级操作（精确控制）
```javascript
function applyMaskBlockOverlay(clearData, blurredData, textMask, color) {
  const { width, height } = clearData;
  const resultCanvas = document.createElement('canvas');
  resultCanvas.width = width;
  resultCanvas.height = height;
  const ctx = resultCanvas.getContext('2d');
  
  // 1. 将模糊图绘制到 canvas
  const blurredCanvas = document.createElement('canvas');
  blurredCanvas.width = width;
  blurredCanvas.height = height;
  const blurredCtx = blurredCanvas.getContext('2d');
  blurredCtx.putImageData(blurredData, 0, 0);
  
  // 2. 在模糊图上绘制色块（遮挡文字区域）
  ctx.drawImage(blurredCanvas, 0, 0);
  ctx.fillStyle = color;
  
  // 优化：批量绘制相邻区域
  for (let y = 0; y < height; y++) {
    let startX = null;
    for (let x = 0; x <= width; x++) {
      if (x < width && textMask[y][x]) {
        if (startX === null) startX = x;
      } else {
        if (startX !== null) {
          // 绘制连续的色块区域
          ctx.fillRect(startX, y, x - startX, 1);
          startX = null;
        }
      }
    }
  }
  
  // 3. 将处理后的模糊图叠加到清晰原图上
  const clearCanvas = document.createElement('canvas');
  clearCanvas.width = width;
  clearCanvas.height = height;
  const clearCtx = clearCanvas.getContext('2d');
  clearCtx.putImageData(clearData, 0, 0);
  
  // 使用 source-over 混合
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(clearCanvas, 0, 0);
  
  return ctx.getImageData(0, 0, width, height);
}
```

#### 方案 B: 使用 globalCompositeOperation（更高效）
```javascript
function applyMaskBlockOverlayOptimized(clearData, blurredData, textMask, color) {
  const { width, height } = clearData;
  
  // 创建遮罩 canvas
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = width;
  maskCanvas.height = height;
  const maskCtx = maskCanvas.getContext('2d');
  
  // 绘制遮罩（文字区域为白色，其他为黑色）
  maskCtx.fillStyle = 'black';
  maskCtx.fillRect(0, 0, width, height);
  maskCtx.fillStyle = 'white';
  
  // 批量绘制遮罩区域
  for (let y = 0; y < height; y++) {
    let startX = null;
    for (let x = 0; x <= width; x++) {
      if (x < width && textMask[y][x]) {
        if (startX === null) startX = x;
      } else {
        if (startX !== null) {
          maskCtx.fillRect(startX, y, x - startX, 1);
          startX = null;
        }
      }
    }
  }
  
  // 创建结果 canvas
  const resultCanvas = document.createElement('canvas');
  resultCanvas.width = width;
  resultCanvas.height = height;
  const ctx = resultCanvas.getContext('2d');
  
  // 1. 绘制清晰原图作为基础
  const clearCanvas = imageDataToCanvas(clearData);
  ctx.drawImage(clearCanvas, 0, 0);
  
  // 2. 在文字区域绘制色块
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(maskCanvas, 0, 0);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
  
  // 3. 在非文字区域叠加模糊图
  ctx.globalCompositeOperation = 'destination-out';
  ctx.drawImage(maskCanvas, 0, 0);
  
  const blurredCanvas = imageDataToCanvas(blurredData);
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(blurredCanvas, 0, 0);
  
  return ctx.getImageData(0, 0, width, height);
}

// 辅助函数：ImageData 转 Canvas
function imageDataToCanvas(imageData) {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  canvas.getContext('2d').putImageData(imageData, 0, 0);
  return canvas;
}
```

---

## 性能优化技巧

### 1. 批量绘制优化
```javascript
// ❌ 低效：逐像素绘制
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    if (mask[y][x]) {
      ctx.fillRect(x, y, 1, 1); // 太频繁
    }
  }
}

// ✅ 高效：批量绘制连续区域
for (let y = 0; y < height; y++) {
  let startX = null;
  for (let x = 0; x <= width; x++) {
    if (x < width && mask[y][x]) {
      if (startX === null) startX = x;
    } else if (startX !== null) {
      ctx.fillRect(startX, y, x - startX, 1); // 批量绘制
      startX = null;
    }
  }
}
```

### 2. 离屏 Canvas 缓存
```javascript
// 创建离屏 canvas 用于预处理
const offscreenCanvas = document.createElement('canvas');
offscreenCanvas.width = width;
offscreenCanvas.height = height;
const offCtx = offscreenCanvas.getContext('2d');

// 预处理操作
offCtx.drawImage(image, 0, 0);
// ... 其他操作

// 最后绘制到主 canvas
mainCtx.drawImage(offscreenCanvas, 0, 0);
```

### 3. Web Workers 处理大图片
```javascript
// imageProcessor.worker.js
self.onmessage = function(e) {
  const { imageData, options } = e.data;
  const result = processImage(imageData, options);
  self.postMessage({ result });
};

// 主线程使用
const worker = new Worker('imageProcessor.worker.js');
worker.postMessage({ imageData, options });
worker.onmessage = function(e) {
  const { result } = e.data;
  // 处理结果
};
```

---

## UI 组件设计参考

### 1. 模式切换组件
```tsx
interface ModeSelectorProps {
  mode: 'overlay' | 'maskBlockOverlay';
  onChange: (mode: ProcessingMode) => void;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ mode, onChange }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium">处理模式</label>
    <div className="flex space-x-4">
      <label className="flex items-center">
        <input
          type="radio"
          value="overlay"
          checked={mode === 'overlay'}
          onChange={(e) => onChange(e.target.value as ProcessingMode)}
          className="mr-2"
        />
        标准模式（在空白处叠加标注）
      </label>
      <label className="flex items-center">
        <input
          type="radio"
          value="maskBlockOverlay"
          checked={mode === 'maskBlockOverlay'}
          onChange={(e) => onChange(e.target.value as ProcessingMode)}
          className="mr-2"
        />
        遮罩色块模式（遮挡模糊文字）
      </label>
    </div>
  </div>
);
```

### 2. 颜色选择器组件
```tsx
interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange, disabled }) => (
  <div className={`space-y-2 ${disabled ? 'opacity-50' : ''}`}>
    <label className="block text-sm font-medium">色块颜色</label>
    <div className="flex items-center space-x-2">
      <input
        type="color"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="h-10 w-20 border rounded"
      />
      <span className="text-sm text-gray-600">{color}</span>
    </div>
  </div>
);
```

---

## 错误处理与边界情况

### 1. 图片尺寸不匹配
```javascript
function alignImageSizes(source, target) {
  const canvas = document.createElement('canvas');
  canvas.width = target.width;
  canvas.height = target.height;
  const ctx = canvas.getContext('2d');
  
  // 等比例缩放并居中裁剪
  const scale = Math.max(
    target.width / source.width,
    target.height / source.height
  );
  
  const scaledWidth = source.width * scale;
  const scaledHeight = source.height * scale;
  const offsetX = (target.width - scaledWidth) / 2;
  const offsetY = (target.height - scaledHeight) / 2;
  
  ctx.drawImage(
    source,
    0, 0, source.width, source.height,
    offsetX, offsetY, scaledWidth, scaledHeight
  );
  
  return ctx.getImageData(0, 0, target.width, target.height);
}
```

### 2. 内存管理
```javascript
function processLargeImage(imageData) {
  const chunkSize = 1024; // 分块处理
  const { width, height } = imageData;
  
  for (let y = 0; y < height; y += chunkSize) {
    for (let x = 0; x < width; x += chunkSize) {
      const chunkHeight = Math.min(chunkSize, height - y);
      const chunkWidth = Math.min(chunkSize, width - x);
      
      // 处理当前块
      processChunk(imageData, x, y, chunkWidth, chunkHeight);
      
      // 每处理完一块，让出主线程
      if (typeof requestIdleCallback !== 'undefined') {
        await new Promise(resolve => requestIdleCallback(resolve));
      }
    }
  }
}
```

---

## 测试策略

### 1. 单元测试示例
```javascript
describe('applyMaskBlockOverlay', () => {
  it('should apply color block to text regions', () => {
    const clearData = createMockImageData(100, 100);
    const blurredData = createMockImageData(100, 100);
    const textMask = createMockMask(100, 100);
    
    const result = applyMaskBlockOverlay(
      clearData,
      blurredData,
      textMask,
      '#FFFFFF'
    );
    
    expect(result).toBeDefined();
    expect(result.width).toBe(100);
    expect(result.height).toBe(100);
  });
  
  it('should handle different image sizes', () => {
    const clearData = createMockImageData(100, 100);
    const blurredData = createMockImageData(200, 200);
    
    expect(() => {
      applyMaskBlockOverlay(clearData, blurredData, [], '#FFFFFF');
    }).not.toThrow();
  });
});
```

### 2. 视觉测试用例
| 测试场景 | 输入 | 预期结果 |
|----------|------|----------|
| 标准处理 | 清晰图+模糊图 | 文字区域有色块，笔记可见 |
| 大尺寸图片 | 4K图片 | 处理成功，无明显卡顿 |
| 不同尺寸 | 1000x800 + 800x600 | 自动对齐，结果正确 |
| 全白遮罩 | 所有像素都是文字 | 全图显示色块 |
| 全黑遮罩 | 没有文字 | 全图显示清晰原图 |

---

## 扩展阅读

### 技术文档
- [MDN Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [globalCompositeOperation 详解](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation)

### 相关项目
- [OpenCV.js](https://docs.opencv.org/3.4/d5/d10/tutorial_js_root.html) - 高级图像处理
- [Jimp](https://github.com/jimp-dev/jimp) - JavaScript 图像处理库
- [sharp](https://github.com/lovell/sharp) - 高性能 Node.js 图像处理

### 性能优化参考
- [HTML5 Rocks: High Performance Animations](https://www.html5rocks.com/en/tutorials/speed/high-performance-animations/)
- [Google Web Fundamentals: Rendering Performance](https://developers.google.com/web/fundamentals/performance/rendering)

---

## 快速参考卡

### 核心算法流程
```
1. 检测文字区域（亮度阈值）
   ↓
2. 生成布尔遮罩矩阵
   ↓
3. 在模糊图文字区域绘制色块
   ↓
4. 合成到清晰原图
   ↓
5. 输出结果
```

### 关键 API
```javascript
// 获取图像数据
const imageData = ctx.getImageData(x, y, width, height);

// 设置混合模式
ctx.globalCompositeOperation = 'source-in';

// 像素操作
const data = imageData.data; // Uint8ClampedArray
// data[i] = R, data[i+1] = G, data[i+2] = B, data[i+3] = A

// 批量绘制
ctx.fillRect(x, y, width, height);
```

### 注意事项
- ⚠️ 大图片可能导致内存不足，考虑分块处理
- ⚠️ 频繁的 Canvas 操作会影响性能，使用离屏 Canvas 缓存
- ⚠️ 跨域图片需要设置 CORS 头
- ⚠️ 始终保存和恢复 Canvas 状态 (`ctx.save()` / `ctx.restore()`)

---

**文档版本**: 1.0
**更新日期**: 2026-01-31
**项目**: 笔记图片处理工具
