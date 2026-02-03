import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { type ProcessingOptions, type Preset } from '../utils/imageProcessor';

interface SidebarProps {
  options: ProcessingOptions;
  onChange: (options: ProcessingOptions) => void;
  onDownload: () => void;
  canDownload: boolean;
  isProcessing: boolean;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  selectedPreset: string | null;
  onPresetChange: (preset: string | null) => void;
  autoPreview: boolean;
  onAutoPreviewChange: (auto: boolean) => void;
  onProcess: () => void;
  canProcess: boolean;
  overlayMode?: boolean;
  userPresets: Preset[];
  onAddPreset: (name: string) => void;
  onRemovePreset: (id: string) => void;
  onUpdatePreset: (id: string, options: ProcessingOptions) => void;
  onResetPresets: () => void;
}

interface IconButtonProps {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  children: ReactNode;
}

function IconButton({ title, onClick, disabled, active, children }: IconButtonProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={`
        w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-200
        ${active ? 'bg-primary-50 text-primary-600' : 'text-slate-500 hover:bg-slate-100'}
        ${disabled ? 'opacity-40 cursor-not-allowed hover:bg-transparent' : ''}
      `}
    >
      {children}
    </button>
  );
}

export function Sidebar({
  options,
  onChange,
  onDownload,
  canDownload,
  isProcessing,
  collapsed,
  onCollapsedChange,
  selectedPreset,
  onPresetChange,
  autoPreview,
  onAutoPreviewChange,
  onProcess,
  canProcess,
  overlayMode = false,
  userPresets,
  onAddPreset,
  onRemovePreset,
  onUpdatePreset,
  onResetPresets,
}: SidebarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  const canAddPreset = userPresets.length < 4;

  const handleToggleCollapsed = useCallback(() => {
    onCollapsedChange(!collapsed);
  }, [collapsed, onCollapsedChange]);

  const handlePresetSelect = useCallback(
    (presetId: string) => {
      const preset = userPresets.find((candidate) => candidate.id === presetId);
      if (!preset) return;
      onChange(preset.options);
      onPresetChange(presetId);
      setShowAdvanced(true);
    },
    [userPresets, onChange, onPresetChange]
  );

  const handlePresetDoubleClick = useCallback(
    (presetId: string) => {
      if (selectedPreset === presetId) {
        onPresetChange(null);
        setShowAdvanced(false);
      }
    },
    [selectedPreset, onPresetChange]
  );

  const handleSavePreset = useCallback(() => {
    if (!newPresetName.trim() || !canAddPreset) return;
    onAddPreset(newPresetName.trim().slice(0, 4));
    setNewPresetName('');
    setShowSaveDialog(false);
  }, [newPresetName, canAddPreset, onAddPreset]);

  const handleDeletePreset = useCallback(
    (presetId: string) => {
      onRemovePreset(presetId);
    },
    [onRemovePreset]
  );

  const handleOptionChange = useCallback(
    (newOptions: ProcessingOptions) => {
      onChange(newOptions);
      if (selectedPreset) {
        onUpdatePreset(selectedPreset, newOptions);
      }
    },
    [onChange, selectedPreset, onUpdatePreset]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey || e.key.toLowerCase() !== 'b') return;

      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;
      if (target.isContentEditable) return;

      e.preventDefault();
      onCollapsedChange(!collapsed);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [collapsed, onCollapsedChange]);

  const widthClass = collapsed ? 'w-[48px]' : 'w-[280px]';

  // Overlay mode styles for tablet breakpoint
  const overlayStyles = overlayMode
    ? 'fixed left-4 top-[120px] z-40 shadow-xl'
    : '';

  if (collapsed) {
    return (
      <aside
        className={`
          shrink-0 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden
          ${widthClass} transition-all duration-[250ms] ease-out
          ${overlayStyles}
        `}
        aria-label="处理设置侧边栏"
      >
        <div className="flex flex-col items-center p-1.5 gap-1">
          <IconButton title="展开设置 (Ctrl+B)" onClick={handleToggleCollapsed}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </IconButton>

          <div className="w-8 h-px bg-slate-200 my-1" />

          <IconButton
            title="快速预设"
            onClick={() => {
              onCollapsedChange(false);
              setShowAdvanced(false);
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0a1.72 1.72 0 001.625 1.185h.03c.963 0 1.371 1.233.588 1.81l-.024.017a1.72 1.72 0 00-.626 1.87l.01.03c.3.921-.755 1.688-1.54 1.111l-.024-.017a1.72 1.72 0 00-2.02 0l-.024.017c-.784.577-1.838-.19-1.54-1.111l.01-.03a1.72 1.72 0 00-.626-1.87l-.024-.017c-.783-.577-.375-1.81.588-1.81h.03a1.72 1.72 0 001.625-1.185z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 13v9" />
            </svg>
          </IconButton>

          <IconButton
            title={selectedPreset ? '自定义参数' : showAdvanced ? '收起高级设置' : '高级设置'}
            onClick={() => {
              onCollapsedChange(false);
              if (selectedPreset) {
                onPresetChange(null);
              }
              setShowAdvanced(true);
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </IconButton>

          <div className="flex-1" />

          <IconButton
            title={autoPreview ? '实时预览：开' : '实时预览：关'}
            onClick={() => onAutoPreviewChange(!autoPreview)}
            active={autoPreview}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </IconButton>

          {!autoPreview && (
            <IconButton
              title={isProcessing ? '处理中...' : '预览处理效果'}
              onClick={onProcess}
              disabled={!canProcess || isProcessing}
            >
              {isProcessing ? (
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.262a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </IconButton>
          )}

          <IconButton title="下载结果" onClick={onDownload} disabled={!canDownload}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </IconButton>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={`
        shrink-0 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden
        ${widthClass} transition-all duration-[250ms] ease-out
        ${overlayStyles}
      `}
      aria-label="处理设置侧边栏"
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-800">处理设置</h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500">实时预览</span>
              <button
                type="button"
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

            <button
              type="button"
              title="收起设置 (Ctrl+B)"
              aria-label="收起设置 (Ctrl+B)"
              onClick={handleToggleCollapsed}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-700">快速预设</h3>
              {userPresets.length === 0 && (
                <button
                  type="button"
                  onClick={onResetPresets}
                  className="text-xs text-primary-600 hover:text-primary-700"
                >
                  恢复默认
                </button>
              )}
            </div>
            <div className="grid grid-cols-4 gap-1">
              {userPresets.map((preset) => (
                <div key={preset.id} className="relative group">
                  <button
                    type="button"
                    onClick={() => handlePresetSelect(preset.id)}
                    onDoubleClick={() => handlePresetDoubleClick(preset.id)}
                    className={`
                      w-full py-1 px-1 text-xs font-medium rounded transition-all duration-200 truncate
                      ${selectedPreset === preset.id
                        ? 'bg-primary-500 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }
                    `}
                    title={`${preset.name}${selectedPreset === preset.id ? ' (双击取消选中)' : ''}`}
                  >
                    {preset.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePreset(preset.id)}
                    className="absolute -right-0.5 -top-0.5 w-3.5 h-3.5 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="删除预设"
                  >
                    <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              {userPresets.length < 4 && (
                showSaveDialog ? (
                  <div className="col-span-4 flex gap-1 items-center mt-1">
                    <input
                      type="text"
                      value={newPresetName}
                      onChange={(e) => setNewPresetName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
                      placeholder="名称(4字)"
                      maxLength={4}
                      className="flex-1 px-1.5 py-0.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleSavePreset}
                      disabled={!newPresetName.trim()}
                      className="px-1.5 py-0.5 text-xs font-medium text-white bg-primary-500 rounded hover:bg-primary-600 disabled:opacity-50"
                    >
                      存
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowSaveDialog(false); setNewPresetName(''); }}
                      className="px-1.5 py-0.5 text-xs text-slate-500 hover:text-slate-700"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowSaveDialog(true)}
                    className="py-1 px-1 text-xs text-slate-400 border border-dashed border-slate-300 rounded hover:border-primary-400 hover:text-primary-600 transition-colors"
                    title="保存当前参数为预设"
                  >
                    +
                  </button>
                )
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm font-medium text-slate-700">
                {selectedPreset ? `预设参数 (${userPresets.find(p => p.id === selectedPreset)?.name || ''})` : '高级设置'}
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

          {showAdvanced && (
            <div className="space-y-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
              <h3 className="text-sm font-medium text-purple-700 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {selectedPreset ? '遮罩参数 (修改自动保存)' : '遮罩参数'}
              </h3>

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

          <div className="flex flex-col gap-3 pt-4">
            {!autoPreview && (
              <button
                type="button"
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
              type="button"
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
    </aside>
  );
}
