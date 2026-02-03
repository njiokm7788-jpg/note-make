# Component-Level Optimization

## 1. ImageUploader Optimization

### Current Structure
```tsx
<div className="flex flex-col gap-2">
  <label>...</label>
  <div className="border-2 border-dashed rounded-xl p-6">
    {preview ? (
      <div className="flex flex-col items-center gap-3">
        <img className="max-h-40 max-w-full" />
        <div>filename</div>
        <button>移除</button>
      </div>
    ) : (
      <div className="flex flex-col items-center gap-2">
        <div className="w-12 h-12">icon</div>
        <div>点击上传...</div>
        <div>description</div>
      </div>
    )}
  </div>
</div>
```

### Proposed Compact Structure
```tsx
<div className="flex flex-col gap-1.5">
  <label className="text-xs font-medium">...</label>
  <div className="border-2 border-dashed rounded-lg p-3 min-h-[100px]">
    {preview ? (
      <div className="flex items-center gap-3">
        <img className="h-16 w-16 object-cover rounded" />
        <div className="flex-1 min-w-0">
          <div className="text-sm truncate">filename</div>
          <button className="text-xs text-red-500">移除</button>
        </div>
      </div>
    ) : (
      <div className="flex flex-col items-center gap-1 py-2">
        <div className="w-8 h-8">icon</div>
        <div className="text-xs">点击上传或拖拽</div>
      </div>
    )}
  </div>
</div>
```

### Key Changes
| Aspect | Current | Proposed | Impact |
|--------|---------|----------|--------|
| Container padding | p-6 (24px) | p-3 (12px) | -24px height |
| Preview image | max-h-40 (160px) | h-16 (64px) | -96px height |
| Icon size | w-12 h-12 | w-8 h-8 | -16px |
| Gap | gap-3 | gap-1.5 | -6px |
| Layout | 垂直居中 | 水平排列 (有预览时) | 更紧凑 |

### Horizontal Upload Pair Component

建议创建新组件 `ImageUploadPair` 用于水平布局:

```tsx
interface ImageUploadPairProps {
  originalFile: File | null;
  annotatedFile: File | null;
  onOriginalSelect: (file: File) => void;
  onAnnotatedSelect: (file: File) => void;
}

function ImageUploadPair({ ... }: ImageUploadPairProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <CompactUploader
        label="原始图片"
        file={originalFile}
        onSelect={onOriginalSelect}
      />
      <CompactUploader
        label="AI标注图片"
        file={annotatedFile}
        onSelect={onAnnotatedSelect}
      />
    </div>
  );
}
```

## 2. ProcessingPanel Optimization

### Current Issues
1. 预设按钮 3x3 grid 占用过多空间
2. 高级设置展开后内容过长
3. 操作按钮区域过大

### Proposed Structure

```tsx
<div className="bg-white rounded-xl border p-4">
  <div className="flex items-center justify-between mb-3">
    <h2 className="text-sm font-semibold">处理设置</h2>
    <div className="flex items-center gap-1">
      <Switch size="sm" checked={autoPreview} />
      <span className="text-xs">实时预览</span>
    </div>
  </div>

  {/* 预设选择 - 单行 */}
  <div className="flex gap-1.5 mb-3">
    {presets.map(preset => (
      <button
        key={preset.id}
        className={`flex-1 py-1.5 px-2 text-xs rounded-md ${
          selected ? 'bg-primary-500 text-white' : 'bg-slate-100'
        }`}
      >
        {preset.name}
      </button>
    ))}
  </div>

  {/* 高级设置 - 可折叠 */}
  <Collapsible defaultOpen={false}>
    <CollapsibleTrigger className="flex items-center gap-1 text-xs text-slate-500 mb-2">
      <ChevronIcon />
      高级设置
    </CollapsibleTrigger>
    <CollapsibleContent>
      <div className="space-y-2 p-2 bg-slate-50 rounded-lg">
        <CompactSlider label="文字检测阈值" value={...} />
        <CompactSlider label="遮罩膨胀半径" value={...} />
        <CompactSlider label="标注透明度" value={...} />
      </div>
    </CollapsibleContent>
  </Collapsible>

  {/* 操作按钮 */}
  <button className="w-full py-2 mt-3 bg-green-500 text-white text-sm rounded-lg">
    下载结果
  </button>
</div>
```

### Compact Slider Component

```tsx
function CompactSlider({ label, value, onChange, min, max, unit }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-600 w-20 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={onChange}
        className="flex-1 h-1.5 accent-primary-500"
      />
      <span className="text-xs text-slate-500 w-12 text-right font-mono">
        {value}{unit}
      </span>
    </div>
  );
}
```

### Height Comparison

