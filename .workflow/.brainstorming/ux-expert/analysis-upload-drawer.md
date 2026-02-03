# 上传抽屉交互规格

## 组件定位

上传抽屉是一个从顶部滑出的面板，用于详细的图片上传操作。它覆盖在主内容区之上，提供更大的拖拽区域和更详细的上传反馈。

---

## 抽屉结构

```
+------------------------------------------------------------------+
| Header (固定)                                                     |
+------------------------------------------------------------------+
| 上传状态条 (触发器)                                               |
+==================================================================+
|                                                                  |
|  +------------------------+    +------------------------+        |
|  |                        |    |                        |        |
|  |      原始图片          |    |      AI标注图片        |        |
|  |      拖拽区域          |    |      拖拽区域          |        |
|  |                        |    |                        |        |
|  +------------------------+    +------------------------+        |
|                                                                  |
|                    [完成] [取消]                                  |
|                                                                  |
+==================================================================+
|  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  |
|  ░░░░░░░░░░░░░░░░░░ 遮罩层 (可点击关闭) ░░░░░░░░░░░░░░░░░░░░░░░  |
|  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  |
+------------------------------------------------------------------+
```

---

## 展开/收起动画

### 展开动画

**触发条件**:
- 点击状态条任意位置
- 点击"更换"按钮
- 键盘快捷键 (可选)

**动画序列**:
1. **T+0ms**: 遮罩层开始淡入 (`opacity: 0 -> 0.5`)
2. **T+50ms**: 抽屉面板开始下滑 (`translateY: -100% -> 0`)
3. **T+300ms**: 动画完成，焦点移至第一个未上传的拖拽区

**CSS 规格**:
```css
/* 抽屉面板 */
.drawer-panel {
  transform: translateY(-100%);
  transition: transform 300ms ease-out;
}
.drawer-panel.open {
  transform: translateY(0);
}

/* 遮罩层 */
.drawer-overlay {
  opacity: 0;
  transition: opacity 200ms ease;
  pointer-events: none;
}
.drawer-overlay.open {
  opacity: 0.5;
  pointer-events: auto;
}
```

### 收起动画

**触发条件**:
- 点击"完成"按钮
- 点击遮罩层
- 按 ESC 键
- 两张图片都已上传后自动收起 (可配置)

**动画序列**:
1. **T+0ms**: 抽屉面板开始上滑 (`translateY: 0 -> -100%`)
2. **T+100ms**: 遮罩层开始淡出 (`opacity: 0.5 -> 0`)
3. **T+300ms**: 动画完成，焦点返回主内容区

---

## 抽屉内拖拽区域设计

### 单个拖拽区域结构

```
+----------------------------------------+
|                                        |
|            [上传图标]                  |
|                                        |
|     点击上传 或 拖拽文件到此处         |
|                                        |
|     支持 JPG, PNG, WebP 格式           |
|     最大 20MB                          |
|                                        |
|          [Ctrl+V 粘贴]                 |
|                                        |
+----------------------------------------+
```

### 拖拽区域状态

#### 1. 默认状态 (idle)

**样式**:
- 边框: `border-2 border-dashed border-slate-300`
- 背景: `bg-white`
- 图标: 云上传图标 `text-slate-400`
- 文字: `text-slate-500`

#### 2. 悬停状态 (hover)

**样式**:
- 边框: `border-primary-400`
- 背景: `bg-primary-50`
- 图标: `text-primary-500`
- 过渡: `transition-all duration-200`

#### 3. 拖拽激活状态 (drag-active)

**样式**:
- 边框: `border-2 border-solid border-primary-500`
- 背景: `bg-primary-100`
- 图标: 放大 + 弹跳动画
- 文字: "释放以上传"
- 阴影: `ring-4 ring-primary-200`

#### 4. 已上传状态 (uploaded)

**样式**:
- 边框: `border-2 border-solid border-green-400`
- 背景: `bg-green-50`
- 内容: 图片预览 + 文件信息 + 移除按钮

**结构**:
```
+----------------------------------------+
|  +----------------------------------+  |
|  |                                  |  |
|  |         [图片预览]               |  |
|  |         max-h-48                 |  |
|  |                                  |  |
|  +----------------------------------+  |
|                                        |
|  filename.jpg                    [x]   |
|  1.2 MB                                |
|                                        |
+----------------------------------------+
```

