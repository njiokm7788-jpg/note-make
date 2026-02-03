# 侧边栏交互规格

## 组件定位

侧边栏是一个固定宽度的设置面板，位于主内容区左侧。它包含处理参数设置、预设选择和操作按钮，采用折叠式设计以适应不同屏幕尺寸。

---

## 侧边栏结构

```
+---------------------------+
| 处理设置              [-] |  <- 标题 + 折叠按钮
+---------------------------+
| 快速预设                  |
| [标准] [鲜艳] [柔和]      |
+---------------------------+
| 高级设置              [v] |  <- 可折叠区域
| +-------------------------+
| | 文字检测阈值    [180]   |
| | [==========----]        |
| |                         |
| | 遮罩膨胀半径    [3px]   |
| | [=====---------]        |
| |                         |
| | 标注透明度      [80%]   |
| | [========------]        |
| +-------------------------+
+---------------------------+
| [实时预览] [开关]         |
+---------------------------+
|                           |
| [====== 下载结果 ======]  |  <- 主操作按钮
|                           |
+---------------------------+
```

---

## 折叠/展开机制

### 侧边栏整体折叠

#### 触发方式

1. **手动触发**: 点击侧边栏顶部的折叠按钮
2. **响应式触发**: 屏幕宽度 < 1024px 时自动折叠
3. **快捷键**: `Ctrl+B` 切换侧边栏

#### 折叠状态

**完全折叠 (collapsed)**:
```
+----+
| [] |  <- 仅显示图标按钮
| [] |
| [] |
| [] |
+----+
宽度: 48px
```

**展开状态 (expanded)**:
```
+---------------------------+
| 处理设置              [-] |
| ...完整内容...            |
+---------------------------+
宽度: 280px
```

#### 动画规格

```css
.sidebar {
  width: 280px;
  transition: width 250ms ease-out;
}

.sidebar.collapsed {
  width: 48px;
}

.sidebar-content {
  opacity: 1;
  transition: opacity 150ms ease;
}

.sidebar.collapsed .sidebar-content {
  opacity: 0;
  pointer-events: none;
}
```

### 高级设置折叠

#### 默认状态

- 首次访问: 折叠
- 用户展开后: 记住状态 (localStorage)

#### 折叠/展开动画

```css
.advanced-settings {
  max-height: 0;
  overflow: hidden;
  transition: max-height 200ms ease-out;
}

.advanced-settings.expanded {
  max-height: 500px; /* 足够大的值 */
}
```

#### 折叠按钮

**样式**:
- 图标: 向下箭头 (折叠时) / 向上箭头 (展开时)
- 旋转动画: `rotate(180deg)` 过渡

---

## 响应式断点处理

### 大屏 (>=1280px)

**布局**:
- 侧边栏: 固定展开，280px
- 预览区: 占据剩余空间
- 高级设置: 默认展开

**行为**:
- 侧边栏始终可见
- 折叠按钮可用但不推荐

### 中屏 (1024px - 1279px)

**布局**:
- 侧边栏: 默认展开，可手动折叠
- 预览区: 自适应宽度

**行为**:
- 提供折叠按钮
- 折叠后显示图标栏

### 小屏 (768px - 1023px)

**布局**:
- 侧边栏: 默认折叠
- 展开时覆盖预览区 (overlay 模式)

**行为**:
- 点击图标展开侧边栏
- 展开时显示遮罩层
- 点击遮罩或完成操作后自动收起

### 移动端 (<768px)

**布局**:
- 侧边栏: 底部抽屉模式
- 从底部滑出

**行为**:
- 点击浮动按钮展开
- 手势下滑关闭

---

## 与主内容区的联动

### 宽度联动

```typescript
// 主内容区宽度计算
const mainContentStyle = {
  marginLeft: sidebarCollapsed ? '48px' : '280px',
  transition: 'margin-left 250ms ease-out',
};
```

### 状态同步

侧边栏的设置变化需要实时反映到预览区:

```typescript
// 实时预览模式
useEffect(() => {
  if (autoPreview && originalFile && annotatedFile) {
    const debouncedProcess = debounce(processImages, 300);
    debouncedProcess();
  }
}, [options, autoPreview, originalFile, annotatedFile]);
```

