# 前端优化综合规范

## 概述

本文档整合 UI 设计师和产品经理的分析结果，形成可执行的前端优化方案。

## 核心优化目标

**目标用户**: 普通用户
**核心诉求**: 简单、快速、直观
**优化原则**: 减少操作步骤，降低认知负担

## 优化方案汇总

### P0 优先级（必须实现）

#### 1. 粘贴板支持

**共识**: 两个角色均认为这是最高价值的优化点

**实现规范**:
```typescript
// 全局粘贴事件监听
useEffect(() => {
  const handlePaste = (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          // 智能填充逻辑
          if (!originalFile) {
            setOriginalFile(file);
          } else if (!annotatedFile) {
            setAnnotatedFile(file);
          }
        }
      }
    }
  };

  document.addEventListener('paste', handlePaste);
  return () => document.removeEventListener('paste', handlePaste);
}, [originalFile, annotatedFile]);
```

**UI 反馈**:
- 粘贴成功时显示 toast 提示
- 上传区域显示"支持 Ctrl+V 粘贴"提示文字
- 粘贴后对应区域高亮闪烁

#### 2. 预设方案系统

**共识**: 显著降低普通用户的使用门槛

**预设定义**:
```typescript
interface Preset {
  id: string;
  name: string;
  description: string;
  options: Partial<ProcessingOptions>;
}

const presets: Preset[] = [
  {
    id: 'standard',
    name: '标准模式',
    description: '平衡的默认设置，适合大多数场景',
    options: {
      textThreshold: 200,
      maskExpand: 3,
      annotationOpacity: 0.7,
      useEdgeGuidedExpand: true,
      edgeThreshold: 50,
    }
  },
  {
    id: 'light',
    name: '轻量标注',
    description: '标注不遮挡原文，适合阅读',
    options: {
      textThreshold: 200,
      maskExpand: 2,
      annotationOpacity: 0.4,
      useEdgeGuidedExpand: true,
      edgeThreshold: 50,
    }
  },
  {
    id: 'emphasis',
    name: '强调标注',
    description: '突出显示标注内容',
    options: {
      textThreshold: 180,
      maskExpand: 4,
      annotationOpacity: 0.9,
      useEdgeGuidedExpand: true,
      edgeThreshold: 30,
    }
  }
];
```

**UI 设计**:
```
┌─────────────────────────────────────────┐
│  快速预设                               │
│                                         │
│  ┌────────┐ ┌────────┐ ┌────────┐      │
│  │ 标准   │ │ 轻量   │ │ 强调   │      │
│  │ ✓     │ │        │ │        │      │
│  │ 平衡   │ │ 不遮挡 │ │ 突出   │      │
│  └────────┘ └────────┘ └────────┘      │
│                                         │
│  ▼ 高级设置                             │
└─────────────────────────────────────────┘
```

### P1 优先级（建议实现）

#### 3. 预览区域简化

**UI 设计师建议**: 默认只显示最终结果，提供对比按钮
**产品经理建议**: 突出最终结果，简化信息层次

**实现方案**:
- 默认视图：最终结果大图 + 下载按钮
- 可选视图：点击"查看对比"展开四宫格

```typescript
const [showComparison, setShowComparison] = useState(false);

// 默认视图
{!showComparison && (
  <div className="flex flex-col items-center">
    <ImagePreview src={preview.result} title="最终结果" />
    <div className="flex gap-3 mt-4">
      <button onClick={() => setShowComparison(true)}>查看对比</button>
      <button onClick={handleDownload}>下载结果</button>
    </div>
  </div>
)}

// 对比视图
{showComparison && (
  <div className="grid grid-cols-2 gap-4">
    {/* 四宫格布局 */}
  </div>
)}
```

#### 4. 参数面板折叠

**实现方案**:
- 预设选择始终可见
- 高级参数默认折叠
- 选择"自定义"时自动展开

### P2 优先级（可选实现）

#### 5. 视觉反馈增强

- 上传成功动画
- 预设切换过渡
- 处理中状态优化

## 组件修改清单

### App.tsx
- [ ] 添加全局粘贴事件监听
- [ ] 添加预设状态管理
- [ ] 添加对比视图切换状态

### ProcessingPanel.tsx
- [ ] 添加预设选择卡片
- [ ] 高级参数折叠功能
- [ ] 移除差值模式相关 UI（已确认只使用遮罩模式）

### ImageUploader.tsx
- [ ] 添加粘贴提示文字
- [ ] 粘贴成功高亮动画

### ImagePreview.tsx
- [ ] 支持简化/对比视图切换

## 数据结构变更

### ProcessingOptions 扩展
```typescript
interface ProcessingOptions {
  // 现有字段保持不变
  textThreshold: number;
  maskExpand: number;
  annotationOpacity: number;
  useEdgeGuidedExpand: boolean;
  edgeThreshold: number;

  // 新增：预设 ID（可选）
  presetId?: string;
}
```

## 实施顺序

1. **第一步**: 实现预设系统（ProcessingPanel）
2. **第二步**: 实现粘贴板支持（App + ImageUploader）
3. **第三步**: 简化预览区域（App + ImagePreview）
4. **第四步**: 参数面板折叠（ProcessingPanel）
5. **第五步**: 视觉反馈优化（全局）

## 向后兼容性

- 保留所有现有参数
- 预设只是参数的快捷方式
- 高级用户仍可手动调整所有参数
- 批量处理模式保持不变

## 验收标准

### 功能验收
- [ ] Ctrl+V 可粘贴图片到正确位置
- [ ] 预设方案一键切换生效
- [ ] 实时预览正常工作
- [ ] 下载功能正常

### 体验验收
- [ ] 新用户无需说明即可完成操作
- [ ] 操作步骤从 6 步减少到 3 步
- [ ] 界面信息层次清晰
