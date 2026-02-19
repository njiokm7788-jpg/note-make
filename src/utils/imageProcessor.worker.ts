/**
 * 图像处理 Web Worker
 * 在独立线程中执行 CPU 密集的像素操作，避免阻塞 UI
 */

import type { ProcessingOptions } from './imageProcessorCore';
import {
  extractTextMask,
  applyColorBlock,
  applyColorBlockToAnnotated,
  generateMaskPreview,
} from './imageProcessorCore';
import { canvasPool } from './canvasPool';
import { computeAlignLayout, parseHexColorToRgb } from './annotatedAlign';

// Worker 消息类型
interface GeneratePreviewRequest {
  type: 'generatePreview';
  id: number;
  originalFile: File;
  annotatedFile: File;
  options: ProcessingOptions;
}

interface ProcessImagePairRequest {
  type: 'processImagePair';
  id: number;
  originalFile: File;
  annotatedFile: File;
  options: ProcessingOptions;
}

type WorkerRequest = GeneratePreviewRequest | ProcessImagePairRequest;

/**
 * 使用 OffscreenCanvas + createImageBitmap 加载图片并获取 ImageData
 */
function getImageDataFromBitmap(bitmap: ImageBitmap): ImageData {
  const canvas = canvasPool.acquire(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0);
  const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
  canvasPool.release(canvas);
  return imageData;
}

/**
 * 缩放 ImageData 到目标尺寸
 */
function scaleImageData(source: ImageData, targetWidth: number, targetHeight: number): ImageData {
  const sourceCanvas = canvasPool.acquire(source.width, source.height);
  const sourceCtx = sourceCanvas.getContext('2d')!;
  sourceCtx.putImageData(source, 0, 0);

  const targetCanvas = canvasPool.acquire(targetWidth, targetHeight);
  const targetCtx = targetCanvas.getContext('2d')!;
  targetCtx.imageSmoothingQuality = 'high';
  targetCtx.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);
  const result = targetCtx.getImageData(0, 0, targetWidth, targetHeight);

  canvasPool.release(sourceCanvas);
  canvasPool.release(targetCanvas);
  return result;
}

function alignAnnotatedData(
  source: ImageData,
  targetWidth: number,
  targetHeight: number,
  alignMode: 'stretch' | 'fitWidthPadHeight',
  compensationFillColor: string
): ImageData {
  if (alignMode === 'stretch') {
    return scaleImageData(source, targetWidth, targetHeight);
  }

  const layout = computeAlignLayout({
    originalWidth: targetWidth,
    originalHeight: targetHeight,
    annotatedWidth: source.width,
    annotatedHeight: source.height,
    alignMode,
  });

  const sourceCanvas = canvasPool.acquire(source.width, source.height);
  const sourceCtx = sourceCanvas.getContext('2d')!;
  sourceCtx.putImageData(source, 0, 0);

  const targetCanvas = canvasPool.acquire(targetWidth, targetHeight);
  const targetCtx = targetCanvas.getContext('2d')!;
  targetCtx.imageSmoothingQuality = 'high';

  const fill = parseHexColorToRgb(compensationFillColor);
  targetCtx.fillStyle = `rgb(${fill.r}, ${fill.g}, ${fill.b})`;
  targetCtx.fillRect(0, 0, targetWidth, targetHeight);

  // drawHeight > targetHeight 时会自动发生顶部对齐裁剪（下方超出被裁掉）
  targetCtx.drawImage(
    sourceCanvas,
    0,
    0,
    source.width,
    source.height,
    layout.offsetX,
    layout.offsetY,
    layout.drawWidth,
    layout.drawHeight
  );

  const aligned = targetCtx.getImageData(0, 0, targetWidth, targetHeight);
  canvasPool.release(sourceCanvas);
  canvasPool.release(targetCanvas);
  return aligned;
}

/**
 * 将 ImageData 转换为 Blob（使用池化 OffscreenCanvas）
 */
