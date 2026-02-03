/**
 * 图像处理核心工具
 * 反向遮罩叠加模式：清晰图检测文字区域，模糊图对应位置添加色块
 */

export interface ProcessingOptions {
  /** 文字检测亮度阈值 (0-255)，低于此值的像素被视为文字 */
  textThreshold: number;
  /** 遮罩膨胀半径 (像素)，用于确保完全覆盖文字 */
  maskExpand: number;
  /** 色块颜色 (CSS颜色值) */
  blockColor: string;
  /** 色块透明度 (0-1) */
  blockOpacity: number;
}

export const defaultProcessingOptions: ProcessingOptions = {
  textThreshold: 200,
  maskExpand: 2,
  blockColor: '#FFFF00',
  blockOpacity: 0.3,
};

/**
 * 预设方案接口
 */
export interface Preset {
  id: string;
  name: string;
  description: string;
  options: ProcessingOptions;
}

/**
 * 默认预设方案列表
 */
export const defaultPresets: Preset[] = [
  {
    id: 'highlight-yellow',
    name: '黄色高亮',
    description: '经典荧光笔效果，适合大多数场景',
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
    description: '清新标记，适合长时间阅读',
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
    description: '柔和标记，温馨风格',
    options: {
      textThreshold: 200,
      maskExpand: 2,
      blockColor: '#FFB6C1',
      blockOpacity: 0.35,
    }
  },
  {
    id: 'highlight-blue',
    name: '蓝色高亮',
    description: '冷静专业，适合技术文档',
    options: {
      textThreshold: 200,
      maskExpand: 2,
      blockColor: '#87CEEB',
      blockOpacity: 0.3,
    }
  }
];

// 兼容旧代码
export const presets = defaultPresets;

const USER_PRESETS_KEY = 'note-image-overlay.userPresets';
const MAX_PRESETS = 4;

export function loadUserPresets(): Preset[] {
  try {
    const saved = localStorage.getItem(USER_PRESETS_KEY);
    if (saved) {
      return JSON.parse(saved) as Preset[];
    }
  } catch {}
  // 首次使用，返回默认预设
  return [...defaultPresets];
}

export function saveUserPresets(presets: Preset[]): void {
  try {
    localStorage.setItem(USER_PRESETS_KEY, JSON.stringify(presets.slice(0, MAX_PRESETS)));
  } catch {}
}

export function addUserPreset(name: string, options: ProcessingOptions, existing: Preset[]): Preset[] {
  if (existing.length >= MAX_PRESETS) {
    return existing;
  }
  const newPreset: Preset = {
    id: `preset-${Date.now()}`,
    name,
    description: '自定义预设',
    options,
  };
  const updated = [...existing, newPreset];
  saveUserPresets(updated);
  return updated;
}

export function removeUserPreset(id: string, existing: Preset[]): Preset[] {
  const updated = existing.filter(p => p.id !== id);
  saveUserPresets(updated);
  return updated;
}

export function updateUserPreset(id: string, options: ProcessingOptions, existing: Preset[]): Preset[] {
  const updated = existing.map(p => p.id === id ? { ...p, options } : p);
  saveUserPresets(updated);
  return updated;
}

export function resetToDefaultPresets(): Preset[] {
  const defaults = [...defaultPresets];
  saveUserPresets(defaults);
  return defaults;
}

/**
 * 解析 CSS 颜色值为 RGB
 * 支持 HEX 格式: #RGB, #RRGGBB
 */
function parseColor(color: string): { r: number; g: number; b: number } {
  const hex = color.replace('#', '');

  if (/^[0-9a-fA-F]{3}$/.test(hex)) {
    return {
      r: parseInt(hex[0] + hex[0], 16),
      g: parseInt(hex[1] + hex[1], 16),
      b: parseInt(hex[2] + hex[2], 16),
    };
  }

  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }

  // 默认返回黄色
  return { r: 255, g: 255, b: 0 };
}

/**
 * 计算像素亮度 (0-255)
 */
function getLuminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * 提取文字区域遮罩
 * 返回一个布尔数组，标记哪些像素是文字区域
 */
function extractTextMask(
  imageData: ImageData,
  textThreshold: number,
  expandRadius: number
): boolean[] {
  const { width, height, data } = imageData;
  const mask = new Array<boolean>(width * height).fill(false);

  // 第一步：检测暗色像素（文字）
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const luminance = getLuminance(data[idx], data[idx + 1], data[idx + 2]);

      // 亮度低于阈值的像素被视为文字
      if (luminance < textThreshold) {
        mask[y * width + x] = true;
      }
    }
  }

  // 第二步：圆形膨胀遮罩（扩展文字区域）
  if (expandRadius > 0) {
    const expandedMask = new Array<boolean>(width * height).fill(false);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (mask[y * width + x]) {
          for (let dy = -expandRadius; dy <= expandRadius; dy++) {
            for (let dx = -expandRadius; dx <= expandRadius; dx++) {
              const nx = x + dx;
              const ny = y + dy;

              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                if (dx * dx + dy * dy <= expandRadius * expandRadius) {
                  expandedMask[ny * width + nx] = true;
                }
              }
            }
          }
        }
      }
    }

    return expandedMask;
  }

  return mask;
}

/**
 * 在遮罩区域应用色块叠加
 * 文字区域：使用清晰原图
 * 非文字区域：在模糊图上叠加半透明色块
 */