### 处理状态反馈

当处理进行中时:
- 侧边栏参数控件: 禁用 (`disabled`)
- 下载按钮: 显示加载状态
- 预览区: 显示处理进度

---

## 侧边栏内部组件

### 预设选择器

**结构**:
```
+---------------------------+
| 快速预设                  |
| +-------+ +-------+ +---+ |
| |标准   | |鲜艳   | |柔和| |
| +-------+ +-------+ +---+ |
+---------------------------+
```

**交互**:
- 点击预设 -> 应用预设参数
- 选中状态: `bg-primary-500 text-white`
- 未选中: `bg-slate-100 text-slate-700`
- 自定义参数后: 取消所有预设选中状态

### 滑块控件

**结构**:
```
+---------------------------+
| 文字检测阈值        [180] |
| [==========--------]      |
| 说明文字...               |
+---------------------------+
```

**交互**:
- 拖动滑块 -> 实时更新数值
- 点击轨道 -> 跳转到点击位置
- 键盘: 左右箭头微调

**样式**:
- 轨道: `h-2 bg-slate-200 rounded-full`
- 滑块: `w-4 h-4 bg-primary-500 rounded-full`
- 已填充: `bg-primary-500`

### 开关控件

**结构**:
```
+---------------------------+
| 实时预览            [===] |
+---------------------------+
```

**交互**:
- 点击切换状态
- 动画: 滑块左右移动 200ms

**样式**:
- 开启: `bg-primary-500`
- 关闭: `bg-slate-300`
- 滑块: `bg-white shadow-sm`

### 操作按钮

**主按钮 (下载)**:
- 样式: `bg-green-500 text-white w-full py-3`
- 禁用: `bg-slate-200 text-slate-400`
- 加载: 显示旋转图标

**次要按钮 (预览)**:
- 仅在关闭实时预览时显示
- 样式: `bg-primary-500 text-white`

---

## 折叠状态下的图标栏

当侧边栏折叠时，显示图标快捷入口:

```
+----+
| [预] |  <- 预设图标，点击展开预设面板
| [参] |  <- 参数图标，点击展开参数面板
| [下] |  <- 下载图标，直接触发下载
+----+
```

**交互**:
- 悬停: 显示 tooltip 说明
- 点击: 展开对应面板或执行操作

---

## 状态持久化

### 需要持久化的状态

```typescript
interface SidebarPersistState {
  collapsed: boolean;           // 侧边栏折叠状态
  advancedExpanded: boolean;    // 高级设置展开状态
  selectedPreset: string | null; // 选中的预设
  customOptions: ProcessingOptions; // 自定义参数
}
```

### 存储方式

```typescript
// 保存状态
useEffect(() => {
  localStorage.setItem('sidebar-state', JSON.stringify({
    collapsed: sidebarCollapsed,
    advancedExpanded: showAdvanced,
    selectedPreset,
    customOptions: options,
  }));
}, [sidebarCollapsed, showAdvanced, selectedPreset, options]);

// 恢复状态
useEffect(() => {
  const saved = localStorage.getItem('sidebar-state');
  if (saved) {
    const state = JSON.parse(saved);
    setSidebarCollapsed(state.collapsed);
    setShowAdvanced(state.advancedExpanded);
    // ...
  }
}, []);
```

---

## 无障碍支持

### 键盘导航

- `Tab`: 在控件间移动
- `Enter/Space`: 激活按钮/开关
- `Arrow Left/Right`: 调整滑块
- `Escape`: 关闭展开的面板

### ARIA 属性

```html
<aside
  role="complementary"
  aria-label="处理设置"
  aria-expanded={!collapsed}
>
  <section aria-labelledby="presets-heading">
    <h3 id="presets-heading">快速预设</h3>
    <!-- 预设按钮 -->
  </section>

  <section aria-labelledby="advanced-heading">
    <button
      aria-expanded={advancedExpanded}
      aria-controls="advanced-content"
    >
      <h3 id="advanced-heading">高级设置</h3>
    </button>
    <div id="advanced-content" hidden={!advancedExpanded}>
      <!-- 高级设置内容 -->
    </div>
  </section>
</aside>
```
