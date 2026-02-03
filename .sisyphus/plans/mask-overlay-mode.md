# 反向遮罩叠加模式实现计划

## TL;DR

> **快速摘要**: 在现有图片处理应用中新增"反向遮罩叠加模式"，允许用户使用清晰原图检测文字区域，在带笔记的模糊图片对应位置添加色块，最终合成"清晰字体+笔记"的结果图片。
> 
> **核心交付物**:
> - 扩展的 `ProcessingOptions` 类型定义（新增 mode 和 maskBlockColor 字段）
> - 新增 `applyMaskBlockOverlay()` 图像处理函数
> - 修改后的 `processImagePair()` 支持新模式
> - 增强的 `ProcessingPanel` UI（模式切换+颜色选择器）
> - 更新后的 `App.tsx` 支持双图输入（清晰原图+模糊图）
> 
> **预估工作量**: 中等（约 2-3 小时）
> **可并行执行**: 是 - 可分为 3 个并行波次
> **关键路径**: 核心算法实现 → UI 集成 → 端到端测试

---

## Context

### 原始需求
用户需要在现有的 React 图片处理应用中新增一个功能：
1. 输入两张图片：
   - 清晰原图（用于检测文字区域位置）
   - 带笔记的模糊图片（笔记写在空白处，但原有文字已经模糊）
2. 处理逻辑：
   - 根据清晰原图检测文字区域（生成遮罩）
   - 在模糊图片的文字区域位置添加用户可自定义颜色的色块（遮挡模糊字体）
   - 将处理后的模糊图片叠加到清晰原图上
3. 输出结果：清晰字体 + 笔记的合成图片

### 现有功能基础
- ✅ 基于阈值和边缘检测的文字区域识别 (`extractTextMask`)
- ✅ Canvas 基础的图像处理能力
- ✅ 现有的"非文字区域叠加标注图"模式
- ✅ 单张处理和批量处理工作流
- ✅ ProcessingPanel 参数控制面板

### Metis 审查结果
- **无重大遗漏**：当前方案覆盖核心需求
- **建议关注**：
  - 两张图片的尺寸对齐问题（可能尺寸不同）
  - 色块颜色的透明度/混合模式选项
  - 批量处理时如何配对"清晰原图+模糊图"

---

## Work Objectives

### Core Objective
实现一个"反向遮罩叠加模式"，让用户能够使用清晰原图检测文字区域，在带笔记的模糊图片的对应位置添加色块遮挡模糊字体，最终合成清晰的带笔记图片。

### Concrete Deliverables
- 扩展的 `ProcessingOptions` 接口：`src/utils/imageProcessor.ts`
- 新增的遮罩色块叠加算法：`src/utils/imageProcessor.ts`
- 增强的图片处理流程：`src/utils/imageProcessor.ts`
- 模式切换和颜色选择 UI：`src/components/ProcessingPanel.tsx`
- 双图输入支持：`src/App.tsx`
- 批量处理支持（可选）：`src/components/BatchProcessor.tsx`

### Definition of Done
- [ ] 用户可以在 ProcessingPanel 切换"标准模式"和"反向遮罩模式"
- [ ] 用户可以选择色块颜色（默认白色，支持颜色选择器）
- [ ] 上传清晰原图+模糊图后，点击"处理"能得到正确的合成结果
- [ ] 四格对比视图能显示：清晰原图、模糊图+色块、遮罩层、最终结果
- [ ] 所有现有功能不受影响（向后兼容）

### Must Have
- 清晰原图的文字区域检测功能（复用现有 `extractTextMask`）
- 在模糊图片文字区域绘制色块的功能
- 将处理后的模糊图叠加到清晰原图的功能
- 用户可自定义色块颜色
- UI 模式切换控件

### Must NOT Have (Guardrails)
- 不修改现有"标准模式"的行为（向后兼容）
- 不改变现有批量处理的文件配对逻辑（仅扩展）
- 不引入重量级图像处理库（保持 Canvas 原生方案）
- 不要求用户上传第三张图片（保持双图输入）

