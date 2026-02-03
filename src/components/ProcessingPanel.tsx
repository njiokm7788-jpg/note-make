import { useState } from 'react';
import { presets, type ProcessingOptions } from '../utils/imageProcessor';

interface ProcessingPanelProps {
  options: ProcessingOptions;
  onChange: (options: ProcessingOptions) => void;
  onProcess: () => void;
  onDownload: () => void;
  canProcess: boolean;
  canDownload: boolean;
  isProcessing: boolean;
  autoPreview?: boolean;
  onAutoPreviewChange?: (value: boolean) => void;
  selectedPreset?: string;
  onPresetChange?: (presetId: string | null) => void;
}

export function ProcessingPanel({
  options,
  onChange,
  onProcess,
  onDownload,
  canProcess,
  canDownload,
  isProcessing,
  autoPreview = true,
  onAutoPreviewChange,
  selectedPreset,
  onPresetChange,
}: ProcessingPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handlePresetSelect = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      onChange(preset.options);
      onPresetChange?.(presetId);
      setShowAdvanced(false);
    }
  };

  const handleCustomSelect = () => {
    onPresetChange?.(null);
    setShowAdvanced(true);
  };

  const handleOptionChange = (newOptions: ProcessingOptions) => {
    onChange(newOptions);
    onPresetChange?.(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-800">处理设置</h2>
        {onAutoPreviewChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">实时预览</span>
            <button
              onClick={() => onAutoPreviewChange(!autoPreview)}
              className={`
                relative w-9 h-5 rounded-full transition-colors duration-200
                ${autoPreview ? 'bg-blue-500' : 'bg-slate-300'}
              `}
            >
              <span
                className={`
                  absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm
                  transition-transform duration-200
                  ${autoPreview ? 'translate-x-4' : 'translate-x-0'}
                `}
              />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-5">
        {/* 快速预设 */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-slate-700">快速预设</h3>
          <div className="flex gap-1.5">
            {presets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset.id)}
                className={`
                  flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-all duration-200
                  ${selectedPreset === preset.id
                    ? 'bg-primary-500 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }
                `}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* 高级设置折叠按钮 */}
        <button
          onClick={() => selectedPreset ? handleCustomSelect() : setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm font-medium text-slate-700">
              {selectedPreset ? '自定义参数' : '高级设置'}
            </span>
          </div>
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* 高级参数（可折叠） */}
        {showAdvanced && (
          <div className="space-y-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
            <h3 className="text-sm font-medium text-purple-700 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              遮罩参数
            </h3>

            {/* 文字检测阈值 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-600">
                  文字检测阈值
                </label>
                <span className="text-xs text-slate-500 font-mono">
                  {options.textThreshold}
                </span>
              </div>
              <input
                type="range"
                min="100"
                max="250"
                value={options.textThreshold}
                onChange={(e) =>
                  handleOptionChange({ ...options, textThreshold: Number(e.target.value) })
                }
                className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <p className="text-xs text-purple-600">
                亮度低于此值的像素被识别为文字，值越高识别的文字区域越多
              </p>
            </div>

            {/* 遮罩膨胀半径 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-600">
                  遮罩膨胀半径
                </label>
                <span className="text-xs text-slate-500 font-mono">
                  {options.maskExpand}px
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={options.maskExpand}
                onChange={(e) =>
                  handleOptionChange({ ...options, maskExpand: Number(e.target.value) })
                }
                className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <p className="text-xs text-purple-600">
                扩展文字遮罩区域，确保完全覆盖文字边缘
              </p>
            </div>

            {/* 色块设置 */}
            <div className="space-y-3 pt-2 border-t border-purple-200">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                <span className="text-xs font-medium text-purple-700">色块设置</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-600">
                    色块颜色
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={options.blockColor}
                      onChange={(e) =>
                        handleOptionChange({ ...options, blockColor: e.target.value })
                      }
                      className="w-6 h-6 rounded cursor-pointer border border-slate-300"
                    />
                    <span className="text-xs text-slate-500 font-mono">
                      {options.blockColor}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {['#FFFF00', '#90EE90', '#FFB6C1', '#87CEEB', '#FFA94D', '#B197FC'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handleOptionChange({ ...options, blockColor: color })}
                      className={`w-6 h-6 rounded border-2 transition-all ${
                        options.blockColor === color ? 'border-purple-500 scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-600">
                    色块透明度
                  </label>
                  <span className="text-xs text-slate-500 font-mono">
                    {Math.round(options.blockOpacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={options.blockOpacity * 100}
                  onChange={(e) =>
                    handleOptionChange({
                      ...options,
                      blockOpacity: Number(e.target.value) / 100,
                    })
                  }
                  className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <p className="text-xs text-purple-600">
                  非文字区域色块的透明度
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex flex-col gap-3 pt-4">
          {!autoPreview && (
            <button
              onClick={onProcess}
              disabled={!canProcess || isProcessing}
              className={`
                w-full py-3 px-4 rounded-xl font-medium transition-all duration-200
                ${canProcess && !isProcessing
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
                  处理中...
                </span>
              ) : (
                '预览处理效果'
              )}
            </button>
          )}

          {/* 处理中指示器 */}
          {autoPreview && isProcessing && (
            <div className="flex items-center justify-center gap-2 py-2 text-blue-600">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
              <span className="text-sm">正在更新预览...</span>
            </div>
          )}

          <button
            onClick={onDownload}
            disabled={!canDownload}
            className={`
              w-full py-3 px-4 rounded-xl font-medium transition-all duration-200
              ${canDownload
                ? 'bg-green-500 text-white hover:bg-green-600 active:scale-98'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }
            `}
          >
            下载结果
          </button>
        </div>
      </div>
    </div>
  );
}
