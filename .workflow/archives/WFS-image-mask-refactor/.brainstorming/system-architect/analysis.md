# 反向遮罩叠加模式 - 系统架构分析报告

## 1. 项目背景与目标

### 1.1 当前状态
现有 `imageProcessor.ts` 实现了基于亮度阈值的文字检测和遮罩叠加功能：
- 从清晰原图检测文字区域（暗色像素）
- 在文字区域保留原图，非文字区域混合标注图
- 支持 Sobel 边缘引导膨胀优化

### 1.2 重构目标
实现**反向遮罩叠加模式**：
- 清晰原图检测文字区域
- 模糊图（AI 标注图）的文字区域加用户可选色块
- 合成：清晰字体 + 带色块的笔记背景

### 1.3 确认的决策
| 决策项 | 选择 |
|--------|------|
| 架构策略 | 移除现有功能，完全重写 |
| 检测算法 | 亮度阈值检测 |
| 色块颜色 | 用户可选 |
| UI 复用 | 复用现有上传逻辑 |

---

## 2. 模块设计

### 2.1 推荐的函数结构

```
imageProcessor.ts
├── Types & Interfaces
│   ├── ProcessingOptions          # 处理选项接口
│   ├── ProcessingResult           # 处理结果接口
│   └── ColorBlock                 # 色块配置接口
│
├── Core Processing Functions
│   ├── detectTextRegions()        # 文字区域检测（亮度阈值）
│   ├── applyColorBlock()          # 在标注图文字区域应用色块
│   ├── compositeImages()          # 合成最终图像
│   └── processImagePair()         # 主处理流程（公开 API）
│
├── Image I/O Utilities
│   ├── loadImage()                # 加载图片为 HTMLImageElement
│   ├── getImageData()             # 获取 ImageData
│   ├── imageDataToBlob()          # ImageData 转 Blob
│   └── imageDataToDataURL()       # ImageData 转 DataURL
│
├── Mask Operations
│   ├── createTextMask()           # 创建文字遮罩
│   ├── expandMask()               # 遮罩膨胀（简化版，移除边缘引导）
│   └── invertMask()               # 遮罩反转
│
└── Preview & Debug
    ├── generatePreview()          # 生成预览数据
    └── generateMaskPreview()      # 生成遮罩预览（调试用）
```

### 2.2 模块职责划分

| 模块 | 职责 | 输入 | 输出 |
|------|------|------|------|
| `detectTextRegions` | 基于亮度阈值检测文字像素 | ImageData, threshold | boolean[] (mask) |
| `applyColorBlock` | 在指定区域应用色块 | ImageData, mask, color | ImageData |
| `compositeImages` | 合成清晰文字与色块背景 | originalData, colorBlockData, mask | ImageData |
| `processImagePair` | 协调完整处理流程 | File, File, Options | Blob |

### 2.3 简化建议

**移除的功能**：
- Sobel 边缘检测 (`sobelEdgeDetect`)
- 边缘引导膨胀 (`edgeGuidedExpand`)
- 相关选项字段 (`useEdgeGuidedExpand`, `edgeThreshold`)

**保留的功能**：
- 亮度阈值检测
- 简单圆形膨胀
- 图像缩放对齐

---

## 3. 接口设计

### 3.1 ProcessingOptions 接口

```typescript
export interface ProcessingOptions {
  /** 文字检测亮度阈值 (0-255)，低于此值的像素被视为文字 */
  textThreshold: number;

  /** 遮罩膨胀半径 (像素)，确保完全覆盖文字边缘 */
  maskExpand: number;

  /** 色块颜色 (CSS 颜色值，如 '#FFFF00' 或 'rgba(255,255,0,0.5)') */
  blockColor: string;

  /** 色块透明度 (0-1)，控制色块与原背景的混合程度 */
  blockOpacity: number;
}
```

### 3.2 默认值设计

```typescript
export const defaultProcessingOptions: ProcessingOptions = {
  textThreshold: 200,    // 适合大多数黑色文字
  maskExpand: 2,         // 轻微膨胀，避免文字边缘残留
  blockColor: '#FFFF00', // 黄色高亮（常见笔记色）
  blockOpacity: 0.3,     // 半透明，不遮挡背景内容
};
```

### 3.3 预设方案设计

