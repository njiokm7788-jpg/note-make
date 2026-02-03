# Planning Notes

**Session**: WFS-image-mask-refactor
**Created**: 2026-01-31T14:45:29.723Z

## User Intent (Phase 1)

- **GOAL**: 重构图片处理逻辑，实现反向遮罩叠加模式
- **SCOPE**: 使用清晰原图检测文字区域，在带笔记的模糊图片对应位置添加色块，最终合成"清晰字体+笔记"的结果图片
- **KEY_CONSTRAINTS**: 
  - 技术栈: React 19 + TypeScript + Canvas API
  - 移除现有功能，完全重写
  - 使用亮度阈值检测算法
  - 先实现后测试

---

## Context Findings (Phase 2)

- **CRITICAL_FILES**: src/utils/imageProcessor.ts, src/components/Sidebar.tsx, src/App.tsx
- **ARCHITECTURE**: React Functional Components, Hooks-based State Management, Canvas 2D API, Modular Utilities
- **CONFLICT_RISK**: medium
- **CONSTRAINTS**: 技术栈: React 19 + TypeScript + Canvas API; 保持现有的响应式设计; 支持大图片处理; 保持实时预览功能

## Conflict Decisions (Phase 3)

- **RESOLVED**:
  - interface_change → 完全重写 ProcessingOptions 接口 (用户已确认)
  - algorithm_replacement → 移除边缘引导膨胀，使用圆形膨胀 (用户已确认)
  - preset_replacement → 替换为新的高亮预设 (用户已确认)
- **MODIFIED_ARTIFACTS**: None (决策已在 brainstorm 阶段确认)
- **CONSTRAINTS**: 按 Phase 顺序实施，每阶段手动验证

## Consolidated Constraints (Phase 4 Input)
1. 技术栈: React 19 + TypeScript + Canvas API
2. 移除现有功能，完全重写
3. 使用亮度阈值检测算法
4. 先实现后测试
5. [Context] 保持现有的响应式设计
6. [Context] 支持大图片处理，考虑分块处理
7. [Context] 保持实时预览功能
8. [Conflict] 按 Phase 顺序实施：Phase 1 核心算法 → Phase 2 UI 适配 → Phase 3 优化测试

---

## Task Generation (Phase 4)
(To be filled by action-planning-agent)

## N+1 Context
### Decisions
| Decision | Rationale | Revisit? |
|----------|-----------|----------|
| 移除现有功能，完全重写 | 简化代码结构，专注于单一功能 | No |
| 亮度阈值检测 | 简单高效，适合黑白分明的文字 | No |
| 简单圆形膨胀 | 移除边缘引导，简化架构 | No |
| 用户可选色块颜色 | 提供预设 + 自定义 | No |

### Deferred
- [ ] 性能优化（大图片分块处理）
- [ ] 自动化测试