#### 5. 上传中状态 (uploading)

**样式**:
- 边框: `border-primary-400`
- 背景: 半透明遮罩
- 内容: 进度环 + 百分比

**结构**:
```
+----------------------------------------+
|                                        |
|           [进度环动画]                 |
|              45%                       |
|                                        |
|           正在处理...                  |
|                                        |
+----------------------------------------+
```

#### 6. 错误状态 (error)

**样式**:
- 边框: `border-2 border-dashed border-red-400`
- 背景: `bg-red-50`
- 图标: 错误图标 `text-red-500`
- 文字: 错误信息 `text-red-600`

**结构**:
```
+----------------------------------------+
|                                        |
|            [错误图标]                  |
|                                        |
|     文件格式不支持                     |
|     请上传 JPG, PNG 或 WebP 格式       |
|                                        |
|           [重新选择]                   |
|                                        |
+----------------------------------------+
```

---

## 遮罩层设计

### 视觉规格

- 颜色: `bg-black`
- 透明度: `opacity-50` (50%)
- 层级: `z-40` (抽屉面板 `z-50`)
- 模糊: 可选 `backdrop-blur-sm`

### 交互行为

- 点击遮罩 -> 关闭抽屉
- 滚动锁定: 打开抽屉时禁止背景滚动 (`overflow: hidden` on body)

---

## 关闭抽屉的方式

### 1. 点击"完成"按钮

**位置**: 抽屉底部居中
**样式**: 主按钮样式 `bg-primary-500 text-white`
**行为**:
- 验证上传状态
- 如果两张都已上传 -> 关闭抽屉，开始处理
- 如果未完成 -> 显示提示，但仍允许关闭

### 2. 点击遮罩层

**行为**:
- 直接关闭抽屉
- 保留已上传的图片
- 不触发处理

### 3. 按 ESC 键

**行为**:
- 同点击遮罩层
- 需要抽屉获得焦点或全局监听

**实现**:
```typescript
useEffect(() => {
  const handleEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isDrawerOpen) {
      closeDrawer();
    }
  };
  document.addEventListener('keydown', handleEsc);
  return () => document.removeEventListener('keydown', handleEsc);
}, [isDrawerOpen]);
```

### 4. 自动关闭 (可配置)

**触发条件**: 两张图片都已上传
**延迟**: 500ms (让用户看到上传成功状态)
**配置项**: `autoCloseOnComplete: boolean`

---

## 智能上传逻辑

### 文件分配规则

当用户拖拽或粘贴单个文件时:

```typescript
function assignFile(file: File) {
  // 1. 如果原图为空，分配到原图
  if (!originalFile) {
    setOriginalFile(file);
    return 'original';
  }

  // 2. 如果标注图为空，分配到标注图
  if (!annotatedFile) {
    setAnnotatedFile(file);
    return 'annotated';
  }

  // 3. 两个都有，替换原图（可配置）
  setOriginalFile(file);
  return 'original-replaced';
}
```

### 文件名智能识别

```typescript
function detectFileType(filename: string): 'original' | 'annotated' | 'unknown' {
  const annotatedPatterns = [
    /annotated/i,
    /marked/i,
    /标注/,
    /_ai$/i,
    /-ai$/i,
  ];

  for (const pattern of annotatedPatterns) {
    if (pattern.test(filename)) {
      return 'annotated';
    }
  }

  return 'unknown';
}
```

---

## 焦点管理

### 打开抽屉时

1. 保存当前焦点元素
2. 将焦点移至第一个未上传的拖拽区域
3. 设置焦点陷阱 (focus trap)

### 关闭抽屉时

1. 释放焦点陷阱
2. 恢复之前保存的焦点元素

### Tab 顺序

```
原图拖拽区 -> 标注图拖拽区 -> 完成按钮 -> 取消按钮 -> (循环)
```

---

## 无障碍支持

### ARIA 属性

```html
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="drawer-title"
  aria-describedby="drawer-description"
>
  <h2 id="drawer-title">上传图片</h2>
  <p id="drawer-description">请上传原始图片和AI标注图片</p>
  <!-- 内容 -->
</div>
```

### 屏幕阅读器提示

- 打开抽屉: "上传图片对话框已打开"
- 上传成功: "原始图片已上传"
- 上传失败: "上传失败，文件格式不支持"
- 关闭抽屉: "对话框已关闭"
