/**
 * 主线程回退实现
 * 当浏览器不支持 Web Worker 或 OffscreenCanvas 时使用
 * 依赖 DOM API（HTMLImageElement、document.createElement）
 */

import type { ProcessingOptions } from './imageProcessorCore';
import {
  defaultProcessingOptions,
  extractTextMask,
  applyColorBlock,
  applyColorBlockToAnnotated,
  generateMaskPreview,
} from './imageProcessorCore';

/**
 * 加载图片为 HTMLImageElement
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };
    img.src = objectUrl;
  });
}

/**
 * 从 HTMLImageElement 获取 ImageData
 */
function getImageData(img: HTMLImageElement): ImageData {
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
  targetCtx.imageSmoothingQuality = 'high';
  targetCtx.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);

  return targetCtx.getImageData(0, 0, targetWidth, targetHeight);
}

/**
 * 将 ImageData 转换为 DataURL
 */
function imageDataToDataURL(imageData: ImageData): string {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d')!;
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * 将 ImageData 转换为 Blob
 */
function imageDataToBlob(imageData: ImageData, type = 'image/png'): Promise<Blob> {
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
 * 生成预览数据（回退实现，返回 DataURL）
 */
export async function generatePreviewFallback(
  originalFile: File,
  annotatedFile: File,
  options: ProcessingOptions = defaultProcessingOptions
): Promise<{
  original: string;
  annotated: string;
  annotationLayer: string;
  annotatedWithBlock: string;
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

  const textMask = extractTextMask(
    originalData,
    options.textThreshold,
    options.maskExpand,
    options.paddingLeft,
    options.paddingRight
  );
  const maskPreview = generateMaskPreview(originalData, textMask);

  const annotatedWithBlockData = applyColorBlockToAnnotated(
    scaledAnnotatedData,
    textMask,
    options.blockColor,
    options.blockOpacity
  );

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
    annotatedWithBlock: imageDataToDataURL(annotatedWithBlockData),
    result: imageDataToDataURL(resultData),
  };
}

/**
 * 处理图片对（回退实现，返回 Blob）
 */
export async function processImagePairFallback(
  originalFile: File,
  annotatedFile: File,
  options: ProcessingOptions = defaultProcessingOptions
): Promise<Blob> {
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

  const textMask = extractTextMask(
    originalData,
    options.textThreshold,
    options.maskExpand,
    options.paddingLeft,
    options.paddingRight
  );
  const resultData = applyColorBlock(
    originalData,
    scaledAnnotatedData,
    textMask,
    options.blockColor,
    options.blockOpacity
  );

  return imageDataToBlob(resultData);
}
