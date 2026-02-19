export type AlignMode = 'stretch' | 'fitWidthPadHeight';

export interface AlignLayout {
  mode: AlignMode;
  targetWidth: number;
  targetHeight: number;
  drawWidth: number;
  drawHeight: number;
  offsetX: number;
  offsetY: number;
}

export interface AlignLayoutInput {
  originalWidth: number;
  originalHeight: number;
  annotatedWidth: number;
  annotatedHeight: number;
  alignMode: AlignMode;
}

export function computeAlignLayout(input: AlignLayoutInput): AlignLayout {
  const {
    originalWidth,
    originalHeight,
    annotatedWidth,
    annotatedHeight,
    alignMode,
  } = input;

  if (
    originalWidth <= 0 ||
    originalHeight <= 0 ||
    annotatedWidth <= 0 ||
    annotatedHeight <= 0
  ) {
    throw new Error('Invalid image size');
  }

  if (alignMode === 'stretch') {
    return {
      mode: 'stretch',
      targetWidth: originalWidth,
      targetHeight: originalHeight,
      drawWidth: originalWidth,
      drawHeight: originalHeight,
      offsetX: 0,
      offsetY: 0,
    };
  }

  const ratio = originalWidth / annotatedWidth;
  const scaledHeight = Math.max(1, Math.round(annotatedHeight * ratio));
  const diff = originalHeight - scaledHeight;
  const topPad = diff > 0 ? Math.floor(diff / 2) : 0;

  return {
    mode: 'fitWidthPadHeight',
    targetWidth: originalWidth,
    targetHeight: originalHeight,
    drawWidth: originalWidth,
    drawHeight: scaledHeight,
    offsetX: 0,
    offsetY: topPad,
  };
}

export function parseHexColorToRgb(
  color: string,
  fallback: { r: number; g: number; b: number } = { r: 255, g: 255, b: 255 }
): { r: number; g: number; b: number } {
  const hex = color.trim().replace('#', '');

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

  return fallback;
}