| Section | Current | Proposed | Savings |
|---------|---------|----------|---------|
| Header + 实时预览 | 48px + 48px | 36px (合并) | 60px |
| 预设按钮 | ~120px (3x3) | ~36px (1x3) | 84px |
| 高级设置折叠 | 48px | 28px | 20px |
| 高级设置展开 | ~200px | ~100px | 100px |
| 操作按钮 | ~100px | ~48px | 52px |
| **Total (折叠)** | ~316px | ~148px | **168px** |

## 3. ImagePreview Optimization

### Current Structure
```tsx
<div className="flex flex-col gap-2">
  <div className="flex items-center justify-between">
    <h3>title</h3>
    <span>subtitle</span>
  </div>
  <div className="relative bg-slate-100 rounded-xl overflow-hidden">
    <div className="checkered-bg" />
    <img className="max-h-80 object-contain" />
    <div className="zoom-hint">点击放大</div>
  </div>
</div>
```

### Proposed Compact Structure
```tsx
<div className="relative group">
  <div className="absolute top-2 left-2 z-10 bg-black/50 text-white text-xs px-2 py-0.5 rounded">
    {title}
  </div>
  <div className="bg-slate-100 rounded-lg overflow-hidden">
    <div className="checkered-bg" />
    <img className="w-full h-auto max-h-64 object-contain" />
  </div>
  <button className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 ...">
    <ZoomIcon />
  </button>
</div>
```

### Key Changes
- 标题移入图片内部 (overlay)
- 移除 subtitle (冗余信息)
- max-h 从 320px 减少到 256px
- 简化 hover 交互

## 4. Empty State Optimization

### Current Empty State (Preview Area)
```tsx
<div className="flex flex-col items-center justify-center py-16 text-center">
  <div className="w-20 h-20 rounded-full bg-slate-100 ...">
    <svg className="w-10 h-10" />
  </div>
  <h3 className="text-lg font-medium mb-2">等待处理</h3>
  <p className="text-sm max-w-sm">请上传原始图片和AI标注图片...</p>
</div>
```

### Proposed Compact Empty State
```tsx
<div className="flex flex-col items-center justify-center py-8 text-center">
  <div className="w-12 h-12 rounded-full bg-slate-100 mb-2">
    <svg className="w-6 h-6" />
  </div>
  <p className="text-sm text-slate-400">上传图片后显示预览</p>
</div>
```

### Height Savings
- Current: py-16 (64px) + icon (80px) + text (~60px) = ~204px
- Proposed: py-8 (32px) + icon (48px) + text (~24px) = ~104px
- **Savings: 100px**

## 5. Header Optimization

### Current Header
```tsx
<header className="bg-white border-b sticky top-0 z-10">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex items-center justify-between h-16">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl">logo</div>
        <div>
          <h1 className="text-xl font-bold">笔记图片叠加工具</h1>
          <p className="text-xs">提取AI标注并与原图合成</p>
        </div>
      </div>
      <div className="mode-toggle">...</div>
    </div>
  </div>
</header>
```

### Proposed Compact Header
```tsx
<header className="bg-white border-b sticky top-0 z-10">
  <div className="max-w-7xl mx-auto px-4">
    <div className="flex items-center justify-between h-12">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg">logo</div>
        <h1 className="text-base font-semibold">笔记图片叠加工具</h1>
      </div>
      <div className="flex gap-0.5 bg-slate-100 rounded-md p-0.5">
        <button className="px-3 py-1 text-sm rounded">单张</button>
        <button className="px-3 py-1 text-sm rounded">批量</button>
      </div>
    </div>
  </div>
</header>
```

### Changes
- h-16 (64px) → h-12 (48px): **-16px**
- 移除副标题
- 缩小 logo 和字体
- 压缩 Tab 按钮

## 6. Footer Optimization

### Current Footer
```tsx
<footer className="border-t bg-white mt-auto">
  <div className="max-w-7xl mx-auto px-4 py-4">
    <p className="text-center text-sm">
      笔记图片叠加工具 - 让AI标注与清晰原图完美结合
    </p>
  </div>
</footer>
```

### Proposed Minimal Footer
```tsx
<footer className="border-t bg-white mt-auto">
  <div className="max-w-7xl mx-auto px-4 py-2">
    <p className="text-center text-xs text-slate-400">
      笔记图片叠加工具
    </p>
  </div>
</footer>
```

### Changes
- py-4 (16px) → py-2 (8px): **-16px**
- 简化文案
- 减小字体

## 7. Component Size Summary

| Component | Current Height | Proposed Height | Savings |
|-----------|---------------|-----------------|---------|
| Header | 64px | 48px | 16px |
| ImageUploader (x2) | 360px | 160px | 200px |
| ProcessingPanel | 316px | 148px | 168px |
| Preview Empty | 204px | 104px | 100px |
| Footer | 56px | 32px | 24px |
| Gaps & Padding | ~80px | ~48px | 32px |
| **Total** | ~1080px | ~540px | **~540px** |

通过组件级优化，可以将整体高度减少约 50%，确保在 1080p 显示器上无需滚动。