```typescript
export const presets: Preset[] = [
  {
    id: 'highlight-yellow',
    name: '黄色高亮',
    description: '经典荧光笔效果',
    options: {
      textThreshold: 200,
      maskExpand: 2,
      blockColor: '#FFFF00',
      blockOpacity: 0.3,
    }
  },
  {
    id: 'highlight-green',
    name: '绿色高亮',
    description: '清新绿色标记',
    options: {
      textThreshold: 200,
      maskExpand: 2,
      blockColor: '#90EE90',
      blockOpacity: 0.35,
    }
  },
  {
    id: 'highlight-pink',
    name: '粉色高亮',
    description: '柔和粉色标记',
    options: {
      textThreshold: 200,
      maskExpand: 2,
      blockColor: '#FFB6C1',
      blockOpacity: 0.35,
    }
  },
  {
    id: 'custom',
    name: '自定义',
    description: '自定义颜色和参数',
    options: defaultProcessingOptions,
  }
];
```

### 3.4 辅助接口

```typescript
/** 处理结果 */
export interface ProcessingResult {
  /** 最终合成图像 */
  result: ImageData;
  /** 文字遮罩（用于预览/调试） */
  textMask: boolean[];
  /** 处理耗时 (ms) */
  processingTime: number;
}

/** 预览数据 */
export interface PreviewData {
  original: string;      // 原图 DataURL
  annotated: string;     // 标注图 DataURL
  maskPreview: string;   // 遮罩预览 DataURL
  result: string;        // 最终结果 DataURL
}

/** 颜色解析结果 */
interface ParsedColor {
  r: number;
  g: number;
  b: number;
  a: number;
}
```

---

## 4. 数据流设计

### 4.1 完整处理流程

```
┌─────────────────────────────────────────────────────────────────────┐
│                         用户交互层 (App.tsx)                         │
├─────────────────────────────────────────────────────────────────────┤
│  [上传原图]  [上传标注图]  [选择色块颜色]  [调整参数]  [触发处理]      │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    processImagePair() 主入口                         │
├─────────────────────────────────────────────────────────────────────┤
│  Input: originalFile, annotatedFile, ProcessingOptions              │
│  Output: Promise<Blob>                                              │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                    ▼
   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
   │ loadImage() │      │ loadImage() │      │ parseColor()│
   │  (原图)     │      │  (标注图)   │      │  (色块颜色) │
   └──────┬──────┘      └──────┬──────┘      └──────┬──────┘
          │                    │                    │
          ▼                    ▼                    │
   ┌─────────────┐      ┌─────────────┐             │
   │getImageData │      │getImageData │             │
   └──────┬──────┘      └──────┬──────┘             │
          │                    │                    │
          │    ┌───────────────┘                    │
          │    │ (尺寸对齐)                         │
          ▼    ▼                                    │
   ┌─────────────────────┐                         │
   │  scaleImageData()   │ (如果尺寸不同)           │
   └──────────┬──────────┘                         │
              │                                    │
              ▼                                    │
   ┌─────────────────────┐                         │
   │ detectTextRegions() │                         │
   │  (亮度阈值检测)      │                         │
   └──────────┬──────────┘                         │
              │                                    │
              ▼                                    │
   ┌─────────────────────┐                         │
   │    expandMask()     │                         │
   │   (遮罩膨胀)        │                         │
   └──────────┬──────────┘                         │
              │                                    │
              ▼                                    ▼
   ┌─────────────────────────────────────────────────┐
   │              applyColorBlock()                  │
   │  (在标注图的文字区域应用色块)                     │
   │  Input: annotatedData, textMask, color, opacity │
   └──────────────────────┬──────────────────────────┘
                          │
                          ▼
   ┌─────────────────────────────────────────────────┐
   │              compositeImages()                  │
   │  (合成：文字区域用原图，其他区域用色块标注图)     │
   │  Input: originalData, colorBlockData, textMask  │
   └──────────────────────┬──────────────────────────┘
                          │
                          ▼
   ┌─────────────────────────────────────────────────┐
   │              imageDataToBlob()                  │
   │  Output: Promise<Blob>                          │
   └─────────────────────────────────────────────────┘
```

### 4.2 状态管理流程 (React)

```
┌─────────────────────────────────────────────────────────────────┐
│                        App.tsx State                            │
├─────────────────────────────────────────────────────────────────┤
│  originalFile: File | null                                      │
│  annotatedFile: File | null                                     │
│  options: ProcessingOptions                                     │
│  preview: PreviewData | null                                    │
│  isProcessing: boolean                                          │
└─────────────────────────────────────────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
┌───────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ UploadDrawer  │    │    Sidebar      │    │  ImagePreview   │
│ (文件上传)    │    │ (参数控制)      │    │  (结果展示)     │
└───────────────┘    └─────────────────┘    └─────────────────┘
        │                      │                      ▲
        │                      │                      │
        └──────────────────────┴──────────────────────┘
                    (props & callbacks)
```

### 4.3 实时预览数据流

```
[参数变化] ──► useDebounce(300ms) ──► [触发处理]
                                           │
                                           ▼
                                    generatePreview()
                                           │
                                           ▼
                                    setPreview(result)
                                           │
                                           ▼
                                    [UI 更新]
```