function applyColorBlock(
  originalData: ImageData,
  annotatedData: ImageData,
  textMask: boolean[],
  blockColor: string,
  blockOpacity: number
): ImageData {
  const { width, height } = originalData;
  const outputData = new ImageData(width, height);
  const output = outputData.data;
  const original = originalData.data;
  const annotated = annotatedData.data;
  const color = parseColor(blockColor);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const maskIdx = y * width + x;

      if (textMask[maskIdx]) {
        // 文字区域：使用清晰原图
        output[idx] = original[idx];
        output[idx + 1] = original[idx + 1];
        output[idx + 2] = original[idx + 2];
        output[idx + 3] = 255;
      } else {
        // 非文字区域：在模糊图上叠加色块
        output[idx] = Math.round(annotated[idx] * (1 - blockOpacity) + color.r * blockOpacity);
        output[idx + 1] = Math.round(annotated[idx + 1] * (1 - blockOpacity) + color.g * blockOpacity);
        output[idx + 2] = Math.round(annotated[idx + 2] * (1 - blockOpacity) + color.b * blockOpacity);
        output[idx + 3] = 255;
      }
    }
  }

  return outputData;
}

/**
 * 生成遮罩预览图（用于调试和预览）
 */
function generateMaskPreview(
  originalData: ImageData,
  textMask: boolean[]
): ImageData {
  const { width, height, data } = originalData;
  const outputData = new ImageData(width, height);
  const output = outputData.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const maskIdx = y * width + x;

      if (textMask[maskIdx]) {
        // 文字区域：显示半透明红色
        output[idx] = Math.round(data[idx] * 0.5 + 255 * 0.5);
        output[idx + 1] = Math.round(data[idx + 1] * 0.5);
        output[idx + 2] = Math.round(data[idx + 2] * 0.5);
        output[idx + 3] = 255;
      } else {
        // 非文字区域：保持原样
        output[idx] = data[idx];
        output[idx + 1] = data[idx + 1];
        output[idx + 2] = data[idx + 2];
        output[idx + 3] = 255;
      }
    }
  }

  return outputData;
}

/**
 * 加载图片为 ImageData
 */
export function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * 从 HTMLImageElement 获取 ImageData
 */
export function getImageData(img: HTMLImageElement): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/**
 * 缩放 ImageData
 */
function scaleImageData(source: ImageData, targetWidth: number, targetHeight: number): ImageData {
  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = source.width;
  sourceCanvas.height = source.height;
  const sourceCtx = sourceCanvas.getContext('2d')!;
  sourceCtx.putImageData(source, 0, 0);

  const targetCanvas = document.createElement('canvas');
  targetCanvas.width = targetWidth;
  targetCanvas.height = targetHeight;
  const targetCtx = targetCanvas.getContext('2d')!;
  targetCtx.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);

  return targetCtx.getImageData(0, 0, targetWidth, targetHeight);
}

/**
 * 处理图片对
 * 完整的处理流程：加载 -> 提取遮罩 -> 色块叠加 -> 输出
 */
export async function processImagePair(
  originalFile: File,
  annotatedFile: File,
  options: ProcessingOptions = defaultProcessingOptions
): Promise<Blob> {
  // 加载图片
  const [originalImg, annotatedImg] = await Promise.all([
    loadImage(originalFile),
    loadImage(annotatedFile),
  ]);

  // 获取图片数据
  const originalData = getImageData(originalImg);
  const annotatedData = getImageData(annotatedImg);

  // 如果尺寸不同，缩放标注图到原图尺寸
  let scaledAnnotatedData = annotatedData;
  if (originalImg.width !== annotatedImg.width || originalImg.height !== annotatedImg.height) {
    scaledAnnotatedData = scaleImageData(annotatedData, originalData.width, originalData.height);
  }

  // 提取文字遮罩并应用色块叠加
  const textMask = extractTextMask(
    originalData,
    options.textThreshold,
    options.maskExpand
  );
  const resultData = applyColorBlock(
    originalData,
    scaledAnnotatedData,
    textMask,
    options.blockColor,
    options.blockOpacity
  );

  // 转换为 Blob
  return imageDataToBlob(resultData);
}

/**
 * 将 ImageData 转换为 Blob
 */
export function imageDataToBlob(imageData: ImageData, type = 'image/png'): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d')!;
    ctx.putImageData(imageData, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Failed to create blob'));
      }
    }, type);
  });
}

/**
 * 将 ImageData 转换为 DataURL（用于预览）
 */
export function imageDataToDataURL(imageData: ImageData): string {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d')!;
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * 生成预览数据
 */
export async function generatePreview(
  originalFile: File,
  annotatedFile: File,
  options: ProcessingOptions = defaultProcessingOptions
): Promise<{
  original: string;
  annotated: string;
  annotationLayer: string;
  result: string;
}> {
  const [originalImg, annotatedImg] = await Promise.all([
    loadImage(originalFile),
    loadImage(annotatedFile),
  ]);

  const originalData = getImageData(originalImg);
  const annotatedData = getImageData(annotatedImg);

  let scaledAnnotatedData = annotatedData;
  if (originalImg.width !== annotatedImg.width || originalImg.height !== annotatedImg.height) {
    scaledAnnotatedData = scaleImageData(annotatedData, originalData.width, originalData.height);
  }

  // 提取文字遮罩
  const textMask = extractTextMask(
    originalData,
    options.textThreshold,
    options.maskExpand
  );
  const maskPreview = generateMaskPreview(originalData, textMask);
  const resultData = applyColorBlock(
    originalData,
    scaledAnnotatedData,
    textMask,
    options.blockColor,
    options.blockOpacity
  );

  return {
    original: imageDataToDataURL(originalData),
    annotated: imageDataToDataURL(scaledAnnotatedData),
    annotationLayer: imageDataToDataURL(maskPreview),
    result: imageDataToDataURL(resultData),
  };
}
