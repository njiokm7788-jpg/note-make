# 反向遮罩叠加算法分析报告

## 1. 概述

### 1.1 目标功能
实现"反向遮罩叠加模式"，将清晰原图的文字与模糊图的笔记标注合成：
- **输入**: 清晰原图 + 带笔记的模糊图
- **输出**: 清晰文字 + 可见笔记的合成图

### 1.2 核心处理流程
```
清晰原图 ──┬──> 文字检测 ──> 生成遮罩 ──┐
           │                            │
           └────────────────────────────┼──> 图像合成 ──> 输出
                                        │
模糊图 ────> 文字区域加色块 ────────────┘
```

---

## 2. 文字检测算法

### 2.1 亮度阈值检测原理

使用 ITU-R BT.601 标准的亮度计算公式：

```
luminance = 0.299 * R + 0.587 * G + 0.114 * B
```

**权重解释**:
- 绿色通道权重最高 (0.587)：人眼对绿色最敏感
- 红色通道次之 (0.299)：人眼对红色敏感度中等
- 蓝色通道最低 (0.114)：人眼对蓝色最不敏感

### 2.2 检测逻辑

```typescript
// 伪代码
function detectTextPixels(imageData: ImageData, threshold: number): boolean[] {
    const mask = new Array(width * height).fill(false);
    
    for (y = 0; y < height; y++) {
        for (x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            
            const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
            
            // 亮度低于阈值 = 深色 = 文字
            mask[y * width + x] = luminance < threshold;
        }
    }
    
    return mask;
}
```

### 2.3 阈值选择建议

| 阈值范围 | 适用场景 | 说明 |
|---------|---------|------|
| 180-200 | 标准黑色文字 | 推荐默认值 |
| 150-180 | 深灰色文字 | 更严格的检测 |
| 200-220 | 浅色背景 | 宽松检测，可能误检 |

**当前实现**: `textThreshold: 200` (默认值)

### 2.4 算法复杂度
- **时间复杂度**: O(n)，n = width * height
- **空间复杂度**: O(n)，存储布尔遮罩

---

## 3. 遮罩生成与膨胀

### 3.1 为什么需要遮罩膨胀

文字边缘存在抗锯齿像素，亮度介于文字和背景之间：

```
背景(255) ─ 抗锯齿(180-220) ─ 文字核心(<150)
```

如果不膨胀，抗锯齿区域可能被误判为非文字，导致：
- 文字边缘出现模糊图的内容
- 视觉上文字有"光晕"效果

### 3.2 膨胀算法对比

#### 方案 A: 方形膨胀 (简单但粗糙)

```typescript
function squareExpand(mask: boolean[], radius: number): boolean[] {
    const expanded = new Array(width * height).fill(false);
    
    for (y = 0; y < height; y++) {
        for (x = 0; x < width; x++) {
            if (mask[y * width + x]) {
                // 方形区域全部标记
                for (dy = -radius; dy <= radius; dy++) {
                    for (dx = -radius; dx <= radius; dx++) {
                        const nx = x + dx;
                        const ny = y + dy;
                        if (inBounds(nx, ny)) {
                            expanded[ny * width + nx] = true;
                        }
                    }
                }
            }
        }
    }
    
    return expanded;
}
```

**特点**: 
- 实现简单
- 膨胀区域为方形，角落过度膨胀
- 时间复杂度: O(n * r^2)

#### 方案 B: 圆形膨胀 (当前实现)

```typescript
function circularExpand(mask: boolean[], radius: number): boolean[] {
    const expanded = new Array(width * height).fill(false);
    
    for (y = 0; y < height; y++) {
        for (x = 0; x < width; x++) {
            if (mask[y * width + x]) {
                for (dy = -radius; dy <= radius; dy++) {
                    for (dx = -radius; dx <= radius; dx++) {
                        // 圆形判定: dx^2 + dy^2 <= r^2
                        if (dx * dx + dy * dy <= radius * radius) {
                            const nx = x + dx;
                            const ny = y + dy;
                            if (inBounds(nx, ny)) {
                                expanded[ny * width + nx] = true;
                            }
                        }
                    }
                }
            }
        }
    }
    
    return expanded;
}
```

**特点**:
- 膨胀区域为圆形，更自然
- 时间复杂度: O(n * r^2)

#### 方案 C: 边缘引导膨胀 (当前实现的高级模式)

