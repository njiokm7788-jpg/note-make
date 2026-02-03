# 响应式适配与边界情况处理

## 响应式断点定义

| 断点名称 | 宽度范围 | Tailwind 类 | 典型设备 |
|----------|----------|-------------|----------|
| 小屏 | < 768px | `sm:` | 手机 |
| 中屏 | 768px - 1023px | `md:` | 平板竖屏 |
| 大屏 | 1024px - 1279px | `lg:` | 平板横屏、小笔记本 |
| 超大屏 | >= 1280px | `xl:` | 桌面显示器 |

---

## 大屏布局 (>=1280px)

### 布局结构

```
+------------------------------------------------------------------+
| Header (h-12)                                                     |
+------------------------------------------------------------------+
| 上传状态条 (h-12)                                                 |
+----------+-------------------------------------------------------+
|          |                                                       |
| 侧边栏   |                    预览区                             |
| (280px)  |                  (flex-1)                             |
|          |                                                       |
| 固定     |                                                       |
| 展开     |                                                       |
|          |                                                       |
+----------+-------------------------------------------------------+
```

### 特性

- 侧边栏: 固定展开 280px
- 预览区: 占据剩余空间
- 高级设置: 默认可展开
- 对比视图: 2x2 网格，每格最小 300px

### CSS 实现

```css
@media (min-width: 1280px) {
  .main-layout {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 1rem;
  }

  .sidebar {
    position: sticky;
    top: 96px; /* header + status bar */
    height: calc(100vh - 96px);
    overflow-y: auto;
  }

  .preview-grid {
    grid-template-columns: repeat(2, minmax(300px, 1fr));
  }
}
```

---

## 中屏布局 (768px - 1279px)

### 布局结构

```
+--------------------------------------------------+
| Header (h-12)                                    |
+--------------------------------------------------+
| 上传状态条 (h-12)                                |
+------+-------------------------------------------+
|      |                                           |
| 侧边 |              预览区                       |
| 栏   |            (flex-1)                       |
| 可   |                                           |
| 折叠 |                                           |
| 48px |                                           |
| /    |                                           |
| 240px|                                           |
+------+-------------------------------------------+
```

### 特性

- 侧边栏: 默认展开 240px，可折叠到 48px
- 预览区: 自适应宽度
- 高级设置: 默认折叠
- 对比视图: 2x2 网格，可能需要滚动

### 折叠行为

```typescript
// 中屏默认展开，但提供折叠按钮
const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

// 响应式监听
useEffect(() => {
  const handleResize = () => {
    if (window.innerWidth < 1024 && window.innerWidth >= 768) {
      // 中屏：保持用户选择
    }
  };
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

---

## 小屏布局 (<768px)

### 布局结构

```
+----------------------------------+
| Header (h-12)                    |
+----------------------------------+
| 上传状态条 (h-auto, 可展开)      |
+----------------------------------+
|                                  |
|           预览区                 |
|         (全宽)                   |
|                                  |
+----------------------------------+
| [设置] 浮动按钮                  |
+----------------------------------+

// 点击设置按钮后
+----------------------------------+
| Header                           |
+----------------------------------+
| 预览区 (被遮罩)                  |
+==================================+
|                                  |
|        底部设置抽屉              |
|        (从底部滑出)              |
|                                  |
+----------------------------------+
```

### 特性

- 侧边栏: 转为底部抽屉
- 预览区: 全宽显示
- 上传状态条: 垂直堆叠
- 对比视图: 单列显示，垂直滚动

### 上传状态条适配

```
小屏状态条:
+----------------------------------+
| [缩略图] 原图.jpg           [勾] |
+----------------------------------+
| [缩略图] 标注.jpg           [勾] |
+----------------------------------+
|           [更换图片]             |
+----------------------------------+
```

### 底部设置抽屉

```css
.mobile-settings-drawer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 70vh;
  transform: translateY(100%);
  transition: transform 300ms ease-out;
  border-radius: 1rem 1rem 0 0;
  background: white;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
}

