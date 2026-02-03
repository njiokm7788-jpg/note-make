# 图片处理逻辑重构 - 指导规范

## 项目目标

**GOAL**: 重构图片处理逻辑，实现反向遮罩叠加模式

**SCOPE**: 使用清晰原图检测文字区域，在带笔记的模糊图片对应位置添加色块，最终合成"清晰字体+笔记"的结果图片

**CONTEXT**: 现有项目是 React+TypeScript+Canvas 的图片处理工具，参考文档提供了 Canvas globalCompositeOperation、文字区域检测算法、色块遮罩叠加算法等技术方案

---

## 确认的决策

### 1. 系统架构决策

**决策**: 移除现有功能，完全重写

**说明**: 
- 移除现有的标注叠加模式
- 重新实现为遮罩色块模式
- 简化代码结构，专注于单一功能

### 2. 算法选择决策

**决策**: 亮度阈值检测

**说明**:
- 使用亮度阈值检测文字区域
- 简单高效，适合黑白分明的文字
- 公式: `luminance = 0.299 * R + 0.587 * G + 0.114 * B`
- 深色区域 (luminance < threshold) 判定为文字

### 3. 处理流程决策

**决策**: 清晰图检测 + 模糊图加色块

**处理流程**:
```
1. 加载清晰原图和模糊标注图
2. 在清晰原图上检测文字区域（生成遮罩）
3. 在模糊图的文字区域位置添加色块（遮盖模糊文字）
4. 将清晰原图的文字区域叠加到处理后的模糊图上
5. 输出最终结果：清晰字体 + 笔记标注
```

### 4. UI 交互决策

**色块颜色**: 用户可选颜色
- 提供颜色选择器
- 默认白色
- 支持自定义颜色

**上传交互**: 复用现有上传逻辑
- 原图 = 清晰图
- 标注图 = 模糊图（带笔记）
- 保持现有的拖拽、粘贴上传方式

### 5. 测试策略决策

**决策**: 先实现后测试

**说明**:
- 优先完成核心功能实现
- 通过手动视觉验证确认效果
- 后续补充自动化测试

---

## 技术参考

### Canvas globalCompositeOperation

| 模式 | 效果 | 用途 |
|------|------|------|
| `source-over` | 正常叠加 | 标准图像叠加 |
| `source-in` | 仅在目标区域内显示 | 遮罩区域内显示内容 |
| `destination-in` | 保留重叠部分 | 反向遮罩 |
| `destination-out` | 从目标减去源 | 擦除效果 |

### 核心算法伪代码

```javascript
// 1. 文字区域检测
function extractTextMask(clearImageData, threshold) {
  for each pixel:
    luminance = 0.299 * R + 0.587 * G + 0.114 * B
    mask[pixel] = luminance < threshold
  return mask
}

// 2. 色块叠加
function applyColorBlock(blurredImage, textMask, color) {
  for each pixel:
    if (textMask[pixel]):
      blurredImage[pixel] = color
  return blurredImage
}

// 3. 文字叠加
function overlayText(processedBlurred, clearImage, textMask) {
  for each pixel:
    if (textMask[pixel]):
      result[pixel] = clearImage[pixel]
    else:
      result[pixel] = processedBlurred[pixel]
  return result
}
```

---

## 参与角色

1. **system-architect** - 系统架构分析
2. **algorithm-expert** - 算法实现分析
3. **ui-designer** - UI 交互设计
4. **test-strategist** - 测试策略规划

---

## 约束条件

1. **技术栈**: React 19 + TypeScript + Canvas API
2. **兼容性**: 保持现有的响应式设计
3. **性能**: 支持大图片处理，考虑分块处理
4. **用户体验**: 保持实时预览功能

---

## 预期产出

1. 重构后的 `imageProcessor.ts`
2. 更新的 `ProcessingOptions` 接口
3. 更新的 `Sidebar.tsx` 参数配置
4. 更新的预设方案