```typescript
function edgeGuidedExpand(
    mask: boolean[],
    edges: Uint8Array,  // Sobel 边缘检测结果
    baseRadius: number,
    edgeThreshold: number
): boolean[] {
    const expanded = new Array(width * height).fill(false);
    
    for (y = 0; y < height; y++) {
        for (x = 0; x < width; x++) {
            if (mask[y * width + x]) {
                const edgeStrength = edges[y * width + x];
                
                // 边缘区域膨胀更多，确保覆盖抗锯齿
                const radius = edgeStrength > edgeThreshold
                    ? Math.ceil(baseRadius * 1.5)
                    : baseRadius;
                
                // 圆形膨胀
                for (dy = -radius; dy <= radius; dy++) {
                    for (dx = -radius; dx <= radius; dx++) {
                        if (dx * dx + dy * dy <= radius * radius) {
                            // ... 标记为 true
                        }
                    }
                }
            }
        }
    }
    
    return expanded;
}
```

**特点**:
- 在文字边缘（高边缘强度）区域膨胀更多
- 在文字内部（低边缘强度）区域膨胀较少
- 更精确地覆盖抗锯齿区域

### 3.3 Sobel 边缘检测

用于边缘引导膨胀的预处理步骤：

```typescript
// Sobel 卷积核
const Gx = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];  // 水平梯度
const Gy = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];  // 垂直梯度

function sobelEdgeDetect(imageData: ImageData): Uint8Array {
    const edges = new Uint8Array(width * height);
    
    for (y = 1; y < height - 1; y++) {
        for (x = 1; x < width - 1; x++) {
            let gx = 0, gy = 0;
            
            // 3x3 卷积
            for (ky = -1; ky <= 1; ky++) {
                for (kx = -1; kx <= 1; kx++) {
                    const gray = getLuminance(pixel[y+ky][x+kx]);
                    gx += gray * Gx[ky+1][kx+1];
                    gy += gray * Gy[ky+1][kx+1];
                }
            }
            
            // 边缘强度 = sqrt(gx^2 + gy^2)
            edges[y * width + x] = Math.min(255, Math.sqrt(gx*gx + gy*gy));
        }
    }
    
    return edges;
}
```

### 3.4 膨胀参数建议

| 参数 | 推荐值 | 说明 |
|-----|-------|------|
| `maskExpand` | 2-4 | 基础膨胀半径 |
| `useEdgeGuidedExpand` | true | 启用边缘引导 |
| `edgeThreshold` | 30-50 | 边缘强度阈值 |

---

## 4. 色块叠加算法

### 4.1 处理流程

```
模糊图 ──> 在文字区域绘制色块 ──> 带色块的模糊图
```

### 4.2 实现方案

#### 方案 A: 像素级操作

```typescript
function addColorBlockToBlurred(
    blurredData: ImageData,
    textMask: boolean[],
    blockColor: {r: number, g: number, b: number}
): ImageData {
    const result = new ImageData(
        new Uint8ClampedArray(blurredData.data),
        blurredData.width,
        blurredData.height
    );
    
    for (let i = 0; i < textMask.length; i++) {
        if (textMask[i]) {
            const idx = i * 4;
            result.data[idx] = blockColor.r;
            result.data[idx + 1] = blockColor.g;
            result.data[idx + 2] = blockColor.b;
            result.data[idx + 3] = 255;
        }
    }
    
    return result;
}
```

**优点**: 精确控制每个像素
**缺点**: 无法利用 Canvas 硬件加速

#### 方案 B: Canvas fillRect 批量绘制 (推荐)

```typescript
function addColorBlockCanvas(
    blurredData: ImageData,
    textMask: boolean[],
    color: string
): ImageData {
    const canvas = document.createElement('canvas');
    canvas.width = blurredData.width;
    canvas.height = blurredData.height;
    const ctx = canvas.getContext('2d')!;
    
    // 1. 绘制模糊图
    ctx.putImageData(blurredData, 0, 0);
    
    // 2. 设置色块颜色
    ctx.fillStyle = color;
    
    // 3. 批量绘制连续区域 (行程编码优化)
    for (let y = 0; y < height; y++) {
        let startX: number | null = null;
        
        for (let x = 0; x <= width; x++) {
            const isMask = x < width && textMask[y * width + x];
            
            if (isMask && startX === null) {
                startX = x;  // 开始新的连续区域
            } else if (!isMask && startX !== null) {
                // 绘制连续区域
                ctx.fillRect(startX, y, x - startX, 1);
                startX = null;
            }
        }
    }
    
    return ctx.getImageData(0, 0, width, height);
}
```

**优点**: 
- 利用 Canvas 硬件加速
- 行程编码减少 fillRect 调用次数

**性能对比**:
| 方法 | 1000x1000 图片耗时 |
|-----|-------------------|
| 逐像素 fillRect | ~500ms |
| 行程编码 fillRect | ~50ms |
| 像素级操作 | ~30ms |

### 4.3 色块颜色选择

| 颜色 | 适用场景 |
|-----|---------|
| `#FFFFFF` (白色) | 白色背景文档 |
| `#F5F5DC` (米色) | 泛黄纸张 |
| `#FFFEF0` (象牙白) | 柔和背景 |
| 自动检测 | 根据原图背景色 |

