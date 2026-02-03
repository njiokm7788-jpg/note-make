# 公共 API 参考文档

本文档详细描述笔记图片叠加工具的公共 API，包括图像处理、预设管理和文件工具三大模块。

---

## 目录

1. [类型定义](#类型定义)
2. [图像处理 API](#图像处理-api)
3. [预设管理 API](#预设管理-api)
4. [文件工具 API](#文件工具-api)
5. [常量与默认值](#常量与默认值)

---

## 类型定义

### ProcessingOptions

图像处理选项接口，定义处理参数。

```typescript
interface ProcessingOptions {
  /** 文字检测亮度阈值 (0-255)，低于此值的像素被视为文字 */
  textThreshold: number;
  
  /** 遮罩膨胀半径 (像素)，用于确保完全覆盖文字 */
  maskExpand: number;
  
  /** 色块颜色 (CSS颜色值，支持 #RGB 和 #RRGGBB 格式) */
  blockColor: string;
  
  /** 色块透明度 (0-1)，0 为完全透明，1 为完全不透明 */
  blockOpacity: number;
}
```

**字段说明**：

| 字段 | 类型 | 范围 | 默认值 | 说明 |
|------|------|------|--------|------|
| `textThreshold` | `number` | 0-255 | 200 | 亮度阈值，低于此值判定为文字像素 |
| `maskExpand` | `number` | 0-10+ | 2 | 遮罩膨胀半径，扩展文字区域边界 |
| `blockColor` | `string` | CSS HEX | `#FFFF00` | 叠加色块的颜色 |
| `blockOpacity` | `number` | 0-1 | 0.3 | 色块透明度 |

---

### Preset

预设方案接口，封装一组命名的处理选项。

```typescript
interface Preset {
  /** 预设唯一标识符 */
  id: string;
  
  /** 预设显示名称 */
  name: string;
  
  /** 预设描述文本 */
  description: string;
  
  /** 关联的处理选项 */
  options: ProcessingOptions;
}
```

**字段说明**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 唯一标识，系统预设使用 `highlight-*` 格式，用户预设使用 `preset-{timestamp}` 格式 |
| `name` | `string` | 用户可见的预设名称 |
| `description` | `string` | 预设用途描述 |
| `options` | `ProcessingOptions` | 该预设对应的处理参数 |

---

### ImagePair

图像对接口，用于批量处理场景。

```typescript
interface ImagePair {
  /** 图像对唯一标识符 */
  id: string;
  
  /** 原始图片文件 */
  originalFile: File;
  
  /** 标注图片文件 */
  annotatedFile: File;
  
  /** 原始文件名（用于输出命名） */
  originalName: string;
}
```

**字段说明**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 由 `generateId()` 生成的唯一标识 |
| `originalFile` | `File` | 清晰的原始笔记图片 |
| `annotatedFile` | `File` | AI 标注后的图片（通常带有模糊或高亮效果） |
| `originalName` | `string` | 用于生成输出文件名 |

---

## 图像处理 API

### processImagePair()

**主处理函数** - 处理一对图片并返回合成结果。

```typescript
async function processImagePair(
  originalFile: File,
  annotatedFile: File,
  options?: ProcessingOptions
): Promise<Blob>
```

**参数**：

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `originalFile` | `File` | 是 | 原始清晰图片文件 |
| `annotatedFile` | `File` | 是 | AI 标注图片文件 |
| `options` | `ProcessingOptions` | 否 | 处理选项，默认使用 `defaultProcessingOptions` |

**返回值**：`Promise<Blob>` - PNG 格式的处理结果

**处理流程**：
1. 并行加载两张图片
2. 提取图片像素数据
3. 如尺寸不同，缩放标注图至原图尺寸
4. 基于原图提取文字遮罩
5. 应用色块叠加（文字区域保留原图，非文字区域叠加色块）
6. 转换为 Blob 返回

**使用示例**：

```typescript
import { processImagePair, defaultProcessingOptions } from './imageProcessor';

// 基本用法
const resultBlob = await processImagePair(originalFile, annotatedFile);

// 自定义选项
const customOptions = {
  textThreshold: 180,
  maskExpand: 3,
  blockColor: '#90EE90',
  blockOpacity: 0.35
};
const resultBlob = await processImagePair(originalFile, annotatedFile, customOptions);

// 下载结果
const url = URL.createObjectURL(resultBlob);
const a = document.createElement('a');
a.href = url;
a.download = 'merged.png';
a.click();
```

**错误处理**：
- 图片加载失败时抛出异常
- 建议使用 try-catch 包裹调用

---

### generatePreview()

**预览生成函数** - 生成多阶段预览图的 Data URL。

```typescript
async function generatePreview(
  originalFile: File,
  annotatedFile: File,
  options?: ProcessingOptions
): Promise<{
  original: string;
  annotated: string;
  annotationLayer: string;
  annotatedWithBlock: string;
  result: string;
}>
```

**参数**：

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `originalFile` | `File` | 是 | 原始清晰图片文件 |
| `annotatedFile` | `File` | 是 | AI 标注图片文件 |
| `options` | `ProcessingOptions` | 否 | 处理选项 |

**返回值**：包含五个 Data URL 的对象

| 字段 | 说明 |
|------|------|
| `original` | 原始图片的 Data URL |
| `annotated` | 缩放后标注图的 Data URL |
| `annotationLayer` | 文字遮罩预览（红色半透明标记文字区域） |
| `annotatedWithBlock` | 标注图 + 色块叠加的中间状态 |
| `result` | 最终合成结果 |

**使用示例**：

```typescript
import { generatePreview } from './imageProcessor';

const previews = await generatePreview(originalFile, annotatedFile, options);

// 在 React 中使用
<img src={previews.original} alt="原图" />
<img src={previews.annotationLayer} alt="遮罩预览" />
<img src={previews.result} alt="最终结果" />
```

**应用场景**：
- 实时预览处理效果
- 调试遮罩检测参数
- 对比查看处理各阶段

---

### loadImage()

**图片加载函数** - 将 File 对象加载为 HTMLImageElement。

```typescript
function loadImage(file: File): Promise<HTMLImageElement>
```

**参数**：

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `file` | `File` | 是 | 图片文件对象 |

**返回值**：`Promise<HTMLImageElement>` - 加载完成的图片元素

**使用示例**：

```typescript
import { loadImage } from './imageProcessor';

const img = await loadImage(file);
console.log(`图片尺寸: ${img.width} x ${img.height}`);
```

**注意事项**：
- 内部使用 `URL.createObjectURL()` 创建临时 URL
- 图片加载失败时 Promise 会 reject

---

### getImageData()

**像素数据提取函数** - 从 HTMLImageElement 获取 ImageData。

```typescript
function getImageData(img: HTMLImageElement): ImageData
```

**参数**：

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `img` | `HTMLImageElement` | 是 | 已加载的图片元素 |

**返回值**：`ImageData` - 包含像素数据的对象

**使用示例**：

```typescript
import { loadImage, getImageData } from './imageProcessor';

const img = await loadImage(file);
const imageData = getImageData(img);

// 访问像素数据
const { width, height, data } = imageData;
// data 是 Uint8ClampedArray，每 4 个元素表示一个像素的 RGBA 值
```

---

### imageDataToBlob()

**Blob 转换函数** - 将 ImageData 转换为 Blob。

```typescript
function imageDataToBlob(
  imageData: ImageData,
  type?: string
): Promise<Blob>
```

**参数**：

| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `imageData` | `ImageData` | 是 | - | 像素数据对象 |
| `type` | `string` | 否 | `'image/png'` | MIME 类型 |

**返回值**：`Promise<Blob>` - 图片 Blob 对象

---

### imageDataToDataURL()

**Data URL 转换函数** - 将 ImageData 转换为 Base64 Data URL。

```typescript
function imageDataToDataURL(imageData: ImageData): string
```

**参数**：

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `imageData` | `ImageData` | 是 | 像素数据对象 |

**返回值**：`string` - PNG 格式的 Data URL

**使用示例**：

```typescript
const dataUrl = imageDataToDataURL(imageData);
// 可直接用于 <img src={dataUrl} />
```

---

## 预设管理 API

### loadUserPresets()

**加载预设** - 从 localStorage 加载用户预设列表。

```typescript
function loadUserPresets(): Preset[]
```

**返回值**：`Preset[]` - 预设数组，首次使用返回默认预设

**使用示例**：

```typescript
import { loadUserPresets } from './imageProcessor';

const presets = loadUserPresets();
console.log(`已加载 ${presets.length} 个预设`);
```

**存储键**：`note-image-overlay.userPresets`

---

### saveUserPresets()

**保存预设** - 将预设列表保存到 localStorage。

```typescript
function saveUserPresets(presets: Preset[]): void
```

**参数**：

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `presets` | `Preset[]` | 是 | 要保存的预设数组 |

**注意事项**：
- 自动截断至 `MAX_PRESETS`（4 个）
- 静默处理存储异常

---

### addUserPreset()

**添加预设** - 创建新的用户预设。

```typescript
function addUserPreset(
  name: string,
  options: ProcessingOptions,
  existing: Preset[]
): Preset[]
```

**参数**：

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `name` | `string` | 是 | 预设名称 |
| `options` | `ProcessingOptions` | 是 | 处理选项 |
| `existing` | `Preset[]` | 是 | 现有预设列表 |

**返回值**：`Preset[]` - 更新后的预设列表

**使用示例**：

```typescript
import { addUserPreset, loadUserPresets } from './imageProcessor';

const currentPresets = loadUserPresets();
const newPresets = addUserPreset('我的高亮', {
  textThreshold: 190,
  maskExpand: 3,
  blockColor: '#FF6B6B',
  blockOpacity: 0.4
}, currentPresets);
```

**限制**：
- 达到 `MAX_PRESETS` 上限时返回原列表不做修改
- 新预设 ID 格式：`preset-{timestamp}`

---

### removeUserPreset()

**删除预设** - 根据 ID 删除预设。

```typescript
function removeUserPreset(id: string, existing: Preset[]): Preset[]
```

**参数**：

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `id` | `string` | 是 | 要删除的预设 ID |
| `existing` | `Preset[]` | 是 | 现有预设列表 |

**返回值**：`Preset[]` - 更新后的预设列表

**使用示例**：

```typescript
const updatedPresets = removeUserPreset('preset-1706745600000', currentPresets);
```

---

### updateUserPreset()

**更新预设** - 更新指定预设的处理选项。

```typescript
function updateUserPreset(
  id: string,
  options: ProcessingOptions,
  existing: Preset[]
): Preset[]
```

**参数**：

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `id` | `string` | 是 | 要更新的预设 ID |
| `options` | `ProcessingOptions` | 是 | 新的处理选项 |
| `existing` | `Preset[]` | 是 | 现有预设列表 |

**返回值**：`Preset[]` - 更新后的预设列表

**使用示例**：

```typescript
const updatedPresets = updateUserPreset('highlight-yellow', {
  textThreshold: 210,
  maskExpand: 2,
  blockColor: '#FFFF00',
  blockOpacity: 0.25
}, currentPresets);
```

---

### resetToDefaultPresets()

**重置预设** - 恢复为默认预设列表。

```typescript
function resetToDefaultPresets(): Preset[]
```

**返回值**：`Preset[]` - 默认预设列表

**使用示例**：

```typescript
import { resetToDefaultPresets } from './imageProcessor';

const defaultPresets = resetToDefaultPresets();
// localStorage 已同步更新
```

---

## 文件工具 API

### downloadSingleResult()

**单文件下载** - 处理图片对并触发下载。

```typescript
async function downloadSingleResult(
  originalFile: File,
  annotatedFile: File,
  options?: ProcessingOptions
): Promise<void>
```

**参数**：

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `originalFile` | `File` | 是 | 原始图片文件 |
| `annotatedFile` | `File` | 是 | 标注图片文件 |
| `options` | `ProcessingOptions` | 否 | 处理选项 |

**输出文件名**：`{原文件名}_merged.png`

**使用示例**：

```typescript
import { downloadSingleResult } from './fileUtils';

await downloadSingleResult(originalFile, annotatedFile, options);
// 浏览器自动触发下载
```

**依赖**：
- `file-saver` 库的 `saveAs` 函数
- `processImagePair` 进行图像处理

---

### downloadBatchResults()

**批量下载** - 处理多对图片并打包为 ZIP 下载。

```typescript
async function downloadBatchResults(
  pairs: ImagePair[],
  options?: ProcessingOptions,
  onProgress?: (current: number, total: number) => void
): Promise<void>
```

**参数**：

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `pairs` | `ImagePair[]` | 是 | 图片对数组 |
| `options` | `ProcessingOptions` | 否 | 处理选项 |
| `onProgress` | `function` | 否 | 进度回调函数 |

**输出文件名**：`merged_images.zip`

**使用示例**：

```typescript
import { downloadBatchResults } from './fileUtils';

await downloadBatchResults(imagePairs, options, (current, total) => {
  console.log(`处理进度: ${current}/${total}`);
  setProgress(Math.round((current / total) * 100));
});
```

**错误处理**：
- 单个图片处理失败不会中断整体流程
- 失败的图片会在控制台输出错误日志

**依赖**：
- `jszip` 库用于创建 ZIP 文件
- `file-saver` 库触发下载

---

### isImageFile()

**图片类型验证** - 检查文件是否为图片类型。

```typescript
function isImageFile(file: File): boolean
```

**参数**：

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `file` | `File` | 是 | 要检查的文件 |

**返回值**：`boolean` - 是否为图片文件

**使用示例**：

```typescript
import { isImageFile } from './fileUtils';

const handleFileSelect = (file: File) => {
  if (!isImageFile(file)) {
    alert('请选择图片文件');
    return;
  }
  // 处理图片...
};
```

**判断逻辑**：检查 `file.type` 是否以 `image/` 开头

---

### formatFileSize()

**文件大小格式化** - 将字节数转换为可读字符串。

```typescript
function formatFileSize(bytes: number): string
```

**参数**：

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `bytes` | `number` | 是 | 文件大小（字节） |

**返回值**：`string` - 格式化后的大小字符串

**使用示例**：

```typescript
import { formatFileSize } from './fileUtils';

formatFileSize(0);        // "0 Bytes"
formatFileSize(1024);     // "1 KB"
formatFileSize(1536);     // "1.5 KB"
formatFileSize(1048576);  // "1 MB"
formatFileSize(1073741824); // "1 GB"
```

---

### generateId()

**ID 生成** - 生成唯一标识符。

```typescript
function generateId(): string
```

**返回值**：`string` - 9 位随机字符串（Base36 编码）

**使用示例**：

```typescript
import { generateId } from './fileUtils';

const id = generateId(); // 例如: "k7x9m2p4q"
```

---

### getBaseName()

**基础名称提取** - 从文件名中移除扩展名。

```typescript
function getBaseName(filename: string): string
```

**参数**：

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `filename` | `string` | 是 | 完整文件名 |

**返回值**：`string` - 不含扩展名的文件名

**使用示例**：

```typescript
import { getBaseName } from './fileUtils';

getBaseName('photo.png');      // "photo"
getBaseName('my.file.jpg');    // "my.file"
getBaseName('noextension');    // "noextension"
```

---

### getExtension()

**扩展名提取** - 获取文件扩展名。

```typescript
function getExtension(filename: string): string
```

**参数**：

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `filename` | `string` | 是 | 完整文件名 |

**返回值**：`string` - 文件扩展名（含点号），无扩展名时返回 `.png`

**使用示例**：

```typescript
import { getExtension } from './fileUtils';

getExtension('photo.png');   // ".png"
getExtension('image.jpeg');  // ".jpeg"
getExtension('noext');       // ".png" (默认值)
```

---

## 常量与默认值

### defaultProcessingOptions

默认处理选项常量。

```typescript
const defaultProcessingOptions: ProcessingOptions = {
  textThreshold: 200,
  maskExpand: 2,
  blockColor: '#FFFF00',
  blockOpacity: 0.3,
};
```

---

### defaultPresets

默认预设列表。

```typescript
const defaultPresets: Preset[] = [
  {
    id: 'highlight-yellow',
    name: '黄色高亮',
    description: '经典荧光笔效果，适合大多数场景',
    options: { textThreshold: 200, maskExpand: 2, blockColor: '#FFFF00', blockOpacity: 0.3 }
  },
  {
    id: 'highlight-green',
    name: '绿色高亮',
    description: '清新标记，适合长时间阅读',
    options: { textThreshold: 200, maskExpand: 2, blockColor: '#90EE90', blockOpacity: 0.35 }
  },
  {
    id: 'highlight-pink',
    name: '粉色高亮',
    description: '柔和标记，温馨风格',
    options: { textThreshold: 200, maskExpand: 2, blockColor: '#FFB6C1', blockOpacity: 0.35 }
  },
  {
    id: 'highlight-blue',
    name: '蓝色高亮',
    description: '冷静专业，适合技术文档',
    options: { textThreshold: 200, maskExpand: 2, blockColor: '#87CEEB', blockOpacity: 0.3 }
  }
];
```

---

### 其他常量

| 常量 | 值 | 说明 |
|------|-----|------|
| `USER_PRESETS_KEY` | `'note-image-overlay.userPresets'` | localStorage 存储键 |
| `MAX_PRESETS` | `4` | 最大预设数量限制 |
| `presets` | `defaultPresets` | 兼容旧代码的别名 |

---

## API 依赖关系图

```
┌─────────────────────────────────────────────────────────────┐
│                      应用层 (App.tsx)                        │
├─────────────────────────────────────────────────────────────┤
│  downloadSingleResult()  │  downloadBatchResults()          │
│          ↓               │          ↓                       │
│  processImagePair()      │  processImagePair() (循环)       │
│          ↓               │          ↓                       │
│  ┌───────────────────────────────────────────┐              │
│  │           图像处理核心流程                  │              │
│  │  loadImage() → getImageData()             │              │
│  │       ↓                                   │              │
│  │  scaleImageData() (如需)                  │              │
│  │       ↓                                   │              │
│  │  extractTextMask()                        │              │
│  │       ↓                                   │              │
│  │  applyColorBlock()                        │              │
│  │       ↓                                   │              │
│  │  imageDataToBlob() / imageDataToDataURL() │              │
│  └───────────────────────────────────────────┘              │
├─────────────────────────────────────────────────────────────┤
│                    预设管理 (独立模块)                        │
│  loadUserPresets() ←→ saveUserPresets()                     │
│  addUserPreset() / removeUserPreset() / updateUserPreset()  │
│  resetToDefaultPresets()                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 跨模块集成示例

### 完整单图处理流程

```typescript
import { 
  processImagePair, 
  generatePreview,
  loadUserPresets,
  type ProcessingOptions 
} from './utils/imageProcessor';
import { downloadSingleResult, isImageFile } from './utils/fileUtils';

// 1. 验证文件
if (!isImageFile(originalFile) || !isImageFile(annotatedFile)) {
  throw new Error('请选择有效的图片文件');
}

// 2. 加载用户预设
const presets = loadUserPresets();
const selectedOptions = presets[0].options;

// 3. 生成预览
const previews = await generatePreview(originalFile, annotatedFile, selectedOptions);
// 显示 previews.result 供用户确认

// 4. 确认后下载
await downloadSingleResult(originalFile, annotatedFile, selectedOptions);
```

### 完整批量处理流程

```typescript
import { loadUserPresets } from './utils/imageProcessor';
import { 
  downloadBatchResults, 
  generateId, 
  isImageFile,
  type ImagePair 
} from './utils/fileUtils';

// 1. 构建图片对
const pairs: ImagePair[] = files.map((original, index) => ({
  id: generateId(),
  originalFile: original,
  annotatedFile: annotatedFiles[index],
  originalName: original.name
}));

// 2. 获取处理选项
const options = loadUserPresets()[0].options;

// 3. 批量处理并下载
await downloadBatchResults(pairs, options, (current, total) => {
  updateProgressBar(current / total * 100);
});
```

---

*文档生成时间: 2026-02-01*
*源文件: imageProcessor.ts, fileUtils.ts*
