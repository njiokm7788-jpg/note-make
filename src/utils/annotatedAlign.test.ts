import { describe, expect, it } from 'vitest';
import { computeAlignLayout, parseHexColorToRgb } from './annotatedAlign';

describe('computeAlignLayout', () => {
  it('stretch 模式应直接匹配原图尺寸', () => {
    const layout = computeAlignLayout({
      originalWidth: 1000,
      originalHeight: 800,
      annotatedWidth: 300,
      annotatedHeight: 200,
      alignMode: 'stretch',
    });

    expect(layout.drawWidth).toBe(1000);
    expect(layout.drawHeight).toBe(800);
    expect(layout.offsetY).toBe(0);
  });

  it('宽等比后高度不足时应上下平分补偿（奇数差值）', () => {
    const layout = computeAlignLayout({
      originalWidth: 1000,
      originalHeight: 1000,
      annotatedWidth: 1000,
      annotatedHeight: 333,
      alignMode: 'fitWidthPadHeight',
    });

    expect(layout.drawWidth).toBe(1000);
    expect(layout.drawHeight).toBe(333);
    // diff=667 -> top=333, bottom=334
    expect(layout.offsetY).toBe(333);
  });

  it('宽等比后高度相同时不补偿', () => {
    const layout = computeAlignLayout({
      originalWidth: 1000,
      originalHeight: 500,
      annotatedWidth: 2000,
      annotatedHeight: 1000,
      alignMode: 'fitWidthPadHeight',
    });

    expect(layout.drawHeight).toBe(500);
    expect(layout.offsetY).toBe(0);
  });

  it('宽等比后高度超出时保持顶部对齐（offsetY=0）', () => {
    const layout = computeAlignLayout({
      originalWidth: 1000,
      originalHeight: 500,
      annotatedWidth: 1000,
      annotatedHeight: 800,
      alignMode: 'fitWidthPadHeight',
    });

    expect(layout.drawHeight).toBe(800);
    expect(layout.offsetY).toBe(0);
  });
});

describe('parseHexColorToRgb', () => {
  it('应支持 6 位 HEX', () => {
    expect(parseHexColorToRgb('#12ABEF')).toEqual({ r: 18, g: 171, b: 239 });
  });

  it('应支持 3 位 HEX', () => {
    expect(parseHexColorToRgb('#0F8')).toEqual({ r: 0, g: 255, b: 136 });
  });

  it('非法值应回退到默认白色', () => {
    expect(parseHexColorToRgb('xyz')).toEqual({ r: 255, g: 255, b: 255 });
  });
});