**自动检测算法**:
```typescript
function detectBackgroundColor(imageData: ImageData): string {
    // 统计非文字区域的平均颜色
    let r = 0, g = 0, b = 0, count = 0;
    
    for (let i = 0; i < data.length; i += 4) {
        const luminance = getLuminance(data[i], data[i+1], data[i+2]);
        if (luminance > 200) {  // 高亮度 = 背景
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            count++;
        }
    }
    
    return `rgb(${r/count}, ${g/count}, ${b/count})`;
}
```

---

## 5. 图像合成算法

### 5.1 合成策略

```
最终图像 = 文字区域(清晰原图) + 非文字区域(带色块的模糊图)
```

### 5.2 像素级合成 (当前实现)

```typescript
function compositeImages(
    clearData: ImageData,      // 清晰原图
    processedBlurred: ImageData,  // 带色块的模糊图
    textMask: boolean[],
    annotationOpacity: number
): ImageData {
    const result = new ImageData(width, height);
    
    for (let i = 0; i < textMask.length; i++) {
        const idx = i * 4;
        
        if (textMask[i]) {
            // 文字区域: 使用清晰原图
            result.data[idx] = clearData.data[idx];
            result.data[idx + 1] = clearData.data[idx + 1];
            result.data[idx + 2] = clearData.data[idx + 2];
            result.data[idx + 3] = 255;
        } else {
            // 非文字区域: 混合清晰图和处理后的模糊图
            const alpha = annotationOpacity;
            result.data[idx] = lerp(clearData.data[idx], processedBlurred.data[idx], alpha);
            result.data[idx + 1] = lerp(clearData.data[idx + 1], processedBlurred.data[idx + 1], alpha);
            result.data[idx + 2] = lerp(clearData.data[idx + 2], processedBlurred.data[idx + 2], alpha);
            result.data[idx + 3] = 255;
        }
    }
    
    return result;
}

function lerp(a: number, b: number, t: number): number {
    return Math.round(a * (1 - t) + b * t);
}
```

### 5.3 Canvas globalCompositeOperation 方案

```typescript
function compositeWithCanvas(
    clearData: ImageData,
    processedBlurred: ImageData,
    textMask: boolean[]
): ImageData {
    // 1. 创建遮罩 Canvas (文字区域白色，其他黑色)
    const maskCanvas = createMaskCanvas(textMask, width, height);
    
    // 2. 创建结果 Canvas
    const resultCanvas = document.createElement('canvas');
    resultCanvas.width = width;
    resultCanvas.height = height;
    const ctx = resultCanvas.getContext('2d')!;
    
    // 3. 绘制处理后的模糊图作为基础
    ctx.putImageData(processedBlurred, 0, 0);
    
    // 4. 使用 destination-out 清除文字区域
    ctx.globalCompositeOperation = 'destination-out';
    ctx.drawImage(maskCanvas, 0, 0);
    
    // 5. 使用 destination-over 在底层绘制清晰图
    ctx.globalCompositeOperation = 'destination-over';
    const clearCanvas = imageDataToCanvas(clearData);
    ctx.drawImage(clearCanvas, 0, 0);
    
    return ctx.getImageData(0, 0, width, height);
}
```

**globalCompositeOperation 模式说明**:
| 模式 | 效果 |
|-----|------|
| `source-over` | 新图覆盖旧图 (默认) |
| `destination-out` | 用新图的形状从旧图中"挖洞" |
| `destination-over` | 新图绘制在旧图下方 |
| `source-in` | 只保留新图与旧图重叠部分 |

---

## 6. 边界处理

### 6.1 尺寸不匹配处理

当清晰图和模糊图尺寸不同时：

```typescript
function alignImages(
    source: ImageData,
    targetWidth: number,
    targetHeight: number
): ImageData {
    const sourceCanvas = document.createElement('canvas');
    sourceCanvas.width = source.width;
    sourceCanvas.height = source.height;
    sourceCanvas.getContext('2d')!.putImageData(source, 0, 0);
    
    const targetCanvas = document.createElement('canvas');
    targetCanvas.width = targetWidth;
    targetCanvas.height = targetHeight;
    const ctx = targetCanvas.getContext('2d')!;
    
    // 使用双线性插值缩放
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);
    
    return ctx.getImageData(0, 0, targetWidth, targetHeight);
}
```

### 6.2 缩放策略

| 策略 | 说明 | 适用场景 |
|-----|------|---------|
| 拉伸填充 | 直接缩放到目标尺寸 | 尺寸差异小 |
| 等比缩放 | 保持宽高比，可能有黑边 | 需要保持比例 |
| 裁剪填充 | 等比缩放后裁剪 | 需要完全填充 |

