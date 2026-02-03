# UI Designer Analysis: Layout Optimization

**Role**: UI Designer
**Topic**: 优化前端布局，需要合理
**Date**: 2026-01-31
**Status**: Clarification Completed

## Clarifications
### Session 2026-01-31

**Enhancement Selection**:
- **Q**: 请选择要应用的布局优化建议
  **A**: EP-001 (上传区水平布局), EP-002 (压缩组件间距), EP-003 (预设按钮单行化), EP-004 (Header 高度压缩) - 全部选中

**Design Decisions**:
- **Q**: 预览区域的空状态如何处理？ (Category: UX)
  **A**: 保持现状 - 保留当前的图标+文字提示设计

- **Q**: ProcessingPanel 的高级设置默认状态？ (Category: UX)
  **A**: 默认折叠 - 用户点击展开，节省垂直空间

- **Q**: 实时预览开关的位置？ (Category: UX)
  **A**: 合并到标题 - 与"处理设置"标题合并到同一行，节省空间

## Executive Summary

当前布局存在明显的垂直空间浪费问题，导致用户需要频繁滚动才能完成操作。本分析针对用户核心诉求"操作时尽量不要上下滑动"，提出紧凑高效的布局重构方案。

**用户已确认的优化方案**:
1. ✅ 上传区水平布局 (EP-001)
2. ✅ 压缩组件间距 (EP-002)
3. ✅ 预设按钮单行化 (EP-003)
4. ✅ Header 高度压缩 (EP-004)
5. ✅ 高级设置默认折叠
6. ✅ 实时预览开关合并到标题行

## Analysis Sections

- @analysis-current-assessment.md - 当前布局评估与问题诊断
- @analysis-layout-strategy.md - 布局重构策略与方案
- @analysis-component-optimization.md - 组件级优化建议
- @analysis-recommendations.md - 实施建议与优先级

## Key Findings

### Critical Issues
1. **垂直空间过度消耗**: 单张模式下，上传区 + 设置面板高度超过视口，强制滚动
2. **预览区域利用不足**: 右侧 2/3 空间在无预览时完全空置
3. **组件内部 padding 过大**: 各卡片 p-6 (24px) 在紧凑场景下过于宽松

### User Requirements Alignment
| 用户需求 | 当前状态 | 优化方向 |
|---------|---------|---------|
| 不要上下滑动 | 需要滚动 | 单屏完成核心操作 |
| 紧凑高效 | 宽松布局 | 压缩间距，合并区域 |
| 保持 Tab 切换 | 已实现 | 保留，优化位置 |

## Recommended Approach

采用 **"水平扩展 + 垂直压缩"** 策略：
1. 将上传区从垂直堆叠改为水平并排
2. 压缩 ProcessingPanel 高级设置的默认展开状态
3. 优化预览区域的空状态高度
4. 统一使用更紧凑的间距系统 (p-4 替代 p-6)
