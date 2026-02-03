# 前端布局重构实施计划

## 项目概述

**目标**: 实现"抽屉式上传区 + 侧边栏设置"布局，解决空间利用不足和频繁滚动问题

**设计规格**: `.workflow/.brainstorming/ux-expert/`

## 目标布局

```
+------------------------------------------+
| Header (h-12)                            |
+------------------------------------------+
| 上传状态条 (h-12) - 紧凑显示上传状态      |
+------+-----------------------------------+
| 侧边 |                                   |
| 栏   |        预览区（最大化）           |
| 280px|                                   |
|      |        [结果图]                   |
| 预设 |                                   |
| 高级 |   [查看对比]  [下载结果]          |
| 下载 |                                   |
+------+-----------------------------------+
```

---

## 实施阶段

### Phase 1: 新组件开发 (基础组件)

#### Task 1.1: UploadStatusBar 组件
**文件**: `src/components/UploadStatusBar.tsx`

**功能**:
- 6 种状态显示 (empty/partial-original/partial-annotated/complete/uploading/error)
- 缩略图 + 文件名显示
- 点击展开上传抽屉
- 拖拽激活状态

**Props**:
```typescript
interface UploadStatusBarProps {
  originalFile: File | null;
  annotatedFile: File | null;
  onOpenDrawer: () => void;
  onClear: () => void;
  uploadProgress?: number;
  error?: string;
}
```

#### Task 1.2: UploadDrawer 组件
**文件**: `src/components/UploadDrawer.tsx`

**功能**:
- 从顶部滑出的模态抽屉
- 两个拖拽上传区域
- 遮罩层 + ESC 关闭
- 智能文件分配逻辑
- 焦点管理

**Props**:
```typescript
interface UploadDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  originalFile: File | null;
  annotatedFile: File | null;
  onOriginalSelect: (file: File) => void;
  onAnnotatedSelect: (file: File) => void;
  autoCloseOnComplete?: boolean;
}
```

#### Task 1.3: Sidebar 组件
**文件**: `src/components/Sidebar.tsx`

**功能**:
- 固定宽度 280px，可折叠到 48px
- 包含预设选择、高级设置、下载按钮
- 响应式折叠逻辑
- 状态持久化 (localStorage)

**Props**:
```typescript
interface SidebarProps {
  options: ProcessingOptions;
  onChange: (options: ProcessingOptions) => void;
  onDownload: () => void;
  canDownload: boolean;
  isProcessing: boolean;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}
```

---

### Phase 2: 布局重构 (App.tsx)

#### Task 2.1: 重构 App.tsx 布局结构

**改动点**:
1. 移除原有的 `grid-cols-3` 布局
2. 添加 UploadStatusBar 在 Header 下方
3. 实现 `侧边栏 + 主内容区` 的 flex 布局
4. 预览区占据剩余空间

**新布局结构**:
```tsx
<div className="min-h-screen flex flex-col">
  <Header />
  <UploadStatusBar />
  <div className="flex flex-1">
    <Sidebar />
    <main className="flex-1">
      <PreviewArea />
    </main>
  </div>
</div>
```

#### Task 2.2: 状态管理调整

**新增状态**:
```typescript
const [isDrawerOpen, setIsDrawerOpen] = useState(false);
const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
```

**移除/调整**:
- 移除 ProcessingPanel 在左列的渲染
- 调整预览区布局逻辑

---

### Phase 3: 预览区优化

#### Task 3.1: 优化 ImagePreview 组件

**改动点**:
- 移除 `max-h-80` 限制，改为 `max-h-[60vh]`
- 优化简化视图布局
- 下载按钮位置调整

#### Task 3.2: 预览区容器重构

**改动点**:
- 预览区占据主内容区全部空间
- 简化视图居中显示
- 对比视图 2x2 网格

---

### Phase 4: 响应式适配

#### Task 4.1: 中屏适配 (768-1279px)

**改动点**:
- 侧边栏默认可折叠
- 添加折叠按钮
- 折叠后显示图标栏

#### Task 4.2: 小屏适配 (<768px)

**改动点**:
- 侧边栏转为底部抽屉
- 上传状态条垂直堆叠
- 添加浮动设置按钮

---

### Phase 5: 交互增强

#### Task 5.1: 快捷键支持

**实现**:
- `Ctrl+V`: 智能粘贴 (已有，需调整)
- `Ctrl+S`: 下载结果
- `Ctrl+B`: 切换侧边栏
- `Space`: 切换预览视图
- `Escape`: 关闭抽屉/模态框

#### Task 5.2: 动画效果

**实现**:
- 抽屉展开/收起动画 (300ms ease-out)
- 侧边栏折叠动画 (250ms ease-out)
- 遮罩淡入/淡出 (200ms ease)

---

## 文件变更清单

### 新增文件
- `src/components/UploadStatusBar.tsx`
- `src/components/UploadDrawer.tsx`
- `src/components/Sidebar.tsx`

### 修改文件
- `src/App.tsx` - 布局重构
- `src/components/ImagePreview.tsx` - 尺寸优化
- `src/components/ProcessingPanel.tsx` - 可能废弃或重构为 Sidebar 内部组件

### 可能废弃
- `src/components/ImageUploader.tsx` - 功能合并到 UploadDrawer

---

## 依赖关系

```
Phase 1 (组件开发)
  ├── Task 1.1 UploadStatusBar
  ├── Task 1.2 UploadDrawer  
  └── Task 1.3 Sidebar
        ↓
Phase 2 (布局重构)
  ├── Task 2.1 App.tsx 布局
  └── Task 2.2 状态管理
        ↓
Phase 3 (预览区优化)
  ├── Task 3.1 ImagePreview
  └── Task 3.2 预览区容器
        ↓
Phase 4 (响应式)
  ├── Task 4.1 中屏适配
  └── Task 4.2 小屏适配
        ↓
Phase 5 (交互增强)
  ├── Task 5.1 快捷键
  └── Task 5.2 动画
```

---

## 风险与注意事项

1. **向后兼容**: 批量处理模式暂不改动，保持原有布局
2. **状态迁移**: 确保现有的实时预览、粘贴功能正常工作
3. **测试覆盖**: 每个 Phase 完成后进行功能测试
4. **渐进式发布**: 可先实现 Phase 1-2，验证后再继续

---

## 验收标准

- [ ] 上传状态条正确显示 6 种状态
- [ ] 上传抽屉展开/收起动画流畅
- [ ] 侧边栏折叠/展开正常工作
- [ ] 预览区空间最大化
- [ ] 无需滚动即可完成完整操作流程
- [ ] 快捷键全部可用
- [ ] 响应式断点正确适配