**当前实现**: 拉伸填充 (简单直接)

### 6.3 边缘像素处理

Sobel 边缘检测在图像边缘 (1px 边框) 无法计算：

```typescript
// 边缘像素设为 0
for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
        // 正常计算
    }
}
// 边缘行/列保持为 0
```

---

## 7. 完整处理流程伪代码

```typescript
async function processReverseMaskOverlay(
    clearFile: File,
    blurredFile: File,
    options: ProcessingOptions
): Promise<Blob> {
    // 1. 加载图片
    const [clearImg, blurredImg] = await Promise.all([
        loadImage(clearFile),
        loadImage(blurredFile)
    ]);
    
    // 2. 获取图像数据
    const clearData = getImageData(clearImg);
    let blurredData = getImageData(blurredImg);
    
    // 3. 尺寸对齐
    if (clearData.width !== blurredData.width || 
        clearData.height !== blurredData.height) {
        blurredData = alignImages(blurredData, clearData.width, clearData.height);
    }
    
    // 4. 从清晰图检测文字区域
    const textMask = extractTextMask(
        clearData,
        options.textThreshold,
        options.maskExpand,
        options.useEdgeGuidedExpand,
        options.edgeThreshold
    );
    
    // 5. 在模糊图文字区域添加色块
    const processedBlurred = addColorBlock(
        blurredData,
        textMask,
        options.blockColor || '#FFFFFF'
    );
    
    // 6. 合成最终图像
    const result = compositeImages(
        clearData,
        processedBlurred,
        textMask,
        options.annotationOpacity
    );
    
    // 7. 转换为 Blob
    return imageDataToBlob(result);
}
```

---

## 8. 性能优化建议

### 8.1 内存优化

```typescript
// 避免创建过多中间数组
// 使用 TypedArray 替代普通数组
const mask = new Uint8Array(width * height);  // 比 boolean[] 更省内存
```

### 8.2 计算优化

```typescript
// 预计算常量
const threshold = options.textThreshold;
const r2 = radius * radius;  // 避免重复计算

// 使用位运算
const idx = (y * width + x) << 2;  // 等价于 * 4，但更快
```

### 8.3 大图片处理

```typescript
// 分块处理，避免内存溢出
const CHUNK_SIZE = 1024;

for (let y = 0; y < height; y += CHUNK_SIZE) {
    for (let x = 0; x < width; x += CHUNK_SIZE) {
        processChunk(x, y, 
            Math.min(CHUNK_SIZE, width - x),
            Math.min(CHUNK_SIZE, height - y)
        );
    }
}
```

### 8.4 Web Worker 并行处理

```typescript
// 将耗时的像素处理移到 Worker
const worker = new Worker('imageProcessor.worker.js');
worker.postMessage({ imageData, options });
worker.onmessage = (e) => {
    const result = e.data.result;
    // 处理结果
};
```

---

## 9. 参数配置建议

### 9.1 默认配置

```typescript
const defaultOptions: ProcessingOptions = {
    textThreshold: 200,        // 文字检测阈值
    maskExpand: 2,             // 遮罩膨胀半径
    useEdgeGuidedExpand: true, // 启用边缘引导膨胀
    edgeThreshold: 50,         // 边缘强度阈值
    annotationOpacity: 1,      // 标注层透明度
    blockColor: '#FFFFFF'      // 色块颜色 (新增)
};
```

### 9.2 预设方案

| 预设 | textThreshold | maskExpand | annotationOpacity | 适用场景 |
|-----|--------------|------------|-------------------|---------|
| 标准 | 200 | 3 | 0.7 | 大多数场景 |
| 轻量 | 200 | 2 | 0.4 | 阅读为主 |
| 强调 | 180 | 4 | 0.9 | 突出标注 |

---

## 10. 总结

### 10.1 算法优势

1. **亮度阈值检测**: 简单高效，适合黑白文字
2. **边缘引导膨胀**: 精确覆盖抗锯齿区域
3. **行程编码优化**: 减少 Canvas API 调用
4. **像素级合成**: 精确控制混合效果

### 10.2 潜在改进方向

1. **自适应阈值**: 根据图像直方图自动调整
2. **多尺度检测**: 处理不同大小的文字
3. **GPU 加速**: 使用 WebGL 进行并行计算
4. **智能色块**: 自动检测背景色

### 10.3 实现优先级

| 优先级 | 功能 | 复杂度 |
|-------|------|-------|
| P0 | 基础亮度检测 + 圆形膨胀 | 低 |
| P1 | 边缘引导膨胀 | 中 |
| P2 | 自动背景色检测 | 中 |
| P3 | Web Worker 并行 | 高 |

---

**文档版本**: 1.0  
**分析日期**: 2026-01-31  
**分析角色**: 算法专家
