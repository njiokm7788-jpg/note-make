import { useCallback, useState, type DragEvent, type ChangeEvent } from 'react';
import { isImageFile } from '../utils/fileUtils';

interface ImageUploaderProps {
  label: string;
  description: string;
  onFileSelect: (file: File) => void;
  accept?: string;
  file?: File | null;
}

export function ImageUploader({
  label,
  description,
  onFileSelect,
  accept = 'image/*',
  file,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = useCallback(
    (selectedFile: File) => {
      if (isImageFile(selectedFile)) {
        onFileSelect(selectedFile);
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(selectedFile);
      }
    },
    [onFileSelect]
  );

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
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFile(droppedFile);
      }
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        handleFile(selectedFile);
      }
    },
    [handleFile]
  );

  const handleClear = useCallback(() => {
    setPreview(null);
    onFileSelect(null as unknown as File);
  }, [onFileSelect]);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-6 transition-all duration-200 cursor-pointer
          ${isDragging
            ? 'border-primary-500 bg-primary-50'
            : file
            ? 'border-green-400 bg-green-50'
            : 'border-slate-300 bg-white hover:border-primary-400 hover:bg-slate-50'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById(`file-input-${label}`)?.click()}
      >
        <input
          id={`file-input-${label}`}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
        />

        {preview ? (
          <div className="flex flex-col items-center gap-3">
            <img
              src={preview}
              alt="Preview"
              className="max-h-40 max-w-full object-contain rounded-lg shadow-sm"
            />
            <div className="text-sm text-slate-600 truncate max-w-full">
              {file?.name}
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="px-3 py-1 text-sm bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors"
            >
              移除
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-primary-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div className="text-sm text-slate-600">
              <span className="text-primary-600 font-medium">点击上传</span>、拖拽或 <span className="text-primary-600 font-medium">Ctrl+V</span> 粘贴
            </div>
            <div className="text-xs text-slate-400">{description}</div>
          </div>
        )}
      </div>
    </div>
  );
}
