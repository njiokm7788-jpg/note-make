# Implementation Plan: 反向遮罩叠加模式重构

**Session ID**: WFS-image-mask-refactor
**Created**: 2026-01-31
**Status**: Ready for Implementation

---

## Overview

重构图片处理逻辑，实现反向遮罩叠加模式：
- 使用清晰原图检测文字区域
- 在带笔记的模糊图片对应位置添加色块
- 合成"清晰字体+笔记"的结果图片

## Architecture Changes

### Before (Current)
```
原图 + 标注图 → 文字检测 → 遮罩膨胀(边缘引导) → 混合叠加 → 结果
                                    ↓
                              Sobel边缘检测
```

### After (Target)
```
原图 + 标注图 → 文字检测 → 圆形膨胀 → 色块叠加 → 图像合成 → 结果
                                         ↓
                                   用户选择颜色
```

## Interface Changes

### ProcessingOptions (Before)
```typescript
interface ProcessingOptions {
  annotationOpacity: number;      // 移除
  textThreshold: number;          // 保留
  maskExpand: number;             // 保留
  useEdgeGuidedExpand: boolean;   // 移除
  edgeThreshold: number;          // 移除
}
```

### ProcessingOptions (After)
```typescript
interface ProcessingOptions {
  textThreshold: number;    // 文字检测亮度阈值 (0-255), 默认: 200
  maskExpand: number;       // 遮罩膨胀半径 (像素), 默认: 2
  blockColor: string;       // 色块颜色 (CSS颜色值), 默认: '#FFFF00'
  blockOpacity: number;     // 色块透明度 (0-1), 默认: 0.3
}
```

## Implementation Phases

### Phase 1: 核心算法重写 (Priority: Critical)

| Task ID | Task | File | Effort |
|---------|------|------|--------|
| IMPL-001 | 重写 ProcessingOptions 接口 | imageProcessor.ts | S |
| IMPL-002 | 实现 parseColor() 颜色解析函数 | imageProcessor.ts | S |
| IMPL-003 | 实现 applyColorBlock() 色块叠加函数 | imageProcessor.ts | M |
| IMPL-004 | 重写 compositeImages() 合成逻辑 | imageProcessor.ts | M |
| IMPL-005 | 更新 processImagePair() 主流程 | imageProcessor.ts | M |
| IMPL-006 | 移除 Sobel 边缘检测代码 | imageProcessor.ts | S |
| IMPL-007 | 更新预设方案 | imageProcessor.ts | S |

### Phase 2: UI 适配 (Priority: High)

| Task ID | Task | File | Effort |
|---------|------|------|--------|
| IMPL-008 | 移除边缘引导控件 | Sidebar.tsx | S |
| IMPL-009 | 添加色块颜色选择器 | Sidebar.tsx | M |
| IMPL-010 | 添加色块透明度滑块 | Sidebar.tsx | S |
| IMPL-011 | 更新 App.tsx 类型引用 | App.tsx | S |

### Phase 3: 优化与测试 (Priority: Medium)

| Task ID | Task | File | Effort |
|---------|------|------|--------|
| IMPL-012 | 性能优化 - 预览缩放 | imageProcessor.ts | M |
| IMPL-013 | 错误处理增强 | imageProcessor.ts | S |
| IMPL-014 | 手动功能测试 | - | M |

## File Change Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `src/utils/imageProcessor.ts` | **Rewrite** | 核心算法完全重写 |
| `src/components/Sidebar.tsx` | Modify | 添加色块控件，移除边缘引导 |
| `src/App.tsx` | Modify | 更新 options 类型引用 |

## Dependencies

```
IMPL-001 (接口) ──┬──> IMPL-002 (颜色解析)
                 ├──> IMPL-003 (色块叠加)
                 ├──> IMPL-004 (图像合成)
                 └──> IMPL-007 (预设方案)

IMPL-002 ──> IMPL-003 ──> IMPL-004 ──> IMPL-005 (主流程)

IMPL-006 (移除代码) 可并行

IMPL-001 ──> IMPL-008, IMPL-009, IMPL-010, IMPL-011 (UI 适配)

Phase 1 完成 ──> Phase 2 ──> Phase 3
```

## Presets (New)

| ID | Name | Threshold | Expand | Color | Opacity |
|----|------|-----------|--------|-------|---------|
| `highlight-yellow` | 黄色高亮 | 200 | 2 | `#FFFF00` | 0.3 |
| `highlight-green` | 绿色高亮 | 200 | 2 | `#90EE90` | 0.35 |
| `highlight-pink` | 粉色高亮 | 200 | 2 | `#FFB6C1` | 0.35 |
| `highlight-blue` | 蓝色高亮 | 200 | 2 | `#87CEEB` | 0.3 |

## Preset Colors (UI)

| Color | HEX | Usage |
|-------|-----|-------|
| 黄色 | `#FFFF00` | 经典荧光笔 |
| 绿色 | `#90EE90` | 清新标记 |
| 粉色 | `#FFB6C1` | 柔和标记 |
| 蓝色 | `#87CEEB` | 冷静专业 |
| 橙色 | `#FFA94D` | 温暖标记 |
| 紫色 | `#B197FC` | 优雅文艺 |

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| 色块颜色解析失败 | Medium | 使用 Canvas 2D API 解析，提供默认值 |
| 大图片性能问题 | High | 预览缩放 + 分块处理 |
| 遮罩边缘锯齿 | Low | 适当膨胀半径 |

## Test Cases (P0)

| Test | Description | Validation |
|------|-------------|------------|
| 基础处理 | 清晰图 + 模糊图 → 合成结果 | 视觉验证 |
| 预览生成 | 实时预览正常工作 | 功能验证 |
| 尺寸适配 | 不同尺寸图片自动对齐 | 功能验证 |
| 色块显示 | 文字区域显示用户选择的色块 | 视觉验证 |

## Execution Order

1. **IMPL-001**: 重写接口定义 (基础)
2. **IMPL-002**: 实现颜色解析 (依赖 001)
3. **IMPL-003**: 实现色块叠加 (依赖 002)
4. **IMPL-004**: 重写合成逻辑 (依赖 003)
5. **IMPL-005**: 更新主流程 (依赖 004)
6. **IMPL-006**: 移除旧代码 (可并行)
7. **IMPL-007**: 更新预设 (依赖 001)
8. **IMPL-008 ~ IMPL-011**: UI 适配 (依赖 Phase 1)
9. **IMPL-012 ~ IMPL-014**: 优化测试 (依赖 Phase 2)

---

## Next Steps

1. 执行 `IMPL-001`: 重写 ProcessingOptions 接口
2. 按依赖顺序完成 Phase 1 任务
3. Phase 1 完成后进入 Phase 2 UI 适配
4. 最后进行 Phase 3 优化测试