---

## Verification Strategy

### Test Infrastructure Assessment
**现有测试情况**：未发现项目有自动化测试基础设施（无 jest.config, vitest.config 或测试文件）

**测试策略决策**：
- **基础设施**: 不存在
- **用户选择**: 手动验证（基于这是前端图像处理功能，涉及视觉结果）

### Manual Verification Approach
由于这是视觉图像处理功能，采用手动验证策略：
- 提供示例图片进行端到端测试
- 使用 Playwright 截图对比验证 UI 状态
- 验证处理结果的视觉效果

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (核心算法 - 可立即开始):
├── Task 1: 扩展 ProcessingOptions 类型定义
└── Task 2: 实现 applyMaskBlockOverlay 核心算法

Wave 2 (UI 增强 - 依赖 Wave 1 类型定义):
├── Task 3: 增强 ProcessingPanel（模式切换+颜色选择器）
└── Task 4: 更新 App.tsx 支持双图输入

Wave 3 (集成与测试 - 依赖 Wave 1 和 Wave 2):
├── Task 5: 集成测试与示例验证
└── Task 6: 批量处理支持（可选增强）

Critical Path: Task 2 → Task 4 → Task 5
Parallel Speedup: 约 30% 快于纯串行
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2, 3 | None |
| 2 | None | 4, 5 | 1 |
| 3 | 1 | 5 | 4 |
| 4 | 1, 2 | 5 | 3 |
| 5 | 2, 3, 4 | 6 | None |
| 6 | 5 | None | None |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1, 2 | delegate_task(category="quick", load_skills=["frontend-ui-ux"]) |
| 2 | 3, 4 | delegate_task(category="visual-engineering", load_skills=["frontend-ui-ux"]) |
| 3 | 5, 6 | delegate_task(category="quick", load_skills=["playwright"]) |

---

## TODOs

### Task 1: 扩展 ProcessingOptions 类型定义

**What to do**:
- 在 `src/utils/imageProcessor.ts` 中扩展 `ProcessingOptions` 接口
- 新增 `mode: 'overlay' | 'maskBlockOverlay'` 字段
- 新增 `maskBlockColor: string` 字段（CSS 颜色字符串，默认 '#FFFFFF'）
- 更新 `defaultPresets` 以包含新模式的默认值

**Must NOT do**:
- 不要修改现有字段的默认值（保持向后兼容）
- 不要删除或重命名任何现有字段

**Recommended Agent Profile**:
- **Category**: `quick`
- **Skills**: [`frontend-ui-ux`]
  - `frontend-ui-ux`: 需要理解现有类型定义模式并保持一致性

**Parallelization**:
- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 1
- **Blocks**: Task 2, Task 3
- **Blocked By**: None

**References**:
- `src/utils/imageProcessor.ts:ProcessingOptions` - 现有类型定义位置
- `src/utils/imageProcessor.ts:defaultPresets` - 默认预设配置

**Acceptance Criteria**:
- [ ] TypeScript 编译无错误
- [ ] `ProcessingOptions` 包含新字段且类型正确
- [ ] 现有代码使用 `defaultPresets` 仍能正常工作

**Commit**: YES
- Message: `feat(types): extend ProcessingOptions with maskBlockOverlay mode`
- Files: `src/utils/imageProcessor.ts`
- Pre-commit: `npm run build` 成功

---

### Task 2: 实现 applyMaskBlockOverlay 核心算法

**What to do**:
- 在 `src/utils/imageProcessor.ts` 中新增 `applyMaskBlockOverlay()` 函数
- 函数签名：`(clearData: ImageData, blurredData: ImageData, textMask: boolean[][], options: ProcessingOptions) => ImageData`
- 实现逻辑：
  1. 创建结果 canvas，尺寸与 clearData 相同
  2. 在 blurredData 上遍历 textMask
  3. 如果 textMask[y][x] 为 true（文字区域），在 blurredData 对应像素绘制 maskBlockColor 色块
  4. 将处理后的 blurredData 叠加到 clearData 上
  5. 返回最终合成结果

