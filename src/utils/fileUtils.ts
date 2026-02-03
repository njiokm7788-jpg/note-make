import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { processImagePair, type ProcessingOptions, defaultProcessingOptions } from './imageProcessor';

export interface ImagePair {
  id: string;
  originalFile: File;
  annotatedFile: File;
  originalName: string;
}

/**
 * 生成唯一ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

/**
 * 从文件名中提取基础名称（不含扩展名）
 */
export function getBaseName(filename: string): string {
  return filename.replace(/\.[^/.]+$/, '');
}

/**
 * 获取文件扩展名
 */
export function getExtension(filename: string): string {
  const match = filename.match(/\.[^/.]+$/);
  return match ? match[0] : '.png';
}

/**
 * 下载单个处理结果
 */
export async function downloadSingleResult(
  originalFile: File,
  annotatedFile: File,
  options: ProcessingOptions = defaultProcessingOptions
): Promise<void> {
  const blob = await processImagePair(originalFile, annotatedFile, options);
  const baseName = getBaseName(originalFile.name);
  saveAs(blob, `${baseName}_merged.png`);
}

/**
 * 批量处理并打包下载
 * @param pairs 图片对数组
 * @param options 处理选项
 * @param onProgress 进度回调 (当前索引, 总数, 当前文件名, 是否成功, 错误信息)
 */
export async function downloadBatchResults(
  pairs: ImagePair[],
  options: ProcessingOptions = defaultProcessingOptions,
  onProgress?: (current: number, total: number, fileName: string, success: boolean, error?: string) => void
): Promise<void> {
  const zip = new JSZip();
  const total = pairs.length;

  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i];
    const fileName = pair.originalName;

    try {
      const blob = await processImagePair(pair.originalFile, pair.annotatedFile, options);
      const baseName = getBaseName(pair.originalName);
      zip.file(`${baseName}_merged.png`, blob);

      // 成功回调
      onProgress?.(i + 1, total, fileName, true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      console.error(`处理 ${fileName} 时出错:`, error);

      // 失败回调
      onProgress?.(i + 1, total, fileName, false, errorMessage);
    }
  }

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, 'merged_images.zip');
}

/**
 * 验证文件是否为图片
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
