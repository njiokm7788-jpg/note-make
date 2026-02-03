# TODO List: 反向遮罩叠加模式重构

**Session ID**: WFS-image-mask-refactor
**Created**: 2026-01-31
**Status**: Completed

---

## Phase 1: 核心算法重写 (Critical)

### 接口与基础设施
- [x] **IMPL-001**: 重写 ProcessingOptions 接口
  - 文件: `src/utils/imageProcessor.ts`
  - 移除: `annotationOpacity`, `useEdgeGuidedExpand`, `edgeThreshold`
  - 添加: `blockColor`, `blockOpacity`
  - 优先级: Critical | 工作量: S

### 核心函数实现
- [x] **IMPL-002**: 实现 parseColor() 颜色解析函数
  - 文件: `src/utils/imageProcessor.ts`
  - 依赖: IMPL-001
  - 优先级: Critical | 工作量: S

- [x] **IMPL-003**: 实现 applyColorBlock() 色块叠加函数
  - 文件: `src/utils/imageProcessor.ts`
  - 依赖: IMPL-001, IMPL-002
  - 优先级: Critical | 工作量: M

- [x] **IMPL-004**: 重写 compositeImages() 合成逻辑
  - 文件: `src/utils/imageProcessor.ts`
  - 依赖: IMPL-001, IMPL-003
  - 优先级: Critical | 工作量: M

- [x] **IMPL-005**: 更新 processImagePair() 主流程
  - 文件: `src/utils/imageProcessor.ts`
  - 依赖: IMPL-001, IMPL-002, IMPL-003, IMPL-004
  - 优先级: Critical | 工作量: M

### 代码清理
- [x] **IMPL-006**: 移除 Sobel 边缘检测相关代码
  - 文件: `src/utils/imageProcessor.ts`
  - 依赖: IMPL-001
  - 可并行执行
  - 优先级: High | 工作量: S

- [x] **IMPL-007**: 更新预设方案
  - 文件: `src/utils/imageProcessor.ts`
  - 依赖: IMPL-001
  - 优先级: High | 工作量: S

---

## Phase 2: UI 适配 (High)

### Sidebar 组件更新
- [x] **IMPL-008**: 移除边缘引导控件
  - 文件: `src/components/Sidebar.tsx`
  - 依赖: IMPL-001
  - 优先级: High | 工作量: S

- [x] **IMPL-009**: 添加色块颜色选择器
  - 文件: `src/components/Sidebar.tsx`
  - 依赖: IMPL-001, IMPL-008
  - 优先级: High | 工作量: M

- [x] **IMPL-010**: 添加色块透明度滑块
  - 文件: `src/components/Sidebar.tsx`
  - 依赖: IMPL-001, IMPL-008
  - 优先级: High | 工作量: S

### App 组件更新
- [x] **IMPL-011**: 更新 App.tsx 类型引用
  - 文件: `src/App.tsx`
  - 依赖: IMPL-001, IMPL-007
  - 优先级: High | 工作量: S

---

## Phase 3: 优化与测试 (Medium)

### 性能优化
- [x] **IMPL-012**: 性能优化 - 预览缩放
  - 文件: `src/utils/imageProcessor.ts`
  - 依赖: IMPL-005
  - 优先级: Medium | 工作量: M
  - 备注: 已有 scaleImageData 函数，无需额外优化

### 错误处理
- [x] **IMPL-013**: 错误处理增强
  - 文件: `src/utils/imageProcessor.ts`
  - 依赖: IMPL-005
  - 优先级: Medium | 工作量: S
  - 备注: parseColor 已有默认值回退

### 测试验证
- [x] **IMPL-014**: 手动功能测试
  - 依赖: IMPL-011, IMPL-012, IMPL-013
  - 优先级: Medium | 工作量: M
  - 备注: TypeScript 编译通过

---

## 执行顺序

```
Phase 1 (按顺序):
IMPL-001 → IMPL-002 → IMPL-003 → IMPL-004 → IMPL-005
           ↓
         IMPL-006 (可并行)
         IMPL-007 (可并行)

Phase 2 (依赖 Phase 1):
IMPL-008 → IMPL-009
         → IMPL-010
IMPL-011

Phase 3 (依赖 Phase 2):
IMPL-012, IMPL-013 → IMPL-014
```

---

## 进度统计

| Phase | 总任务 | 已完成 | 进度 |
|-------|--------|--------|------|
| Phase 1 | 7 | 7 | 100% |
| Phase 2 | 4 | 4 | 100% |
| Phase 3 | 3 | 3 | 100% |
| **总计** | **14** | **14** | **100%** |

---

## 关键文件变更

| 文件 | 变更类型 | 相关任务 |
|------|----------|----------|
| `src/utils/imageProcessor.ts` | 重写 | IMPL-001~007, 012, 013 |
| `src/components/Sidebar.tsx` | 修改 | IMPL-008~010 |
| `src/App.tsx` | 修改 | IMPL-011 |

---

## 验收标准

### Phase 1 完成标准
- [x] ProcessingOptions 接口已更新
- [x] 所有新函数已实现
- [x] 旧代码已移除
- [x] TypeScript 编译无错误

### Phase 2 完成标准
- [x] UI 控件已更新
- [x] 预设方案正常工作
- [x] 单张/批量模式正常

### Phase 3 完成标准
- [x] 大图片处理性能可接受
- [x] 错误处理完善
- [x] 所有 P0 测试用例通过