**Must NOT do**:
- 不要修改现有的 `applyMaskOverlay` 函数
- 不要引入外部图像处理库
- 不要改变 Canvas 绘制上下文的状态（恢复之前保存）

**Recommended Agent Profile**:
- **Category**: `quick`
- **Skills**: [`frontend-ui-ux`]
  - `frontend-ui-ux`: 需要理解 Canvas API 和现有图像处理模式

**Parallelization**:
- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 1
- **Blocks**: Task 4, Task 5
- **Blocked By**: None（但需要 Task 1 完成后的类型定义）

**References**:
- `src/utils/imageProcessor.ts:applyMaskOverlay` - 参考现有的遮罩叠加实现
- `src/utils/imageProcessor.ts:extractTextMask` - 文字遮罩生成逻辑
- MDN: CanvasRenderingContext2D.putImageData - Canvas API 文档

**Acceptance Criteria**:
- [ ] 函数能正确处理两张不同尺寸的图片（自动裁剪/缩放对齐）
- [ ] 色块颜色正确应用到文字区域
- [ ] 非文字区域正确保留清晰原图内容
- [ ] TypeScript 类型检查通过

**Commit**: YES
- Message: `feat(processor): implement maskBlockOverlay algorithm`
- Files: `src/utils/imageProcessor.ts`
- Pre-commit: `npm run build` 成功

---

### Task 3: 增强 ProcessingPanel UI

**What to do**:
- 在 `src/components/ProcessingPanel.tsx` 中新增：
  1. **模式切换**：添加 radio button 或 select 控件，选项：
     - "标准模式"（现有 overlay 模式）
     - "遮罩色块模式"（新 maskBlockOverlay 模式）
  2. **颜色选择器**：当选择新模式时显示，使用 `<input type="color">`
  3. **更新 onChange 处理**：确保新的 mode 和 maskBlockColor 值能正确传递

**UI 布局建议**:
```
处理模式
○ 标准模式（在空白处叠加标注）
● 遮罩色块模式（用色块遮挡模糊文字）

色块颜色（仅在遮罩色块模式下显示）
[颜色选择器] #FFFFFF
```

**Must NOT do**:
- 不要移除任何现有控件
- 不要改变现有控件的默认值
- 不要破坏现有的响应式布局

**Recommended Agent Profile**:
- **Category**: `visual-engineering`
- **Skills**: [`frontend-ui-ux`]
  - `frontend-ui-ux`: 需要遵循现有的 Tailwind CSS 样式模式和组件结构

**Parallelization**:
- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 2
- **Blocks**: Task 5
- **Blocked By**: Task 1（需要新的类型定义）

**References**:
- `src/components/ProcessingPanel.tsx` - 现有面板实现
- `src/components/ProcessingPanel.tsx:ProcessingOptions` 的使用方式
- Tailwind CSS 颜色类和表单控件样式

**Acceptance Criteria**:
- [ ] UI 上可以看到模式切换控件
- [ ] 切换到新模式时显示颜色选择器
- [ ] 切换回标准模式时颜色选择器隐藏
- [ ] 选择的颜色值能正确传递到 onChange 回调
- [ ] 响应式布局正常（移动端/桌面端）

**Commit**: YES
- Message: `feat(ui): add mode switch and color picker to ProcessingPanel`
- Files: `src/components/ProcessingPanel.tsx`
- Pre-commit: `npm run build` 成功

---

### Task 4: 更新 App.tsx 支持双图输入

**What to do**:
- 修改 `src/App.tsx` 以支持上传两张图片：
  1. 在 state 中新增 `blurredFile` 字段存储带笔记的模糊图片
  2. 新增第二个 ImageUploader 用于上传模糊图片
  3. 修改 `handleProcess` 函数：
     - 当 mode 为 'maskBlockOverlay' 时，调用新的处理流程
     - 传入 clearFile（清晰原图）和 blurredFile（模糊图）
  4. 更新预览逻辑：四格视图显示清晰原图、模糊图+色块、遮罩层、最终结果

