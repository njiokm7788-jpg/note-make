import { useState, useCallback, useEffect, useRef } from 'react';
import { ImagePreview } from './components/ImagePreview';
import { Sidebar } from './components/Sidebar';
import { FloatingUploadButton } from './components/FloatingUploadButton';
import { UploadModal } from './components/UploadModal';
import { BatchProcessor } from './components/BatchProcessor';
import {
  generatePreview,
  presets,
  loadUserPresets,
  addUserPreset,
  removeUserPreset,
  updateUserPreset,
  resetToDefaultPresets,
  type ProcessingOptions,
  type Preset,
} from './utils/imageProcessor';
import { downloadSingleResult } from './utils/fileUtils';

type Mode = 'single' | 'batch';

// Responsive breakpoints
type ScreenSize = 'mobile' | 'tablet' | 'desktop';

const STORAGE_KEYS = {
  sidebarCollapsed: 'note-image-overlay.sidebarCollapsed',
  selectedPreset: 'note-image-overlay.selectedPreset',
} as const;

// Hook for responsive screen size detection
function useScreenSize(): ScreenSize {
  const [screenSize, setScreenSize] = useState<ScreenSize>(() => {
    if (typeof window === 'undefined') return 'desktop';
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  });

  useEffect(() => {
    const mediaQueryDesktop = window.matchMedia('(min-width: 1024px)');
    const mediaQueryTablet = window.matchMedia('(min-width: 768px)');

    const updateScreenSize = () => {
      if (mediaQueryDesktop.matches) {
        setScreenSize('desktop');
      } else if (mediaQueryTablet.matches) {
        setScreenSize('tablet');
      } else {
        setScreenSize('mobile');
      }
    };

    // Initial check
    updateScreenSize();

    // Listen for changes
    mediaQueryDesktop.addEventListener('change', updateScreenSize);
    mediaQueryTablet.addEventListener('change', updateScreenSize);

    return () => {
      mediaQueryDesktop.removeEventListener('change', updateScreenSize);
      mediaQueryTablet.removeEventListener('change', updateScreenSize);
    };
  }, []);

  return screenSize;
}

function readPersistedCollapsed(): boolean | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.sidebarCollapsed);
    if (raw === null) return undefined;
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === 'boolean' ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function readPersistedPreset(): string | null | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.selectedPreset);
    if (raw === null) return undefined;
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed === 'string') return parsed;
    return undefined;
  } catch {
    return undefined;
  }
}

// 防抖 Hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