---

## 5. 性能优化策略

### 5.1 大图片处理优化

#### 5.1.1 分块处理 (Chunked Processing)

```typescript
const CHUNK_SIZE = 512 * 512; // 每块约 26 万像素

async function processInChunks(
  imageData: ImageData,
  processor: (chunk: ImageData) => ImageData
): Promise<ImageData> {
  const { width, height } = imageData;
  const totalPixels = width * height;

  if (totalPixels <= CHUNK_SIZE) {
    return processor(imageData);
  }

  // 分块处理逻辑
  const chunks = Math.ceil(totalPixels / CHUNK_SIZE);
  const rowsPerChunk = Math.ceil(height / chunks);

  for (let i = 0; i < chunks; i++) {
    const startRow = i * rowsPerChunk;
    const endRow = Math.min((i + 1) * rowsPerChunk, height);
    // 处理每个块...
    await yieldToMain(); // 让出主线程
  }

  return result;
}

function yieldToMain(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}
```

#### 5.1.2 Web Worker 方案（可选）

```typescript
// worker.ts
self.onmessage = (e: MessageEvent) => {
  const { originalData, annotatedData, options } = e.data;
  const result = processImages(originalData, annotatedData, options);
  self.postMessage(result);
};

// main thread
const worker = new Worker(new URL('./worker.ts', import.meta.url));
worker.postMessage({ originalData, annotatedData, options });
worker.onmessage = (e) => setResult(e.data);
```

#### 5.1.3 预览缩放策略

```typescript
const MAX_PREVIEW_SIZE = 1920; // 预览最大边长

function getPreviewScale(width: number, height: number): number {
  const maxDim = Math.max(width, height);
  return maxDim > MAX_PREVIEW_SIZE ? MAX_PREVIEW_SIZE / maxDim : 1;
}

async function generatePreview(
  originalFile: File,
  annotatedFile: File,
  options: ProcessingOptions
): Promise<PreviewData> {
  const [originalImg, annotatedImg] = await Promise.all([
    loadImage(originalFile),
    loadImage(annotatedFile),
  ]);

  // 计算预览缩放比例
  const scale = getPreviewScale(originalImg.width, originalImg.height);

  if (scale < 1) {
    // 缩放后处理，提高预览速度
    const scaledWidth = Math.round(originalImg.width * scale);
    const scaledHeight = Math.round(originalImg.height * scale);
    // ...
  }

  // 处理逻辑...
}
```

### 5.2 内存优化

```typescript
// 及时释放 ObjectURL
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url); // 立即释放
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

// 使用 TypedArray 替代普通数组
function createTextMask(width: number, height: number): Uint8Array {
  return new Uint8Array(width * height); // 比 boolean[] 更节省内存
}
```

### 5.3 渲染优化

```typescript
// 使用 OffscreenCanvas（如果支持）
function createCanvas(width: number, height: number): HTMLCanvasElement | OffscreenCanvas {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height);
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}
```

---

## 6. 错误处理设计

### 6.1 错误类型定义

```typescript
export class ImageProcessingError extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ImageProcessingError';
  }
}

export enum ErrorCode {
  INVALID_FILE = 'INVALID_FILE',
  LOAD_FAILED = 'LOAD_FAILED',
  SIZE_MISMATCH = 'SIZE_MISMATCH',
  PROCESSING_FAILED = 'PROCESSING_FAILED',
  MEMORY_EXCEEDED = 'MEMORY_EXCEEDED',
  INVALID_OPTIONS = 'INVALID_OPTIONS',
}
```

### 6.2 边界情况处理

| 场景 | 处理策略 |
|------|----------|
| 文件不是图片 | 在 `loadImage` 阶段抛出 `INVALID_FILE` 错误 |
| 图片加载失败 | 抛出 `LOAD_FAILED` 错误，包含原始错误信息 |
| 两图尺寸不同 | 自动缩放标注图到原图尺寸（已实现） |
| 图片过大 (>50MP) | 警告用户，建议缩小；或自动降采样 |
| 阈值超出范围 | 在 `validateOptions` 中修正到有效范围 |
| 色块颜色无效 | 回退到默认颜色，记录警告 |
| 处理过程中断 | 使用 AbortController 支持取消 |

### 6.3 参数验证