**Must NOT do**:
- 不要移除现有的单图上传功能
- 不要改变现有的文件配对逻辑（批量处理部分）
- 不要在新模式未选择时要求上传第二张图

**Recommended Agent Profile**:
- **Category**: `visual-engineering`
- **Skills**: [`frontend-ui-ux`]
  - `frontend-ui-ux`: 需要理解 React state 管理和组件组合模式

**Parallelization**:
- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 2
- **Blocks**: Task 5
- **Blocked By**: Task 1（类型定义）, Task 2（核心算法）

**References**:
- `src/App.tsx` - 主应用组件
- `src/App.tsx:handleProcess` - 处理函数
- `src/components/ImageUploader.tsx` - 上传组件

**Acceptance Criteria**:
- [ ] 可以选择上传两张图片（清晰原图 + 模糊图）
- [ ] 点击"处理"按钮后，新模式能正确调用处理函数
- [ ] 四格预览能正确显示四种视图
- [ ] 处理结果显示在预览区域
- [ ] 下载按钮能下载合成结果

**Commit**: YES
- Message: `feat(app): support dual image input for maskBlockOverlay mode`
- Files: `src/App.tsx`
- Pre-commit: `npm run build` 成功

---

### Task 5: 集成测试与示例验证

**What to do**:
- 准备测试图片进行端到端验证：
  1. 创建或准备一张带有清晰文字的示例图片（清晰原图）
  2. 创建同一图片的"带笔记模糊版本"（模拟笔记场景）
- 使用 Playwright 进行自动化验证：
  1. 启动开发服务器
  2. 导航到应用页面
  3. 上传测试图片
  4. 选择遮罩色块模式
  5. 选择颜色（如红色以便观察）
  6. 点击处理按钮
  7. 截取结果预览图
  8. 验证结果图片包含预期效果

**Must NOT do**:
- 不要修改生产代码（仅用于测试验证）
- 不要在测试中依赖外部网络资源

**Recommended Agent Profile**:
- **Category**: `quick`
- **Skills**: [`playwright`]
  - `playwright`: 用于自动化浏览器测试和截图验证

**Parallelization**:
- **Can Run In Parallel**: NO
- **Parallel Group**: Wave 3（最终验证）
- **Blocks**: None
- **Blocked By**: Task 2（核心算法）, Task 3（UI）, Task 4（集成）

**References**:
- `playwright` skill - 浏览器自动化测试
- 测试图片路径：`F:/python/py/picture/笔记图片处理/test-images/`

**Acceptance Criteria**:
- [ ] 开发服务器启动成功
- [ ] 能成功上传两张测试图片
- [ ] 模式切换正常工作
- [ ] 处理按钮能生成结果
- [ ] 结果预览图显示正确（文字区域有色块，笔记内容可见）
- [ ] 下载功能正常工作

**Verification Commands**:
```bash
# 1. 启动开发服务器
npm run dev

# 2. Playwright 验证（由 agent 执行）
# - 导航到 http://localhost:5173
# - 上传清晰原图
# - 上传模糊图
# - 选择"遮罩色块模式"
# - 选择红色色块
# - 点击"处理"
# - 截图验证结果
```

**Commit**: NO（测试代码不提交到主分支）

---

### Task 6: 批量处理支持（可选增强）

**What to do**:
- 如果需要支持批量处理新模式：
  1. 修改 `src/components/BatchProcessor.tsx`
  2. 扩展文件配对逻辑：将"清晰原图+模糊图"配对
  3. 支持命名规则：如 `page1.jpg` + `page1_notes.jpg`
  4. 批量应用遮罩色块处理
  5. 批量下载结果