function App() {
  const [mode, setMode] = useState<Mode>('single');
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [annotatedFile, setAnnotatedFile] = useState<File | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Responsive screen size
  const screenSize = useScreenSize();

  // Sidebar state with responsive auto-collapse
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => readPersistedCollapsed() ?? false);
  const [sidebarOverlayVisible, setSidebarOverlayVisible] = useState(false);

  // Track if user manually toggled sidebar (to prevent auto-collapse override)
  const userToggledSidebar = useRef(false);

  // 加载用户预设（需要在 initialPresetState 之前）
  const [userPresets, setUserPresets] = useState<Preset[]>(() => loadUserPresets());

  const [initialPresetState] = useState<{
    selectedPreset: string | null;
    options: ProcessingOptions;
  }>(() => {
    const persisted = readPersistedPreset();
    const loadedPresets = loadUserPresets();

    if (persisted === null) {
      return { selectedPreset: null, options: loadedPresets[0]?.options ?? presets[0].options };
    }

    if (typeof persisted === 'string') {
      const preset = loadedPresets.find((candidate) => candidate.id === persisted);
      if (preset) {
        return { selectedPreset: preset.id, options: preset.options };
      }
    }

    const defaultPresetId = 'highlight-yellow';
    const defaultPreset = loadedPresets.find((preset) => preset.id === defaultPresetId) ?? loadedPresets[0];
    return { selectedPreset: defaultPreset?.id ?? null, options: defaultPreset?.options ?? presets[0].options };
  });

  const [selectedPreset, setSelectedPreset] = useState<string | null>(initialPresetState.selectedPreset);
  const [options, setOptions] = useState<ProcessingOptions>(initialPresetState.options);
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<{
    original: string;
    annotated: string;
    annotationLayer: string;
    result: string;
  } | null>(null);

  // 预览视图模式：简化视图 vs 对比视图
  const [showComparison, setShowComparison] = useState(false);

  // 批量模式预设保存对话框
  const [batchSaveDialog, setBatchSaveDialog] = useState(false);
  const [batchPresetName, setBatchPresetName] = useState('');

  // Toast 提示
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // 显示 toast 提示
  const showToast = useCallback((message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2000);
  }, []);

  // 预设管理
  const handleAddPreset = useCallback((name: string) => {
    setUserPresets(prev => addUserPreset(name, options, prev));
    showToast(`预设"${name}"已保存`, 'success');
  }, [options, showToast]);

  const handleRemovePreset = useCallback((id: string) => {
    setUserPresets(prev => removeUserPreset(id, prev));
    if (selectedPreset === id) {
      setSelectedPreset(null);
    }
    showToast('预设已删除', 'info');
  }, [selectedPreset, showToast]);

  const handleUpdatePreset = useCallback((id: string, newOptions: ProcessingOptions) => {
    setUserPresets(prev => updateUserPreset(id, newOptions, prev));
  }, []);

  const handleResetPresets = useCallback(() => {
    setUserPresets(resetToDefaultPresets());
    showToast('已恢复默认预设', 'success');
  }, [showToast]);

  // 批量模式参数变化处理（选中预设时自动保存）
  const handleBatchOptionChange = useCallback((newOptions: ProcessingOptions) => {
    setOptions(newOptions);
    if (selectedPreset) {
      setUserPresets(prev => updateUserPreset(selectedPreset, newOptions, prev));
    }
  }, [selectedPreset]);

  useEffect(() => {
    if (mode !== 'single') {
      setIsDrawerOpen(false);
    }
  }, [mode]);

  // Responsive sidebar auto-collapse
  useEffect(() => {
    // Don't auto-collapse if user manually toggled
    if (userToggledSidebar.current) {
      userToggledSidebar.current = false;
      return;
    }

    // Auto-collapse on mobile and tablet
    if (screenSize === 'mobile' || screenSize === 'tablet') {
      setSidebarCollapsed(true);
      setSidebarOverlayVisible(false);
    }
  }, [screenSize]);

  // Handle sidebar toggle with user intent tracking
  const handleSidebarCollapsedChange = useCallback((collapsed: boolean) => {
    userToggledSidebar.current = true;
    setSidebarCollapsed(collapsed);

    // In tablet mode, toggle overlay visibility
    if (screenSize === 'tablet') {
      setSidebarOverlayVisible(!collapsed);
    }
  }, [screenSize]);

  // Close sidebar overlay when clicking outside (tablet mode)
  const handleOverlayBackdropClick = useCallback(() => {
    setSidebarCollapsed(true);
    setSidebarOverlayVisible(false);
  }, []);

  // 全局粘贴事件监听
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // 如果焦点在输入框中，不处理粘贴
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // 只在单张处理模式下启用粘贴
      if (mode !== 'single') return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            setIsDrawerOpen(true);
            // 智能填充：先填原图，后填标注图
            if (!originalFile) {
              setOriginalFile(file);
              showToast('已粘贴为原始图片', 'success');
            } else if (!annotatedFile) {
              setAnnotatedFile(file);
              showToast('已粘贴为 AI 标注图片', 'success');
            } else {
              // 两个都有时，替换原图
              setOriginalFile(file);
              showToast('已替换原始图片', 'info');
            }
            break;
          }
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [mode, originalFile, annotatedFile, showToast]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.sidebarCollapsed, JSON.stringify(sidebarCollapsed));
    } catch {
      return;
    }
  }, [sidebarCollapsed]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.selectedPreset, JSON.stringify(selectedPreset));
    } catch {
      return;
    }
  }, [selectedPreset]);
  
  // 实时预览开关
  const [autoPreview, setAutoPreview] = useState(true);
  
  // 防抖处理选项变化
  const debouncedOptions = useDebounce(options, 300);
  
  // 用于追踪是否是首次渲染
  const isFirstRender = useRef(true);

  // 实时预览：当文件或选项变化时自动处理
  useEffect(() => {
    // 跳过首次渲染
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    if (!autoPreview || !originalFile || !annotatedFile) return;
    
    let cancelled = false;
    
    const processImages = async () => {
      setIsProcessing(true);
      try {
        const result = await generatePreview(originalFile, annotatedFile, debouncedOptions);
        if (!cancelled) {
          setPreview(result);
        }
      } catch (error) {
        console.error('处理出错:', error);
      } finally {
        if (!cancelled) {
          setIsProcessing(false);
        }
      }
    };
    
    processImages();
    
    return () => {
      cancelled = true;
    };
  }, [originalFile, annotatedFile, debouncedOptions, autoPreview]);

  const handleProcess = useCallback(async () => {
    if (!originalFile || !annotatedFile) return;

    setIsProcessing(true);
    try {
      const result = await generatePreview(originalFile, annotatedFile, options);
      setPreview(result);
    } catch (error) {
      console.error('处理出错:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [originalFile, annotatedFile, options]);

  const handleDownload = useCallback(async () => {
    if (!originalFile || !annotatedFile) return;
    await downloadSingleResult(originalFile, annotatedFile, options);
  }, [originalFile, annotatedFile, options]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInputFocused = target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        target?.isContentEditable;

      // Ctrl+S: Download result (when preview available)
      if (e.ctrlKey && e.key.toLowerCase() === 's') {
        if (preview && mode === 'single') {
          e.preventDefault();
          handleDownload();
        }
        return;
      }

      // Space: Toggle comparison view (when preview available and not in input)
      if (e.key === ' ' && !isInputFocused) {
        if (preview && mode === 'single') {
          e.preventDefault();
          setShowComparison((prev) => !prev);
        }
        return;
      }

      // Escape: Close sidebar overlay (modal handles its own ESC)
      if (e.key === 'Escape') {
        if (sidebarOverlayVisible) {
          setSidebarCollapsed(true);
          setSidebarOverlayVisible(false);
          return;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [preview, mode, sidebarOverlayVisible, handleDownload]);

  const handleClearUploads = useCallback(() => {
    setOriginalFile(null);
    setAnnotatedFile(null);
    setPreview(null);
    setShowComparison(false);
    showToast('已清空上传图片', 'info');
  }, [showToast]);

  const canProcess = Boolean(originalFile && annotatedFile);
  const canDownload = Boolean(preview);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Toast 提示 */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className={`
            px-4 py-2 rounded-lg shadow-lg flex items-center gap-2
            ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'}
          `}>
            {toast.type === 'success' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
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
              <h1 className="text-base font-semibold text-slate-800">笔记图片叠加工具</h1>
            </div>

            {/* Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setMode('single')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  mode === 'single'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                单张处理
              </button>
              <button
                onClick={() => setMode('batch')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  mode === 'batch'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                批量处理
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {mode === 'single' ? (
          <div className="flex flex-col lg:flex-row gap-4 relative">
            {/* Sidebar overlay backdrop (tablet mode) */}
            {sidebarOverlayVisible && screenSize === 'tablet' && (
              <div
                className="fixed inset-0 bg-black/30 z-30 transition-opacity duration-200"
                onClick={handleOverlayBackdropClick}
                aria-hidden="true"
              />
            )}

            <Sidebar
              options={options}
              onChange={setOptions}
              onDownload={handleDownload}
              canDownload={canDownload}
              isProcessing={isProcessing}
              collapsed={sidebarCollapsed}
              onCollapsedChange={handleSidebarCollapsedChange}
              selectedPreset={selectedPreset}
              onPresetChange={setSelectedPreset}
              autoPreview={autoPreview}
              onAutoPreviewChange={setAutoPreview}
              onProcess={handleProcess}
              canProcess={canProcess}
              overlayMode={screenSize === 'tablet' && sidebarOverlayVisible}
              userPresets={userPresets}
              onAddPreset={handleAddPreset}
              onRemovePreset={handleRemovePreset}
              onUpdatePreset={handleUpdatePreset}
              onResetPresets={handleResetPresets}
            />

            <div className="flex-1">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">处理预览</h2>

                {preview ? (
                  <div className="space-y-4">
                    {/* 简化视图：只显示最终结果 */}
                    {!showComparison ? (
                      <div className="flex flex-col items-center">
                        <div className="w-full max-w-2xl mx-auto">
                          <ImagePreview src={preview.result} title="最终结果" subtitle="合成图片" />
                        </div>
                        <div className="flex items-center gap-3 mt-4">
                          <button
                            onClick={() => setShowComparison(true)}
                            className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 6h16M4 12h16M4 18h16"
                              />
                            </svg>
                            查看对比
                          </button>
                          <button
                            onClick={handleDownload}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                              />
                            </svg>
                            下载结果
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* 对比视图：四宫格 */
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm text-slate-500">对比视图</span>
                          <button
                            onClick={() => setShowComparison(false)}
                            className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                          >
                            返回简化视图
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <ImagePreview src={preview.original} title="原始图片" subtitle="清晰文字" />
                          <ImagePreview src={preview.annotated} title="AI标注图片" subtitle="带标注" />
                          <ImagePreview src={preview.annotationLayer} title="提取的标注层" subtitle="纯标注" />
                          <ImagePreview src={preview.result} title="最终结果" subtitle="合成图片" />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                      <svg
                        className="w-10 h-10 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-slate-600 mb-2">等待处理</h3>
                    <p className="text-sm text-slate-400 max-w-sm">
                      请上传原始图片和AI标注图片，然后点击&quot;预览处理效果&quot;按钮查看结果
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <BatchProcessor options={options} />
            </div>
            <div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">处理设置</h2>

                <div className="space-y-5">
                  {/* 快速预设 */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-slate-700">快速预设</h3>
                      {userPresets.length === 0 && (
                        <button
                          onClick={handleResetPresets}
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
                            onClick={() => {
                              setOptions(preset.options);
                              setSelectedPreset(preset.id);
                            }}
                            onDoubleClick={() => {
                              if (selectedPreset === preset.id) {
                                setSelectedPreset(null);
                              }
                            }}
                            className={`
                              w-full py-1 px-1.5 rounded text-xs font-medium transition-all duration-200 truncate
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
                            onClick={() => handleRemovePreset(preset.id)}
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
                        batchSaveDialog ? (
                          <div className="col-span-4 flex gap-1 items-center mt-1">
                            <input
                              type="text"
                              value={batchPresetName}
                              onChange={(e) => setBatchPresetName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && batchPresetName.trim()) {
                                  handleAddPreset(batchPresetName.trim().slice(0, 4));
                                  setBatchPresetName('');
                                  setBatchSaveDialog(false);
                                }
                              }}
                              placeholder="名称(4字)"
                              maxLength={4}
                              className="flex-1 px-1.5 py-0.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                              autoFocus
                            />
                            <button
                              onClick={() => {
                                if (batchPresetName.trim()) {
                                  handleAddPreset(batchPresetName.trim().slice(0, 4));
                                  setBatchPresetName('');
                                  setBatchSaveDialog(false);
                                }
                              }}
                              disabled={!batchPresetName.trim()}
                              className="px-1.5 py-0.5 text-xs font-medium text-white bg-primary-500 rounded hover:bg-primary-600 disabled:opacity-50"
                            >
                              存
                            </button>
                            <button
                              onClick={() => { setBatchSaveDialog(false); setBatchPresetName(''); }}
                              className="px-1.5 py-0.5 text-xs text-slate-500 hover:text-slate-700"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setBatchSaveDialog(true)}
                            className="py-1 px-1.5 rounded text-xs text-slate-400 border border-dashed border-slate-300 hover:border-primary-400 hover:text-primary-600 transition-colors"
                            title="保存当前参数为预设"
                          >
                            +
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* 遮罩参数 */}
                  <div className="space-y-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    {selectedPreset && (
                      <div className="text-xs text-purple-600 font-medium">
                        编辑预设: {userPresets.find(p => p.id === selectedPreset)?.name} (修改自动保存)
                      </div>
                    )}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-slate-600">文字检测阈值</label>
                        <span className="text-xs text-slate-500 font-mono">{options.textThreshold}</span>
                      </div>
                      <input
                        type="range"
                        min="100"
                        max="250"
                        value={options.textThreshold}
                        onChange={(e) =>
                          handleBatchOptionChange({ ...options, textThreshold: Number(e.target.value) })
                        }
                        className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-slate-600">遮罩膨胀半径</label>
                        <span className="text-xs text-slate-500 font-mono">{options.maskExpand}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={options.maskExpand}
                        onChange={(e) =>
                          handleBatchOptionChange({ ...options, maskExpand: Number(e.target.value) })
                        }
                        className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                    </div>
                  </div>

                  {/* 色块设置 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-slate-700">
                        色块颜色
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={options.blockColor}
                          onChange={(e) =>
                            handleBatchOptionChange({ ...options, blockColor: e.target.value })
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
                          onClick={() => handleBatchOptionChange({ ...options, blockColor: color })}
                          className={`w-6 h-6 rounded border-2 transition-all ${
                            options.blockColor === color ? 'border-primary-500 scale-110' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-slate-700">
                        色块透明度
                      </label>
                      <span className="text-sm text-slate-500 font-mono">
                        {Math.round(options.blockOpacity * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={options.blockOpacity * 100}
                      onChange={(e) =>
                        handleBatchOptionChange({
                          ...options,
                          blockOpacity: Number(e.target.value) / 100,
                        })
                      }
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
                    />
                  </div>
                </div>

                {/* 使用说明 */}
                <div className="mt-6 p-4 bg-slate-50 rounded-xl">
                  <h3 className="text-sm font-medium text-slate-700 mb-2">使用说明</h3>
                  <ul className="text-xs text-slate-500 space-y-1">
                    <li>• 批量上传原图和对应的标注图</li>
                    <li>• 系统会根据文件名自动配对</li>
                    <li>• 标注图文件名包含 "annotated"、"标注" 等关键词</li>
                    <li>• 处理完成后会自动打包下载</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {mode === 'single' && (
        <>
          <FloatingUploadButton
            originalFile={originalFile}
            annotatedFile={annotatedFile}
            onClick={() => setIsDrawerOpen(true)}
            onClear={handleClearUploads}
          />
          <UploadModal
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            originalFile={originalFile}
            annotatedFile={annotatedFile}
            onOriginalSelect={setOriginalFile}
            onAnnotatedSelect={setAnnotatedFile}
          />
        </>
      )}

    </div>
  );
}

export default App;