```typescript
export function validateOptions(options: Partial<ProcessingOptions>): ProcessingOptions {
  const validated = { ...defaultProcessingOptions };

  if (options.textThreshold !== undefined) {
    validated.textThreshold = Math.max(0, Math.min(255, options.textThreshold));
  }

  if (options.maskExpand !== undefined) {
    validated.maskExpand = Math.max(0, Math.min(20, options.maskExpand));
  }

  if (options.blockColor !== undefined) {
    if (!isValidColor(options.blockColor)) {
      console.warn(`Invalid color: ${options.blockColor}, using default`);
    } else {
      validated.blockColor = options.blockColor;
    }
  }

  if (options.blockOpacity !== undefined) {
    validated.blockOpacity = Math.max(0, Math.min(1, options.blockOpacity));
  }

  return validated;
}

function isValidColor(color: string): boolean {
  const s = new Option().style;
  s.color = color;
  return s.color !== '';
}
```

### 6.4 用户友好的错误提示

```typescript
const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.INVALID_FILE]: '请上传有效的图片文件（支持 JPG、PNG、WebP 格式）',
  [ErrorCode.LOAD_FAILED]: '图片加载失败，请检查文件是否损坏',
  [ErrorCode.SIZE_MISMATCH]: '图片尺寸差异过大，已自动调整',
  [ErrorCode.PROCESSING_FAILED]: '处理过程中出现错误，请重试',
  [ErrorCode.MEMORY_EXCEEDED]: '图片过大，请使用较小的图片或降低分辨率',
  [ErrorCode.INVALID_OPTIONS]: '参数设置无效，已恢复默认值',
};
```

---

## 7. UI 组件适配

### 7.1 Sidebar.tsx 修改要点

**需要修改的部分**：
1. 移除边缘引导膨胀相关控件
2. 添加色块颜色选择器
3. 添加色块透明度滑块
4. 更新预设方案

**新增控件**：
```tsx
// 色块颜色选择器
<div className="space-y-2">
  <label className="text-xs font-medium text-slate-600">色块颜色</label>
  <div className="flex gap-2">
    {['#FFFF00', '#90EE90', '#FFB6C1', '#87CEEB'].map(color => (
      <button
        key={color}
        onClick={() => handleOptionChange({ ...options, blockColor: color })}
        className={`w-8 h-8 rounded-lg border-2 ${
          options.blockColor === color ? 'border-primary-500' : 'border-slate-200'
        }`}
        style={{ backgroundColor: color }}
      />
    ))}
    <input
      type="color"
      value={options.blockColor}
      onChange={(e) => handleOptionChange({ ...options, blockColor: e.target.value })}
      className="w-8 h-8 rounded-lg cursor-pointer"
    />
  </div>
</div>

// 色块透明度滑块
<div className="space-y-2">
  <div className="flex items-center justify-between">
    <label className="text-xs font-medium text-slate-600">色块透明度</label>
    <span className="text-xs text-slate-500 font-mono">
      {Math.round(options.blockOpacity * 100)}%
    </span>
  </div>
  <input
    type="range"
    min="0"
    max="100"
    value={options.blockOpacity * 100}
    onChange={(e) => handleOptionChange({
      ...options,
      blockOpacity: Number(e.target.value) / 100,
    })}
    className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
  />
</div>
```

### 7.2 预览视图调整

**ImagePreview 展示内容**：
- 原图（清晰文字）
- 标注图（AI 标注）
- 遮罩预览（文字区域高亮）
- 最终结果（清晰文字 + 色块背景）

---

## 8. 实施建议

### 8.1 实施顺序

1. **Phase 1: 核心算法重写**
   - 重写 `ProcessingOptions` 接口
   - 实现 `applyColorBlock()` 函数
   - 修改 `compositeImages()` 逻辑
   - 更新 `processImagePair()` 主流程

2. **Phase 2: UI 适配**
   - 更新 Sidebar 控件
   - 更新预设方案
   - 调整预览视图

3. **Phase 3: 优化与测试**
   - 添加性能优化
   - 完善错误处理
   - 测试各种边界情况

### 8.2 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 色块颜色解析复杂 | 中 | 使用 Canvas 2D API 解析颜色 |
| 大图片性能问题 | 高 | 实现分块处理或 Web Worker |
| 遮罩边缘锯齿 | 低 | 可选：添加抗锯齿处理 |

### 8.3 测试用例建议

- 正常图片对处理
- 不同尺寸图片对
- 各种色块颜色（十六进制、RGB、RGBA、命名颜色）
- 极端阈值参数
- 大图片（>10MP）
- 无文字图片
- 全文字图片

---

## 9. 总结

本架构分析报告为反向遮罩叠加模式的重构提供了完整的技术方案：

1. **模块设计**：清晰的函数职责划分，移除不必要的复杂功能
2. **接口设计**：简化的 `ProcessingOptions`，新增色块相关字段
3. **数据流**：从上传到输出的完整处理链路
4. **性能优化**：分块处理、预览缩放、内存管理策略
5. **错误处理**：完善的边界情况处理和用户友好提示

重构后的系统将更加简洁、易维护，同时提供更好的用户体验。