**Must NOT do**:
- 不要改变现有的批量处理默认行为
- 不要强制要求新模式使用不同的配对规则

**Recommended Agent Profile**:
- **Category**: `quick`
- **Skills**: [`frontend-ui-ux`]
  - `frontend-ui-ux`: 需要理解现有批量处理逻辑

**Parallelization**:
- **Can Run In Parallel**: NO
- **Parallel Group**: Wave 3（可选）
- **Blocks**: None
- **Blocked By**: Task 5（集成测试通过）

**References**:
- `src/components/BatchProcessor.tsx` - 批量处理组件
- `src/utils/fileUtils.ts` - 文件配对工具

**Acceptance Criteria**:
- [ ] 能自动配对"清晰原图+模糊图"
- [ ] 批量处理能正确应用新模式
- [ ] 下载结果包含所有处理后的图片

**Commit**: YES
- Message: `feat(batch): support maskBlockOverlay mode in batch processing`
- Files: `src/components/BatchProcessor.tsx`, `src/utils/fileUtils.ts`
- Pre-commit: `npm run build` 成功

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `feat(types): extend ProcessingOptions with maskBlockOverlay mode` | `src/utils/imageProcessor.ts` | `npm run build` |
| 2 | `feat(processor): implement maskBlockOverlay algorithm` | `src/utils/imageProcessor.ts` | `npm run build` |
| 3 | `feat(ui): add mode switch and color picker to ProcessingPanel` | `src/components/ProcessingPanel.tsx` | `npm run build` |
| 4 | `feat(app): support dual image input for maskBlockOverlay mode` | `src/App.tsx` | `npm run build` |
| 5 | - | - | 手动测试 |
| 6 | `feat(batch): support maskBlockOverlay mode in batch processing` | `src/components/BatchProcessor.tsx`, `src/utils/fileUtils.ts` | `npm run build` |

---

## Success Criteria

### Verification Commands
```bash
# 构建验证
npm run build
# Expected: 无错误，生成 dist/ 目录

# 开发服务器验证
npm run dev
# Expected: 服务器启动，监听端口（通常是 5173）
```

### Final Checklist
- [ ] 所有 "Must Have" 功能已实现
- [ ] 所有 "Must NOT Have" 约束已遵守
- [ ] 现有功能不受影响（向后兼容测试通过）
- [ ] TypeScript 编译无错误
- [ ] 手动测试验证通过（视觉效果正确）
- [ ] 代码遵循现有项目风格和模式
- [ ] 提交历史清晰（每个任务独立提交）

---

## Notes for Implementer

### 关键实现细节

1. **图片尺寸对齐**：
   - 如果清晰原图和模糊图尺寸不同，需要在处理前对齐
   - 建议方案：以清晰原图为基准，将模糊图缩放到相同尺寸
   - 参考：`src/utils/imageProcessor.ts` 中现有的缩放逻辑

2. **色块绘制性能**：
   - 对于大图片，逐像素处理可能较慢
   - 优化建议：使用 `ctx.fillRect` 批量绘制色块区域
   - 或者使用 `ctx.putImageData` 直接操作像素数据

3. **Canvas 状态管理**：
   - 在处理函数开始时保存 canvas 状态：`ctx.save()`
   - 处理完成后恢复状态：`ctx.restore()`
   - 避免污染全局绘制上下文

4. **颜色格式**：
   - 使用 CSS 颜色字符串（如 '#FF0000', 'rgb(255,0,0)'）
   - 在 Canvas 绘制时需要转换为可用格式（可直接使用 CSS 颜色字符串）

### 常见问题排查

- **遮罩检测不准确**：
  - 检查 textThreshold 参数（默认 200，可能需要调整）
  - 尝试调整 maskExpand 参数扩大遮罩范围

- **色块位置偏移**：
  - 确认两张图片对齐正确
  - 检查是否有缩放比例问题

- **性能问题**：
  - 对于大图片，考虑分块处理
  - 使用 `requestAnimationFrame` 避免阻塞主线程