function imageDataToBlob(imageData: ImageData): Promise<Blob> {
  const canvas = canvasPool.acquire(imageData.width, imageData.height);
  const ctx = canvas.getContext('2d')!;
  ctx.putImageData(imageData, 0, 0);
  return canvas.convertToBlob({ type: 'image/png' }).then(blob => {
    canvasPool.release(canvas);
    return blob;
  });
}

/**
 * 处理 generatePreview 请求
 */
async function handleGeneratePreview(req: GeneratePreviewRequest): Promise<void> {
  const [originalBitmap, annotatedBitmap] = await Promise.all([
    createImageBitmap(req.originalFile),
    createImageBitmap(req.annotatedFile),
  ]);

  const originalData = getImageDataFromBitmap(originalBitmap);
  const annotatedData = getImageDataFromBitmap(annotatedBitmap);
  originalBitmap.close();
  annotatedBitmap.close();

  const scaledAnnotatedData = alignAnnotatedData(
    annotatedData,
    originalData.width,
    originalData.height,
    req.options.alignMode,
    req.options.compensationFillColor
  );

  const {
    textThreshold,
    maskExpand,
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingBottom,
    blockColor,
    blockOpacity,
  } = req.options;

  const textMask = extractTextMask(
    originalData,
    textThreshold,
    maskExpand,
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingBottom
  );
  const maskPreview = generateMaskPreview(originalData, textMask);
  const annotatedWithBlockData = applyColorBlockToAnnotated(scaledAnnotatedData, textMask, blockColor, blockOpacity);
  const resultData = applyColorBlock(originalData, scaledAnnotatedData, textMask, blockColor, blockOpacity);

  // 并行将 5 个 ImageData 转为 Blob
  const [originalBlob, annotatedBlob, annotationLayerBlob, annotatedWithBlockBlob, resultBlob] =
    await Promise.all([
      imageDataToBlob(originalData),
      imageDataToBlob(scaledAnnotatedData),
      imageDataToBlob(maskPreview),
      imageDataToBlob(annotatedWithBlockData),
      imageDataToBlob(resultData),
    ]);

  self.postMessage({
    type: 'generatePreview',
    id: req.id,
    result: {
      original: originalBlob,
      annotated: annotatedBlob,
      annotationLayer: annotationLayerBlob,
      annotatedWithBlock: annotatedWithBlockBlob,
      result: resultBlob,
    },
  });
}

/**
 * 处理 processImagePair 请求
 */
async function handleProcessImagePair(req: ProcessImagePairRequest): Promise<void> {
  const [originalBitmap, annotatedBitmap] = await Promise.all([
    createImageBitmap(req.originalFile),
    createImageBitmap(req.annotatedFile),
  ]);

  const originalData = getImageDataFromBitmap(originalBitmap);
  const annotatedData = getImageDataFromBitmap(annotatedBitmap);
  originalBitmap.close();
  annotatedBitmap.close();

  const scaledAnnotatedData = alignAnnotatedData(
    annotatedData,
    originalData.width,
    originalData.height,
    req.options.alignMode,
    req.options.compensationFillColor
  );

  const {
    textThreshold,
    maskExpand,
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingBottom,
    blockColor,
    blockOpacity,
  } = req.options;

  const textMask = extractTextMask(
    originalData,
    textThreshold,
    maskExpand,
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingBottom
  );
  const resultData = applyColorBlock(originalData, scaledAnnotatedData, textMask, blockColor, blockOpacity);
  const resultBlob = await imageDataToBlob(resultData);

  self.postMessage({
    type: 'processImagePair',
    id: req.id,
    result: resultBlob,
  });
}

/**
 * Worker 消息分发
 */
self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const req = e.data;
  try {
    if (req.type === 'generatePreview') {
      await handleGeneratePreview(req);
    } else if (req.type === 'processImagePair') {
      await handleProcessImagePair(req);
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      id: req.id,
      error: error instanceof Error ? error.message : '未知错误',
    });
  }
};
