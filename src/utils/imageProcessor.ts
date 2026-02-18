/**
 * 图像处理门面模块
 * 自动检测 Web Worker + OffscreenCanvas 支持，优先在 Worker 线程处理
 * 不支持时回退到主线程同步实现
 */

import {
  defaultProcessingOptions,
  type ProcessingOptions,
} from './imageProcessorCore';

// 重新导出核心类型和常量
export { defaultProcessingOptions };
export type { ProcessingOptions };

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
      paddingLeft: 0,
      paddingRight: 0,
      paddingTop: 0,
      paddingBottom: 0,
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
      paddingLeft: 0,
      paddingRight: 0,
      paddingTop: 0,
      paddingBottom: 0,
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
      paddingLeft: 0,
      paddingRight: 0,
      paddingTop: 0,
      paddingBottom: 0,
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
      paddingLeft: 0,
      paddingRight: 0,
      paddingTop: 0,
      paddingBottom: 0,
    }
  }
];

// 兼容旧代码
export const presets = defaultPresets;

const USER_PRESETS_KEY = 'note-image-overlay.userPresets';
const MAX_PRESETS = 4;

function normalizeOptions(options: Partial<ProcessingOptions> | undefined): ProcessingOptions {
  return {
    textThreshold: typeof options?.textThreshold === 'number' ? options.textThreshold : defaultProcessingOptions.textThreshold,
    maskExpand: typeof options?.maskExpand === 'number' ? options.maskExpand : defaultProcessingOptions.maskExpand,
    blockColor: typeof options?.blockColor === 'string' ? options.blockColor : defaultProcessingOptions.blockColor,
    blockOpacity: typeof options?.blockOpacity === 'number' ? options.blockOpacity : defaultProcessingOptions.blockOpacity,
    paddingLeft: typeof options?.paddingLeft === 'number' ? options.paddingLeft : defaultProcessingOptions.paddingLeft,
    paddingRight: typeof options?.paddingRight === 'number' ? options.paddingRight : defaultProcessingOptions.paddingRight,
    paddingTop: typeof options?.paddingTop === 'number' ? options.paddingTop : defaultProcessingOptions.paddingTop,
    paddingBottom: typeof options?.paddingBottom === 'number' ? options.paddingBottom : defaultProcessingOptions.paddingBottom,
  };
}

function normalizePreset(preset: Partial<Preset>): Preset | null {
  if (typeof preset.id !== 'string' || typeof preset.name !== 'string') {
    return null;
  }
  return {
    id: preset.id,
    name: preset.name,
    description: typeof preset.description === 'string' ? preset.description : '自定义预设',
    options: normalizeOptions(preset.options),
  };
}

export function loadUserPresets(): Preset[] {
  try {
    const saved = localStorage.getItem(USER_PRESETS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as unknown;
      if (Array.isArray(parsed)) {
        const normalized = parsed
          .map((item) => normalizePreset(item as Partial<Preset>))
          .filter((item): item is Preset => item !== null)
          .slice(0, MAX_PRESETS);

        if (normalized.length > 0) {
          return normalized;
        }
      }
    }
  } catch { /* ignore */ }
  return defaultPresets.map((preset) => ({
    ...preset,
    options: normalizeOptions(preset.options),
  }));
}

export function saveUserPresets(presets: Preset[]): void {
  try {
    localStorage.setItem(USER_PRESETS_KEY, JSON.stringify(presets.slice(0, MAX_PRESETS)));
  } catch { /* ignore */ }
}

export function addUserPreset(name: string, options: ProcessingOptions, existing: Preset[]): Preset[] {
  if (existing.length >= MAX_PRESETS) {
    return existing;
  }
  const newPreset: Preset = {
    id: `preset-${Date.now()}`,
    name,
    description: '自定义预设',
    options: normalizeOptions(options),
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
  const updated = existing.map((p) => (p.id === id ? { ...p, options: normalizeOptions(options) } : p));
  saveUserPresets(updated);
  return updated;
}

export function resetToDefaultPresets(): Preset[] {
  const defaults = [...defaultPresets];
  saveUserPresets(defaults);
  return defaults;
}

// ============ Worker 门面层 ============

type PreviewResult = {
  original: string;
  annotated: string;
  annotationLayer: string;
  annotatedWithBlock: string;
  result: string;
};

// Worker 响应类型
interface WorkerPreviewResponse {
  type: 'generatePreview';
  id: number;
  result: {
    original: Blob;
    annotated: Blob;
    annotationLayer: Blob;
    annotatedWithBlock: Blob;
    result: Blob;
  };
}

interface WorkerProcessResponse {
  type: 'processImagePair';
  id: number;
  result: Blob;
}

interface WorkerErrorResponse {
  type: 'error';
  id: number;
  error: string;
}

type WorkerResponse = WorkerPreviewResponse | WorkerProcessResponse | WorkerErrorResponse;

// 检测 Worker + OffscreenCanvas 支持
const workerSupported = typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined';

// 单例 Worker 实例
let worker: Worker | null = null;
let nextId = 0;
const pending = new Map<number, { resolve: (value: unknown) => void; reject: (reason: unknown) => void }>();

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(
      new URL('./imageProcessor.worker.ts', import.meta.url),
      { type: 'module' }
    );
    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const { id } = e.data;
      const handlers = pending.get(id);
      if (!handlers) return;
      pending.delete(id);
      if (e.data.type === 'error') {
        handlers.reject(new Error(e.data.error));
      } else {
        handlers.resolve(e.data.result);
      }
    };
    worker.onerror = (e) => {
      // Worker 发生未捕获错误时，拒绝所有 pending 请求
      const error = new Error(e.message || 'Worker error');
      for (const [id, handlers] of pending) {
        handlers.reject(error);
        pending.delete(id);
      }
    };
  }
  return worker;
}

function sendToWorker<T>(message: Record<string, unknown>): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, {
      resolve: resolve as (value: unknown) => void,
      reject,
    });
    getWorker().postMessage({ ...message, id });
  });
}

// 回退模块缓存
let fallbackModule: typeof import('./imageProcessorFallback') | null = null;

async function getFallback() {
  if (!fallbackModule) {
    fallbackModule = await import('./imageProcessorFallback');
  }
  return fallbackModule;
}

/**
 * 生成预览数据
 * Worker 路径返回 Object URL，Fallback 路径返回 DataURL
 * 两者都可直接用于 <img src>
 */
export async function generatePreview(
  originalFile: File,
  annotatedFile: File,
  options: ProcessingOptions
): Promise<PreviewResult> {
  if (workerSupported) {
    const blobs = await sendToWorker<WorkerPreviewResponse['result']>({
      type: 'generatePreview',
      originalFile,
      annotatedFile,
      options,
    });
    return {
      original: URL.createObjectURL(blobs.original),
      annotated: URL.createObjectURL(blobs.annotated),
      annotationLayer: URL.createObjectURL(blobs.annotationLayer),
      annotatedWithBlock: URL.createObjectURL(blobs.annotatedWithBlock),
      result: URL.createObjectURL(blobs.result),
    };
  }

  const fallback = await getFallback();
  return fallback.generatePreviewFallback(originalFile, annotatedFile, options);
}

/**
 * 处理图片对，返回 Blob
 */
export async function processImagePair(
  originalFile: File,
  annotatedFile: File,
  options: ProcessingOptions
): Promise<Blob> {
  if (workerSupported) {
    return sendToWorker<Blob>({
      type: 'processImagePair',
      originalFile,
      annotatedFile,
      options,
    });
  }

  const fallback = await getFallback();
  return fallback.processImagePairFallback(originalFile, annotatedFile, options);
}
