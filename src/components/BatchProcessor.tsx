import { useState, useCallback, type ChangeEvent, type DragEvent } from 'react';
import {
  generateId,
  getBaseName,
  isImageFile,
  downloadBatchResults,
  type ImagePair,
} from '../utils/fileUtils';
import type { ProcessingOptions } from '../utils/imageProcessor';

interface BatchProcessorProps {
  options: ProcessingOptions;
}

export function BatchProcessor({ options }: BatchProcessorProps) {
  const [pairs, setPairs] = useState<ImagePair[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;

    const imageFiles = Array.from(files).filter(isImageFile);
    
    // 按文件名分组，假设原图和标注图有相似的文件名
    const fileMap = new Map<string, File[]>();
    
    imageFiles.forEach((file) => {
      const baseName = getBaseName(file.name)
        .replace(/_annotated|_marked|_标注|标注/gi, '');
      
      if (!fileMap.has(baseName)) {
        fileMap.set(baseName, []);
      }
      fileMap.get(baseName)!.push(file);
    });

    // 创建配对
    const newPairs: ImagePair[] = [];
    fileMap.forEach((fileGroup) => {
      if (fileGroup.length >= 2) {
        // 尝试识别原图和标注图
        const annotated = fileGroup.find(
          (f) => /annotated|marked|标注/i.test(f.name)
        );
        const original = fileGroup.find((f) => f !== annotated) || fileGroup[0];
        const actualAnnotated = annotated || fileGroup[1];

        if (original && actualAnnotated) {
          newPairs.push({
            id: generateId(),
            originalFile: original,
            annotatedFile: actualAnnotated,
            originalName: original.name,
          });
        }
      }
    });

    setPairs((prev) => [...prev, ...newPairs]);
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
    },
    [handleFiles]
  );

  const removePair = useCallback((id: string) => {
    setPairs((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleBatchProcess = useCallback(async () => {
    if (pairs.length === 0) return;

    setIsProcessing(true);
    setProgress({ current: 0, total: pairs.length });

    try {
      await downloadBatchResults(pairs, options, (current, total) => {
        setProgress({ current, total });
      });
    } catch (error) {
      console.error('批量处理出错:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [pairs, options]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800">批量处理</h2>
        <span className="text-sm text-slate-500">
          已添加 {pairs.length} 对图片
        </span>
      </div>

      {/* 上传区域 */}
      <div
        className={`
          border-2 border-dashed rounded-xl p-6 transition-all duration-200 cursor-pointer mb-4
          ${isDragging
            ? 'border-primary-500 bg-primary-50'
            : 'border-slate-300 bg-slate-50 hover:border-primary-400'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('batch-file-input')?.click()}
      >
        <input
          id="batch-file-input"
          type="file"
          accept="image/*"
          multiple
          onChange={handleInputChange}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-primary-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div className="text-sm text-slate-600">
            拖拽多个图片文件到此处，或{' '}
            <span className="text-primary-600 font-medium">点击选择</span>
          </div>
          <div className="text-xs text-slate-400">
            系统会自动匹配原图和标注图（基于文件名相似度）
          </div>
        </div>
      </div>

      {/* 配对列表 */}
      {pairs.length > 0 && (
        <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
          {pairs.map((pair) => (
            <div
              key={pair.id}
              className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-700 truncate">
                  {pair.originalFile.name}
                </div>
                <div className="text-xs text-slate-500 truncate">
                  + {pair.annotatedFile.name}
                </div>
              </div>
              <button
                onClick={() => removePair(pair.id)}
                className="ml-2 p-1 text-slate-400 hover:text-red-500 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 处理按钮 */}
      <button
        onClick={handleBatchProcess}
        disabled={pairs.length === 0 || isProcessing}
        className={`
          w-full py-3 px-4 rounded-xl font-medium transition-all duration-200
          ${pairs.length > 0 && !isProcessing
            ? 'bg-primary-500 text-white hover:bg-primary-600 active:scale-98'
            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }
        `}
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            处理中 ({progress.current}/{progress.total})
          </span>
        ) : (
          `批量处理并下载 (${pairs.length} 对)`
        )}
      </button>
    </div>
  );
}