.mobile-settings-drawer.open {
  transform: translateY(0);
}
```

### 手势支持

```typescript
// 下滑关闭抽屉
const handleTouchMove = (e: TouchEvent) => {
  const deltaY = e.touches[0].clientY - touchStartY;
  if (deltaY > 50) {
    closeDrawer();
  }
};
```

---

## 边界情况处理

### 1. 图片尺寸不匹配

**检测时机**: 两张图片都上传后

**检测逻辑**:
```typescript
async function validateImageDimensions(
  original: File,
  annotated: File
): Promise<{ valid: boolean; message?: string }> {
  const [origDim, annoDim] = await Promise.all([
    getImageDimensions(original),
    getImageDimensions(annotated),
  ]);

  if (origDim.width !== annoDim.width || origDim.height !== annoDim.height) {
    return {
      valid: false,
      message: `图片尺寸不匹配：原图 ${origDim.width}x${origDim.height}，标注图 ${annoDim.width}x${annoDim.height}`,
    };
  }

  return { valid: true };
}
```

**提示方式**:

```
+--------------------------------------------------+
|  [!] 图片尺寸不匹配                              |
|                                                  |
|  原图: 1920 x 1080                               |
|  标注图: 1920 x 1200                             |
|                                                  |
|  建议: 请确保两张图片来自同一截图                |
|                                                  |
|  [仍然处理]    [重新上传]                        |
+--------------------------------------------------+
```

**处理策略**:
- 警告但允许继续 (可能导致错位)
- 提供自动裁剪选项 (取交集区域)
- 提供自动缩放选项 (缩放到相同尺寸)

### 2. 非图片文件处理

**检测逻辑**:
```typescript
function isImageFile(file: File): boolean {
  // 检查 MIME 类型
  if (!file.type.startsWith('image/')) {
    return false;
  }

  // 检查扩展名
  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'];
  const ext = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
  if (!ext || !validExtensions.includes(ext)) {
    return false;
  }

  return true;
}
```

**提示方式**:

```
+--------------------------------------------------+
|  [!] 不支持的文件格式                            |
|                                                  |
|  文件: document.pdf                              |
|  类型: application/pdf                           |
|                                                  |
|  支持的格式: JPG, PNG, WebP, GIF, BMP            |
|                                                  |
|  [重新选择]                                      |
+--------------------------------------------------+
```

**拖拽多文件时**:
- 过滤非图片文件
- 提示 "已忽略 X 个非图片文件"

### 3. 文件过大

**限制**:
- 单文件最大: 20MB
- 建议尺寸: < 4000x4000 像素

**检测逻辑**:
```typescript
function validateFileSize(file: File): { valid: boolean; message?: string } {
  const MAX_SIZE = 20 * 1024 * 1024; // 20MB

  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      message: `文件过大 (${formatFileSize(file.size)})，最大支持 20MB`,
    };
  }

  return { valid: true };
}
```

**提示方式**:
```
+--------------------------------------------------+
|  [!] 文件过大                                    |
|                                                  |
|  文件: large_image.png (45.2 MB)                 |
|  限制: 最大 20 MB                                |
|                                                  |
|  建议: 请压缩图片后重新上传                      |
|                                                  |
|  [选择其他文件]                                  |
+--------------------------------------------------+
```

### 4. 网络错误/处理失败

**错误类型**:
```typescript
enum ProcessingError {
  LOAD_FAILED = 'LOAD_FAILED',       // 图片加载失败
  DECODE_FAILED = 'DECODE_FAILED',   // 图片解码失败
  MEMORY_ERROR = 'MEMORY_ERROR',     // 内存不足
  UNKNOWN = 'UNKNOWN',               // 未知错误
}
```

**错误处理**:
```typescript
async function processWithErrorHandling() {
  try {
    const result = await generatePreview(original, annotated, options);
    setPreview(result);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'EncodingError') {
      showError('图片解码失败，请尝试其他格式');
    } else if (error.message?.includes('memory')) {
      showError('内存不足，请尝试较小的图片');
    } else {
      showError('处理失败，请重试');
      console.error('Processing error:', error);
    }
  }
}
```

**重试机制**:
- 自动重试: 1次，延迟 1秒
- 手动重试: 提供重试按钮
- 最大重试: 3次后提示联系支持

### 5. 浏览器兼容性

**最低要求**:
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

**功能检测**:
```typescript
function checkBrowserSupport(): { supported: boolean; missing: string[] } {
  const missing: string[] = [];

  if (!window.FileReader) missing.push('FileReader API');
  if (!window.Blob) missing.push('Blob API');
  if (!document.createElement('canvas').getContext) missing.push('Canvas API');
  if (!window.URL?.createObjectURL) missing.push('URL.createObjectURL');

  return {
    supported: missing.length === 0,
    missing,
  };
}
```

**不支持时的提示**:
```
+--------------------------------------------------+
|  [!] 浏览器不支持                                |
|                                                  |
|  您的浏览器缺少以下功能:                         |
|  - Canvas API                                    |
|                                                  |
|  请升级到最新版本的 Chrome、Firefox 或 Edge      |
|                                                  |
+--------------------------------------------------+
```

### 6. 图片损坏

**检测方式**:
```typescript
function validateImage(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = URL.createObjectURL(file);
  });
}
```

**提示方式**:
```
+--------------------------------------------------+
|  [!] 图片无法加载                                |
|                                                  |
|  文件 "image.jpg" 可能已损坏或格式不正确         |
|                                                  |
|  [选择其他文件]                                  |
+--------------------------------------------------+
```

---

## 性能优化

### 大图片处理

```typescript
// 超过阈值时显示警告
const LARGE_IMAGE_THRESHOLD = 4000 * 4000; // 1600万像素

async function checkImageSize(file: File): Promise<void> {
  const dim = await getImageDimensions(file);
  const pixels = dim.width * dim.height;

  if (pixels > LARGE_IMAGE_THRESHOLD) {
    showWarning('图片较大，处理可能需要较长时间');
  }
}
```

### 内存管理

```typescript
// 及时释放 ObjectURL
useEffect(() => {
  return () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };
}, [previewUrl]);
```

### 防抖处理

```typescript
// 参数变化时防抖处理
const debouncedOptions = useDebounce(options, 300);

useEffect(() => {
  if (autoPreview && canProcess) {
    processImages();
  }
}, [debouncedOptions]);
```

---

## 错误恢复

### 状态回滚

```typescript
// 保存上一个有效状态
const [lastValidState, setLastValidState] = useState<AppState | null>(null);

function rollback() {
  if (lastValidState) {
    setOriginalFile(lastValidState.originalFile);
    setAnnotatedFile(lastValidState.annotatedFile);
    setOptions(lastValidState.options);
    showToast('已恢复到上一个状态', 'info');
  }
}
```

### 自动保存

```typescript
// 定期保存状态到 sessionStorage
useEffect(() => {
  const state = { originalFile, annotatedFile, options };
  sessionStorage.setItem('app-state', JSON.stringify(state));
}, [originalFile, annotatedFile, options]);

// 页面刷新时恢复
useEffect(() => {
  const saved = sessionStorage.getItem('app-state');
  if (saved) {
    // 恢复状态...
  }
}, []);
```
