/**
 * 图像处理核心纯计算模块
 * 不依赖 DOM，可在 Web Worker 中运行
 */

import { euclideanDistanceTransform } from './distanceTransform';

export interface ProcessingOptions {
  /** 文字检测亮度阈值 (0-255)，低于此值的像素被视为文字 */
  textThreshold: number;
  /** 遮罩膨胀半径 (像素)，用于确保完全覆盖文字 */
  maskExpand: number;
  /** 色块颜色 (CSS颜色值) */
  blockColor: string;
  /** 色块透明度 (0-1) */
  blockOpacity: number;
  /** 色块左侧补偿 (像素)，向左扩展色块条边界 */
  paddingLeft: number;
  /** 色块右侧补偿 (像素)，向右扩展色块条边界 */
  paddingRight: number;
}

export const defaultProcessingOptions: ProcessingOptions = {
  textThreshold: 200,
  maskExpand: 2,
  blockColor: '#FFFF00',
  blockOpacity: 0.3,
  paddingLeft: 0,
  paddingRight: 0,
};

/**
 * 解析 CSS 颜色值为 RGB
 * 支持 HEX 格式: #RGB, #RRGGBB
 */
export function parseColor(color: string): { r: number; g: number; b: number } {
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
export function getLuminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * 提取文字区域遮罩
 * 返回一个布尔数组，标记哪些像素是文字区域
 */
export function extractTextMask(
  imageData: ImageData,
  textThreshold: number,
  expandRadius: number,
  paddingLeft: number = 0,
  paddingRight: number = 0
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

  // 第二步：距离变换膨胀遮罩（替代圆形膨胀，O(W×H) 复杂度）
  let currentMask = mask;
  if (expandRadius > 0) {
    const distSq = euclideanDistanceTransform(mask, width, height);

    const thresholdSq = expandRadius * expandRadius;
    const expandedMask = new Array<boolean>(width * height);
    for (let i = 0; i < width * height; i++) {
      expandedMask[i] = distSq[i] <= thresholdSq;
    }
    currentMask = expandedMask;
  }

  // 第三步：行级别水平合并（同一行内的文字区域合并为色块条）+ 左右补偿
  const mergedMask = new Array<boolean>(width * height).fill(false);

  for (let y = 0; y < height; y++) {
    let minX = -1;
    let maxX = -1;

    // 找到该行的最左和最右文字像素
    for (let x = 0; x < width; x++) {
      if (currentMask[y * width + x]) {
        if (minX === -1) {
          minX = x;
        }
        maxX = x;
      }
    }

    // 填充该行从 minX 到 maxX 的所有像素，并应用左右补偿
    if (minX !== -1 && maxX !== -1) {
      const paddedMinX = Math.max(0, minX - paddingLeft);
      const paddedMaxX = Math.min(width - 1, maxX + paddingRight);
      for (let x = paddedMinX; x <= paddedMaxX; x++) {
        mergedMask[y * width + x] = true;
      }
    }
  }

  return mergedMask;
}

/**
 * 在遮罩区域应用色块叠加
 * 文字区域：使用正片叠底（Multiply）模式合成，原图在上，色块在下
 * 非文字区域：保持标注图原样（保留 AI 标注）
 *
 * 正片叠底公式：Result = (原图 × 色块背景) / 255
 * - 原图白色(255) × 色块 = 色块颜色（白色"透明"）
 * - 原图黑色(0) × 色块 = 黑色（文字保留）
 * - 灰色自然过渡，无锯齿
 */
export function applyColorBlock(
  originalData: ImageData,
  annotatedData: ImageData,
  textMask: boolean[],
  blockColor: string,
  blockOpacity: number
): ImageData {
  const { width, height } = annotatedData;
  const outputData = new ImageData(width, height);
  const output = outputData.data;
  const original = originalData.data;
  const annotated = annotatedData.data;
  const color = parseColor(blockColor);

  // 预计算色块背景色（白色与色块混合，模拟高亮笔效果）
  const bgR = Math.round(255 * (1 - blockOpacity) + color.r * blockOpacity);
  const bgG = Math.round(255 * (1 - blockOpacity) + color.g * blockOpacity);
  const bgB = Math.round(255 * (1 - blockOpacity) + color.b * blockOpacity);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const maskIdx = y * width + x;

      if (textMask[maskIdx]) {
        // 文字区域：正片叠底合成（原图 × 色块背景 / 255）
        const r = original[idx];
        const g = original[idx + 1];
        const b = original[idx + 2];

        output[idx] = Math.round((r * bgR) / 255);
        output[idx + 1] = Math.round((g * bgG) / 255);
        output[idx + 2] = Math.round((b * bgB) / 255);
        output[idx + 3] = 255;
      } else {
        // 非文字区域：保持标注图原样（保留 AI 标注）
        output[idx] = annotated[idx];
        output[idx + 1] = annotated[idx + 1];
        output[idx + 2] = annotated[idx + 2];
        output[idx + 3] = 255;
      }
    }
  }

  return outputData;
}

/**
 * 在标注图上应用色块叠加（用于预览中间状态）
 * 文字区域：色块完全覆盖标注图的模糊文字
 *
 * 注意：这个函数处理的是标注图，标注图中的文字是模糊的，
 * 所以色块需要完全覆盖这些区域，而不是让模糊文字显示出来
 */
export function applyColorBlockToAnnotated(
  annotatedData: ImageData,
  textMask: boolean[],
  blockColor: string,
  blockOpacity: number
): ImageData {
  const { width, height } = annotatedData;
  const outputData = new ImageData(width, height);
  const output = outputData.data;
  const annotated = annotatedData.data;
  const color = parseColor(blockColor);

  // 预计算色块背景色（白色与色块混合，模拟高亮笔效果）
  const bgR = Math.round(255 * (1 - blockOpacity) + color.r * blockOpacity);
  const bgG = Math.round(255 * (1 - blockOpacity) + color.g * blockOpacity);
  const bgB = Math.round(255 * (1 - blockOpacity) + color.b * blockOpacity);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const maskIdx = y * width + x;

      if (textMask[maskIdx]) {
        // 文字区域：使用纯色块背景覆盖标注图的模糊文字
        // 不显示标注图中的任何内容，因为那里是模糊的文字
        output[idx] = bgR;
        output[idx + 1] = bgG;
        output[idx + 2] = bgB;
        output[idx + 3] = 255;
      } else {
        // 非文字区域：保持标注图原样
        output[idx] = annotated[idx];
        output[idx + 1] = annotated[idx + 1];
        output[idx + 2] = annotated[idx + 2];
        output[idx + 3] = 255;
      }
    }
  }

  return outputData;
}

/**
 * 生成遮罩预览图（用于调试和预览）
 */
export function generateMaskPreview(
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
        output[idx] = data[idx];
        output[idx + 1] = data[idx + 1];
        output[idx + 2] = data[idx + 2];
        output[idx + 3] = 255;
      }
    }
  }

  return outputData;
}
