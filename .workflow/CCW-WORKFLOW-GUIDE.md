# CCW 工作流完整指南

## 目录

1. [项目全生命周期命令](#项目全生命周期命令)
2. [典型工作流示例](#典型工作流示例)
3. [命令详解](#命令详解)
4. [相似命令对比](#相似命令对比)
5. [最佳实践](#最佳实践)
6. [上下文溢出处理](#上下文溢出处理)
7. [常见问题解答](#常见问题解答-faq)
8. [命令速查索引](#命令速查索引)

---

## 项目全生命周期命令

### 阶段 1: 项目初始化

| 命令 | 说明 |
|------|------|
| `/workflow:init` | 智能分析项目结构，初始化项目状态 |
| `/cli:cli-init` | 生成 CLI 配置目录 (.gemini/.qwen/) |

### 阶段 2: 需求分析与头脑风暴

| 命令 | 说明 |
|------|------|
| `/workflow:brainstorm-with-file` | 交互式头脑风暴，多 CLI 协作（推荐） |
| `/workflow:brainstorm:auto-parallel` | 并行多角色自动分析 |
| `/workflow:brainstorm:role-analysis` | 单角色深度分析 |
| `/workflow:brainstorm:synthesis` | 综合澄清与完善分析结果 |
| `/workflow:brainstorm:artifacts` | 输出确认的指导规范文档 |

### 阶段 3: 规划设计

| 命令 | 说明 | 适用场景 |
|------|------|----------|
| `/workflow:lite-plan` | 轻量级交互式规划 | 小型任务、快速迭代 |
| `/workflow:plan` | 5阶段完整规划工作流 | 中型项目 |
| `/workflow:collaborative-plan-with-file` | 协作规划，多代理并行 | 复杂项目 |
| `/workflow:multi-cli-plan` | 多 CLI 协作规划 | 需要多模型验证 |
| `/workflow:plan-verify` | 验证规划文档质量 | 规划完成后 |
| `/workflow:replan` | 交互式重新规划 | 需求变更时 |

### 阶段 4: 开发执行

**会话管理**:

| 命令 | 说明 |
|------|------|
| `/workflow:session:start` | 启动工作流会话 |
| `/workflow:session:list` | 查看所有会话状态 |
| `/workflow:session:resume` | 恢复暂停的会话 |

**执行方式**:

| 命令 | 说明 | 适用场景 |
|------|------|----------|
| `/workflow:lite-lite-lite` | 超轻量执行 | 简单任务，无需文档 |
| `/workflow:lite-execute` | 轻量执行 | 基于内存计划或文件 |
| `/workflow:execute` | 多代理协调执行 | 复杂任务并行处理 |
| `/workflow:unified-execute-with-file` | 通用执行引擎 | 消费任何规划输出 |

### 阶段 5: 测试驱动开发 (TDD)

| 命令 | 说明 |
|------|------|
| `/workflow:tdd-plan` | TDD 规划（Red-Green-Refactor 循环） |
| `/workflow:test-gen` | 从实现会话生成测试任务 |
| `/workflow:test-fix-gen` | 创建测试修复工作流会话 |
| `/workflow:test-cycle-execute` | 执行测试循环直到通过率 ≥95% |
| `/workflow:tdd-verify` | 验证 TDD 合规性 |

### 阶段 6: 代码审查

| 命令 | 说明 |
|------|------|
| `/review-code` | 多维度代码审查（7个维度） |
| `/workflow:review-module-cycle` | 模块级独立审查 |
| `/workflow:review-session-cycle` | 会话级综合审查 |
| `/workflow:review-cycle-fix` | 自动修复审查发现的问题 |
| `/workflow:review` | 实现后专项审查（安全/架构等） |

### 阶段 7: 调试与修复

| 命令 | 说明 |
|------|------|
| `/ccw-debug` | 聚合调试命令 |
| `/workflow:debug-with-file` | 假设驱动调试，文档化探索 |
| `/workflow:lite-fix` | 轻量级 bug 修复 |
| `/workflow:analyze-with-file` | 协作分析，CLI 辅助探索 |

### 阶段 8: Issue 管理

| 命令 | 说明 |
|------|------|
| `/issue:new` | 创建结构化 issue |
| `/issue:discover` | 多角度发现潜在问题 |
| `/issue:discover-by-prompt` | 基于提示发现问题 |
| `/issue:from-brainstorm` | 从头脑风暴转换为 issue |
| `/issue:plan` | 批量规划 issue 解决方案 |
| `/issue:queue` | 形成执行队列 |
| `/issue:execute` | DAG 并行执行 |
| `/issue:convert-to-plan` | 转换为规划文档 |
| `/issue-manage` | 交互式 issue 管理菜单 |

### 阶段 9: 文档与记忆

| 命令 | 说明 |
|------|------|
| `/memory:update-related` | 更新 git 变更相关模块文档 |
| `/memory:update-full` | 更新全部 CLAUDE.md 文档 |
| `/memory:docs-related-cli` | CLI 生成相关模块文档 |
| `/memory:docs-full-cli` | CLI 生成完整项目文档 |
| `/memory:compact` | 压缩会话记忆用于恢复 |
| `/memory:tips` | 快速笔记捕获 |
| `/memory:load` | 分析项目生成任务上下文（非恢复记忆） |

### 阶段 10: 代码清理与收尾

| 命令 | 说明 |
|------|------|
| `/clean` | 智能代码清理 |
| `/workflow:clean` | 工作流清理 |
| `/workflow:session:complete` | 完成会话并归档 |
| `/workflow:session:solidify` | 固化学习到项目指南 |

### 辅助工具

| 命令 | 说明 |
|------|------|
| `/ccw` | 主工作流编排器 |
| `/ccw-coordinator` | 命令编排工具 |
| `/ccw-help` | 帮助系统 |
| `/ccw-loop` | 迭代开发循环 |
| `/project-analyze` | 多阶段项目分析 |
| `/view` | 打开工作流仪表板 |

---

## 典型工作流示例

### 工作流 1: 快速功能开发（小型任务）

**适用场景**: 单一功能、bug 修复、小改动

**时间**: 30分钟 - 2小时

```
┌─────────────────────────────────────────────────────────────┐
│  /workflow:lite-plan                                        │
│  ↓ 轻量规划，交互式确认                                      │
├─────────────────────────────────────────────────────────────┤
│  /workflow:lite-execute                                     │
│  ↓ 基于计划执行                                              │
├─────────────────────────────────────────────────────────────┤
│  /review-code                                               │
│  ↓ 代码审查                                                  │
├─────────────────────────────────────────────────────────────┤
│  完成                                                        │
└─────────────────────────────────────────────────────────────┘
```

**命令序列**:
```bash
# 1. 轻量规划
/workflow:lite-plan
# 输入: 功能描述，交互式确认计划

# 2. 执行
/workflow:lite-execute
# 基于刚才的计划执行

# 3. 审查
/review-code
# 检查代码质量
```

---

### 工作流 2: 标准功能开发（中型项目）

**适用场景**: 新功能模块、多文件改动、需要设计

**时间**: 半天 - 2天

```
┌─────────────────────────────────────────────────────────────┐
│  /workflow:init                                             │
│  ↓ 初始化项目状态                                            │
├─────────────────────────────────────────────────────────────┤
│  /workflow:brainstorm-with-file                             │
│  ↓ 需求分析与头脑风暴                                        │
├─────────────────────────────────────────────────────────────┤
│  /workflow:plan                                             │
│  ↓ 5阶段完整规划                                             │
├─────────────────────────────────────────────────────────────┤
│  /workflow:session:start                                    │
│  ↓ 启动工作流会话                                            │
├─────────────────────────────────────────────────────────────┤
│  /workflow:execute                                          │
│  ↓ 多代理协调执行                                            │
├─────────────────────────────────────────────────────────────┤
│  /workflow:review-session-cycle                             │
│  ↓ 会话级综合审查                                            │
├─────────────────────────────────────────────────────────────┤
│  /memory:update-related                                     │
│  ↓ 更新相关文档                                              │
├─────────────────────────────────────────────────────────────┤
│  /workflow:session:complete                                 │
│  ↓ 完成会话并归档                                            │
└─────────────────────────────────────────────────────────────┘
```

**命令序列**:
```bash
# 1. 初始化
/workflow:init

# 2. 头脑风暴（可选，复杂需求时使用）
/workflow:brainstorm-with-file

# 3. 规划
/workflow:plan

# 4. 启动会话
/workflow:session:start

# 5. 执行
/workflow:execute

# 6. 审查
/workflow:review-session-cycle

# 7. 更新文档
/memory:update-related

# 8. 完成
/workflow:session:complete
```

---

### 工作流 3: TDD 开发流程

**适用场景**: 需要高测试覆盖率、关键业务逻辑

**时间**: 1-3天

```
┌─────────────────────────────────────────────────────────────┐
│  /workflow:tdd-plan                                         │
│  ↓ TDD 规划（Red-Green-Refactor）                           │
├─────────────────────────────────────────────────────────────┤
│  /workflow:test-gen                                         │
│  ↓ 生成测试任务                                              │
├─────────────────────────────────────────────────────────────┤
│  /workflow:test-cycle-execute                               │
│  ↓ 执行测试循环直到通过                                      │
├─────────────────────────────────────────────────────────────┤
│  /workflow:tdd-verify                                       │
│  ↓ 验证 TDD 合规性                                           │
├─────────────────────────────────────────────────────────────┤
│  /review-code                                               │
│  ↓ 代码审查                                                  │
└─────────────────────────────────────────────────────────────┘
```

**命令序列**:
```bash
# 1. TDD 规划
/workflow:tdd-plan
# 生成 Red-Green-Refactor 任务链

# 2. 生成测试
/workflow:test-gen

# 3. 执行测试循环
/workflow:test-cycle-execute
# 自动迭代直到通过率 ≥95%

# 4. 验证合规性
/workflow:tdd-verify

# 5. 代码审查
/review-code
```

---

### 工作流 4: 复杂项目协作开发

**适用场景**: 大型功能、架构变更、多模块协作

**时间**: 3天 - 2周

```
┌─────────────────────────────────────────────────────────────┐
│  /workflow:init                                             │
│  ↓ 初始化项目状态                                            │
├─────────────────────────────────────────────────────────────┤
│  /workflow:brainstorm:auto-parallel                         │
│  ↓ 并行多角色头脑风暴                                        │
├─────────────────────────────────────────────────────────────┤
│  /workflow:brainstorm:synthesis                             │
│  ↓ 综合分析结果                                              │
├─────────────────────────────────────────────────────────────┤
│  /workflow:collaborative-plan-with-file                     │
│  ↓ 协作规划（多代理并行）                                    │
├─────────────────────────────────────────────────────────────┤
│  /workflow:plan-verify                                      │
│  ↓ 验证规划质量                                              │
├─────────────────────────────────────────────────────────────┤
│  /workflow:session:start                                    │
│  ↓ 启动工作流会话                                            │
├─────────────────────────────────────────────────────────────┤
│  /workflow:unified-execute-with-file                        │
│  ↓ 通用执行引擎                                              │
├─────────────────────────────────────────────────────────────┤
│  /workflow:review-module-cycle                              │
│  ↓ 模块级审查                                                │
├─────────────────────────────────────────────────────────────┤
│  /workflow:review-cycle-fix                                 │
│  ↓ 自动修复审查问题                                          │
├─────────────────────────────────────────────────────────────┤
│  /memory:update-full                                        │
│  ↓ 更新全部文档                                              │
├─────────────────────────────────────────────────────────────┤
│  /workflow:session:solidify                                 │
│  ↓ 固化学习到项目指南                                        │
├─────────────────────────────────────────────────────────────┤
│  /workflow:session:complete                                 │
│  ↓ 完成会话并归档                                            │
└─────────────────────────────────────────────────────────────┘
```

---

### 工作流 5: Bug 修复流程

**适用场景**: 生产问题、紧急修复

**时间**: 1小时 - 半天

```
┌─────────────────────────────────────────────────────────────┐
│  /ccw-debug                                                 │
│  ↓ 聚合调试诊断                                              │
├─────────────────────────────────────────────────────────────┤
│  /workflow:debug-with-file                                  │
│  ↓ 假设驱动调试（可选，复杂问题）                            │
├─────────────────────────────────────────────────────────────┤
│  /workflow:lite-fix                                         │
│  ↓ 轻量级修复                                                │
├─────────────────────────────────────────────────────────────┤
│  /review-code                                               │
│  ↓ 代码审查                                                  │
└─────────────────────────────────────────────────────────────┘
```

**命令序列**:
```bash
# 1. 调试诊断
/ccw-debug

# 2. 深度调试（复杂问题）
/workflow:debug-with-file

# 3. 修复
/workflow:lite-fix

# 4. 审查
/review-code
```

---

### 工作流 6: Issue 驱动开发

**适用场景**: 基于 issue 的迭代开发、团队协作

**时间**: 根据 issue 复杂度

```
┌─────────────────────────────────────────────────────────────┐
│  /issue:new 或 /issue:discover                              │
│  ↓ 创建或发现 issue                                          │
├─────────────────────────────────────────────────────────────┤
│  /issue:plan                                                │
│  ↓ 批量规划解决方案                                          │
├─────────────────────────────────────────────────────────────┤
│  /issue:queue                                               │
│  ↓ 形成执行队列                                              │
├─────────────────────────────────────────────────────────────┤
│  /issue:execute                                             │
│  ↓ DAG 并行执行                                              │
├─────────────────────────────────────────────────────────────┤
│  /review-code                                               │
│  ↓ 代码审查                                                  │
└─────────────────────────────────────────────────────────────┘
```

**命令序列**:
```bash
# 1. 创建 issue
/issue:new
# 或发现潜在问题
/issue:discover

# 2. 规划解决方案
/issue:plan

# 3. 形成队列
/issue:queue

# 4. 执行
/issue:execute

# 5. 审查
/review-code
```

---

### 工作流 7: 代码重构

**适用场景**: 技术债务清理、架构优化

**时间**: 1-5天

```
┌─────────────────────────────────────────────────────────────┐
│  /project-analyze                                           │
│  ↓ 多阶段项目分析                                            │
├─────────────────────────────────────────────────────────────┤
│  /workflow:brainstorm-with-file                             │
│  ↓ 重构方案头脑风暴                                          │
├─────────────────────────────────────────────────────────────┤
│  /workflow:plan                                             │
│  ↓ 规划重构步骤                                              │
├─────────────────────────────────────────────────────────────┤
│  /workflow:execute                                          │
│  ↓ 执行重构                                                  │
├─────────────────────────────────────────────────────────────┤
│  /workflow:review-module-cycle                              │
│  ↓ 模块级审查                                                │
├─────────────────────────────────────────────────────────────┤
│  /clean                                                     │
│  ↓ 清理废弃代码                                              │
├─────────────────────────────────────────────────────────────┤
│  /memory:update-full                                        │
│  ↓ 更新全部文档                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 命令详解

### 核心命令说明

#### `/workflow:lite-plan`
轻量级交互式规划，适合快速迭代。在内存中进行规划，通过交互确认后执行。

**输入**: 功能描述
**输出**: 内存中的执行计划
**后续**: `/workflow:lite-execute`

#### `/workflow:plan`
5阶段完整规划工作流：
1. 上下文收集
2. 需求分析
3. 方案设计
4. 任务分解
5. 输出文档（IMPL_PLAN.md, task JSONs）

**输入**: 功能需求
**输出**: `.workflow/active/` 下的规划文档
**后续**: `/workflow:execute`

#### `/workflow:execute`
多代理协调执行，支持：
- 自动会话发现
- 并行任务处理
- 状态跟踪

#### `/review-code`
7维度代码审查：
1. 正确性
2. 可读性
3. 性能
4. 安全性
5. 测试
6. 架构
7. 最佳实践

---

## 相似命令对比

### 规划类命令对比

| 命令 | 复杂度 | 输出位置 | 适用场景 | 是否需要会话 |
|------|--------|----------|----------|--------------|
| `/workflow:lite-plan` | 低 | 内存 | 小功能、快速修复、1-2小时任务 | 否 |
| `/workflow:plan` | 中 | `.workflow/active/` 文件 | 新功能模块、需要文档化的任务 | 是 |
| `/workflow:collaborative-plan-with-file` | 高 | `.workflow/active/` 文件 | 大型功能、多模块协作、架构变更 | 是 |
| `/workflow:multi-cli-plan` | 高 | `.workflow/active/` 文件 | 需要多模型交叉验证的复杂决策 | 是 |

**选择指南**：
```
任务能在 2 小时内完成？
├── 是 → /workflow:lite-plan
└── 否 → 需要多人/多模型协作？
    ├── 是 → /workflow:collaborative-plan-with-file
    └── 否 → /workflow:plan
```

**详细说明**：

- **`/workflow:lite-plan`**：不生成文件，计划存在内存中。适合"加个按钮"、"修个样式"这类小任务。优点是快，缺点是会话结束计划就丢失。

- **`/workflow:plan`**：生成 `IMPL_PLAN.md` 和任务 JSON 文件。适合"实现用户认证模块"这类需要几天的任务。文件持久化，可跨会话继续。

- **`/workflow:collaborative-plan-with-file`**：多代理并行探索和规划。适合"重构整个支付系统"这类大型任务。会调用多个子代理分析不同方面。

- **`/workflow:multi-cli-plan`**：使用 Gemini + Qwen 等多个 CLI 交叉验证。适合架构决策等需要多角度验证的场景。

---

### 执行类命令对比

| 命令 | 复杂度 | 输入来源 | 文档化 | 适用场景 |
|------|--------|----------|--------|----------|
| `/workflow:lite-lite-lite` | 最低 | 直接描述 | 无 | 一句话能说清的简单任务 |
| `/workflow:lite-execute` | 低 | 内存计划/提示 | 无 | lite-plan 后执行 |
| `/workflow:execute` | 中 | 会话中的任务文件 | 有 | plan 后的标准执行 |
| `/workflow:unified-execute-with-file` | 高 | 任意规划文件 | 有 | 消费任何格式的规划输出 |

**选择指南**：
```
有规划文件吗？
├── 有 → /workflow:execute 或 /workflow:unified-execute-with-file
└── 没有 → 用了 lite-plan 吗？
    ├── 是 → /workflow:lite-execute
    └── 否 → /workflow:lite-lite-lite
```

**详细说明**：

- **`/workflow:lite-lite-lite`**：最简单，直接说"帮我加个 loading 状态"就执行。不需要任何前置步骤。

- **`/workflow:lite-execute`**：配合 `lite-plan` 使用。先规划确认，再执行。

- **`/workflow:execute`**：读取 `.workflow/active/` 下的任务文件，支持并行执行多个任务，有状态跟踪。

- **`/workflow:unified-execute-with-file`**：通用执行引擎，可以消费 brainstorm、plan、analysis 等任何输出。

---

### 审查类命令对比

| 命令 | 范围 | 输入 | 输出 | 适用场景 |
|------|------|------|------|----------|
| `/review-code` | 指定文件/目录 | 文件路径 | 审查报告 | 提交前快速审查 |
| `/workflow:review-module-cycle` | 模块级 | 模块路径 | 详细报告 | 单个模块深度审查 |
| `/workflow:review-session-cycle` | 会话级 | 会话 ID | 综合报告 | 整个功能开发后审查 |
| `/workflow:review` | 专项 | 类型+范围 | 专项报告 | 安全/架构等专项审查 |
| `/workflow:review-cycle-fix` | 自动修复 | 审查报告 | 修复后代码 | 自动修复审查问题 |

**选择指南**：
```
审查目的是什么？
├── 提交前快速检查 → /review-code
├── 深度审查单个模块 → /workflow:review-module-cycle
├── 审查整个功能开发 → /workflow:review-session-cycle
├── 专项审查（安全/架构） → /workflow:review
└── 自动修复问题 → /workflow:review-cycle-fix
```

**详细说明**：

- **`/review-code`**：7 维度快速审查，适合 `git commit` 前检查。输出简洁，关注主要问题。

- **`/workflow:review-module-cycle`**：对单个模块进行深度审查，生成详细报告。适合重要模块的专门审查。

- **`/workflow:review-session-cycle`**：基于 git 变更审查整个会话的所有改动。适合功能开发完成后的全面审查。

- **`/workflow:review`**：专项审查，可指定类型（security/architecture/quality）。适合安全审计、架构评审等场景。

- **`/workflow:review-cycle-fix`**：读取审查报告，自动修复发现的问题。配合其他审查命令使用。

---

### 调试类命令对比

| 命令 | 方式 | 文档化 | 适用场景 |
|------|------|--------|----------|
| `/ccw-debug` | 聚合诊断 | 否 | 快速定位问题 |
| `/workflow:debug-with-file` | 假设驱动 | 是 | 复杂问题深度调试 |
| `/workflow:lite-fix` | 直接修复 | 否 | 简单 bug 快速修复 |
| `/workflow:analyze-with-file` | 协作分析 | 是 | 需要多角度分析的问题 |

**选择指南**：
```
问题复杂度？
├── 简单（知道原因） → /workflow:lite-fix
├── 中等（需要诊断） → /ccw-debug
└── 复杂（需要假设验证） → /workflow:debug-with-file
```

**详细说明**：

- **`/ccw-debug`**：聚合多种诊断手段，快速定位问题。适合"程序报错了"这类需要先定位的场景。

- **`/workflow:debug-with-file`**：假设驱动调试，记录假设→验证→结论的过程。适合"随机崩溃"这类复杂问题。

- **`/workflow:lite-fix`**：知道问题在哪，直接修复。适合"这个函数有 bug"这类明确的修复。

- **`/workflow:analyze-with-file`**：多 CLI 协作分析，适合需要多角度理解的问题。

---

### 头脑风暴类命令对比

| 命令 | 方式 | 角色数 | 适用场景 |
|------|------|--------|----------|
| `/workflow:brainstorm-with-file` | 交互式 | 动态 | 需要引导的需求分析 |
| `/workflow:brainstorm:auto-parallel` | 自动并行 | 多个 | 快速获取多角度分析 |
| `/workflow:brainstorm:role-analysis` | 单角色 | 1个 | 特定角度深度分析 |
| `/workflow:brainstorm:synthesis` | 综合 | - | 整合多个分析结果 |
| `/workflow:brainstorm:artifacts` | 输出 | - | 生成最终规范文档 |

**选择指南**：
```
需求清晰度？
├── 模糊（需要引导） → /workflow:brainstorm-with-file
├── 清晰（需要多角度） → /workflow:brainstorm:auto-parallel
└── 特定角度深入 → /workflow:brainstorm:role-analysis
```

**详细说明**：

- **`/workflow:brainstorm-with-file`**：交互式头脑风暴，Claude 会提问引导你澄清需求。适合"我想做个 xxx 但不确定怎么做"。

- **`/workflow:brainstorm:auto-parallel`**：自动选择多个角色（架构师、产品经理、安全专家等）并行分析。快速获取全面视角。

- **`/workflow:brainstorm:role-analysis`**：指定单个角色深度分析。适合"从安全角度分析这个方案"。

- **`/workflow:brainstorm:synthesis`**：整合多个分析结果，澄清矛盾，形成共识。

- **`/workflow:brainstorm:artifacts`**：将头脑风暴结果转化为正式的指导规范文档。

---

### 文档更新类命令对比

| 命令 | 范围 | 执行方式 | 适用场景 |
|------|------|----------|----------|
| `/memory:update-related` | git 变更相关 | 主线程 | 功能完成后更新 |
| `/memory:update-full` | 全部模块 | 主线程 | 大版本发布前 |
| `/memory:docs-related-cli` | git 变更相关 | CLI 批量 | 大量模块变更 |
| `/memory:docs-full-cli` | 全部模块 | CLI 批量 | 全项目文档重建 |

**选择指南**：
```
更新范围？
├── 只更新改动的 → 模块数量多吗？
│   ├── 少（<15） → /memory:update-related
│   └── 多（≥15） → /memory:docs-related-cli
└── 更新全部 → 模块数量多吗？
    ├── 少 → /memory:update-full
    └── 多 → /memory:docs-full-cli
```

**详细说明**：

- **`/memory:update-related`**：只更新 git 变更涉及的模块文档。适合日常功能开发后。

- **`/memory:update-full`**：更新所有 CLAUDE.md 文档。适合大版本发布前确保文档完整。

- **`/memory:docs-related-cli`**：使用 CLI 批量处理，每个 agent 处理 4 个模块。适合大量模块变更。

- **`/memory:docs-full-cli`**：CLI 批量重建全部文档。适合项目文档初始化或大规模重构后。

---

### Issue 类命令对比

| 命令 | 输入 | 输出 | 适用场景 |
|------|------|------|----------|
| `/issue:new` | 描述/URL | 结构化 issue | 手动创建已知问题 |
| `/issue:discover` | 代码范围 | issue 列表 | 自动发现潜在问题 |
| `/issue:discover-by-prompt` | 提示描述 | issue 列表 | 基于描述发现问题 |
| `/issue:from-brainstorm` | 头脑风暴会话 | issue | 转换想法为 issue |

**选择指南**：
```
问题来源？
├── 已知具体问题 → /issue:new
├── 想发现潜在问题 → /issue:discover
├── 有模糊的担忧 → /issue:discover-by-prompt
└── 从头脑风暴转换 → /issue:from-brainstorm
```

**详细说明**：

- **`/issue:new`**：手动创建 issue，可以从 GitHub URL 或文字描述创建。

- **`/issue:discover`**：多角度（bug、UX、安全、性能等）自动扫描代码发现问题。

- **`/issue:discover-by-prompt`**：基于你的描述（如"担心支付模块的安全性"）针对性发现问题。

- **`/issue:from-brainstorm`**：将头脑风暴中产生的想法转换为可执行的 issue。

---

### 会话管理命令对比

| 命令 | 作用 | 前置条件 | 适用场景 |
|------|------|----------|----------|
| `/workflow:session:start` | 创建新会话 | 有规划文档 | 开始正式开发 |
| `/workflow:session:list` | 列出所有会话 | 无 | 查看会话状态 |
| `/workflow:session:resume` | 恢复会话 | 有暂停的会话 | 继续之前的工作 |
| `/workflow:session:complete` | 完成并归档 | 有活跃会话 | 功能开发完成 |
| `/workflow:session:solidify` | 固化学习 | 有完成的会话 | 将经验写入项目指南 |

**生命周期**：
```
/workflow:session:start → 开发中 → /workflow:session:complete
                              ↓
                         中断/上下文满
                              ↓
                    /workflow:session:resume
```

---

### memory:compact vs memory:load 详细对比

这两个命令名字相似但功能完全不同，是最容易混淆的命令对：

| 维度 | `/memory:compact` | `/memory:load` |
|------|-------------------|----------------|
| **核心功能** | 保存当前会话状态 | 分析项目生成上下文 |
| **触发时机** | 上下文快满时 | 开始新任务前 |
| **输入** | 当前对话内容（自动提取） | 任务描述（必需参数） |
| **输出** | Recovery ID (CMEM-*) | JSON 内容包 |
| **存储** | MCP core_memory（持久化） | 内存中（不持久化） |
| **恢复方式** | `core_memory export` | 无需恢复 |
| **使用频率** | 按需（上下文满时） | 每个新任务开始时 |

**使用场景对比**：

```bash
# 场景 1: 上下文快满了，需要保存进度
/memory:compact "实现了登录，待完成注册"
# → 返回 CMEM-20260201-143022
# → 新会话中: "请导入记忆 CMEM-20260201-143022"

# 场景 2: 开始新任务，需要了解项目
/memory:load "开发用户认证功能"
# → 返回项目结构、相关文件、技术栈等 JSON
# → 直接在当前会话使用，无需恢复
```

**记忆口诀**：
- **compact** = 压缩保存（像压缩文件一样保存当前状态）
- **load** = 加载分析（像加载配置一样分析项目）

---

## 最佳实践

### 1. 选择合适的工作流

| 任务复杂度 | 推荐工作流 |
|-----------|-----------|
| 简单（< 1小时） | 工作流 1: 快速功能开发 |
| 中等（半天-2天） | 工作流 2: 标准功能开发 |
| 复杂（> 3天） | 工作流 4: 复杂项目协作 |
| Bug 修复 | 工作流 5: Bug 修复流程 |
| 需要高测试覆盖 | 工作流 3: TDD 开发 |

### 2. 会话管理

- 使用 `/workflow:session:start` 开始正式开发
- 中断时使用 `/memory:compact` 保存上下文（返回 Recovery ID）
- 恢复 compact 记忆：新会话中说 "请导入记忆 CMEM-xxx" 或用 `core_memory export`
- 恢复工作流会话：使用 `/workflow:session:resume`
- 完成后使用 `/workflow:session:complete` 归档

### 3. 文档维护

- 每次功能完成后运行 `/memory:update-related`
- 大版本发布前运行 `/memory:update-full`
- 使用 `/memory:tips` 记录临时想法

### 4. 代码质量

- 提交前必须运行 `/review-code`
- 复杂改动使用 `/workflow:review-module-cycle`
- 发现问题后使用 `/workflow:review-cycle-fix` 自动修复

### 5. 调试技巧

- 简单问题直接 `/workflow:lite-fix`
- 复杂问题使用 `/workflow:debug-with-file` 记录假设和验证
- 使用 `/ccw-debug` 获取聚合诊断

---

## 快速参考卡片

```
┌────────────────────────────────────────────────────────────┐
│                    CCW 快速参考                             │
├────────────────────────────────────────────────────────────┤
│ 初始化:     /workflow:init                                 │
│ 规划:       /workflow:lite-plan | /workflow:plan           │
│ 执行:       /workflow:lite-execute | /workflow:execute     │
│ 审查:       /review-code                                   │
│ 调试:       /ccw-debug | /workflow:lite-fix                │
│ 文档:       /memory:update-related                         │
│ 完成:       /workflow:session:complete                     │
├────────────────────────────────────────────────────────────┤
│ 帮助:       /ccw-help                                      │
│ 仪表板:     /view                                          │
└────────────────────────────────────────────────────────────┘
```

---

## 上下文溢出处理

当工作流某一阶段出现上下文满（Context Overflow）时，使用以下方案处理。

### 症状识别

- Claude 响应变慢或出错
- 提示上下文长度超限
- 无法继续处理新的输入

### 方案 1: 压缩记忆（推荐首选）

```bash
# 当感觉上下文即将满时，立即执行：
/memory:compact
# 或带描述
/memory:compact "completed auth module"
```

**作用**：
- 提取当前会话的关键信息（目标、计划、文件、决策、约束、状态）
- 生成结构化文本保存到 **MCP core_memory**
- 返回 **Recovery ID**: `CMEM-YYYYMMDD-HHMMSS`

**恢复流程**：
```bash
# 新会话中，使用以下任一方式恢复：

# 方式 1: 直接告诉 Claude
"请导入记忆 CMEM-20260201-143022"

# 方式 2: 使用 MCP 工具
mcp__ccw-tools__core_memory({ operation: "export", id: "CMEM-20260201-143022" })

# 方式 3: 查看所有保存的记忆
mcp__ccw-tools__core_memory({ operation: "list" })
```

**注意**：`/memory:load` 是分析项目生成上下文，**不是**恢复 compact 的记忆！

### 方案 2: 会话归档与恢复

```bash
# 1. 保存当前会话状态
/workflow:session:complete   # 如果当前阶段任务完成
# 或
/memory:compact              # 如果任务未完成，先压缩

# 2. 开启新对话后恢复
/workflow:session:resume     # 恢复最近会话
# 或
/workflow:session:list       # 查看所有会话，选择恢复
```

### 方案 3: 分阶段执行（预防性策略）

将大任务拆分为独立阶段，每阶段在新会话中执行：

```
┌─────────────────────────────────────────────────────────────┐
│  会话 1: 规划阶段                                            │
│  ├── /workflow:init                                         │
│  ├── /workflow:brainstorm-with-file                         │
│  ├── /workflow:plan                                         │
│  └── 输出: .workflow/active/xxx/ 下的规划文档               │
├─────────────────────────────────────────────────────────────┤
│  会话 2: 执行阶段                                            │
│  ├── /workflow:session:start                                │
│  ├── /workflow:execute                                      │
│  └── 输出: 代码实现                                          │
├─────────────────────────────────────────────────────────────┤
│  会话 3: 审查阶段                                            │
│  ├── /workflow:review-session-cycle                         │
│  ├── /workflow:review-cycle-fix                             │
│  └── /workflow:session:complete                             │
└─────────────────────────────────────────────────────────────┘
```

**优势**：
- 每个阶段独立，互不影响
- 规划文档持久化，跨会话可用
- 即使某阶段中断，其他阶段不受影响

### 方案 4: 使用 CLI 工具分担上下文

```bash
# 将复杂分析任务交给 CLI 执行，减少主会话上下文占用
ccw cli -p "PURPOSE: 分析 xxx 模块的架构..." --tool gemini --mode analysis
```

**原理**：CLI 工具在独立进程中运行，不占用主会话上下文。

**适用场景**：
- 大量代码分析
- 复杂的架构探索
- 多文件搜索和理解

### 各阶段溢出处理速查表

| 阶段 | 溢出时操作 | 恢复方式 |
|------|-----------|----------|
| **初始化** | `/memory:compact` | 新会话 `core_memory export` 恢复 |
| **头脑风暴** | 保存当前分析，新会话继续 | 查看 `.workflow/.brainstorm/` 文件 |
| **规划** | `/memory:compact` | 规划文档已持久化，直接继续 |
| **执行** | `/workflow:session:complete` 或 `/memory:compact` | `/workflow:session:resume` |
| **审查** | 完成当前模块审查后换会话 | 查看审查报告继续 |
| **调试** | `/memory:compact` 保存假设 | 新会话 `core_memory export` 恢复 |

### memory:compact vs memory:load 区别

| 命令 | `/memory:compact` | `/memory:load` |
|------|-------------------|----------------|
| **用途** | 压缩保存当前会话记忆 | 分析项目生成上下文 |
| **输入** | 当前对话内容 | 任务描述（必需参数） |
| **输出** | Recovery ID (CMEM-*) | JSON 内容包 |
| **存储位置** | MCP core_memory | 内存中（不持久化） |
| **恢复方式** | `core_memory export` | 无需恢复，直接使用 |
| **典型用法** | 上下文满时保存进度 | 开始新任务前加载项目信息 |

**示例**：
```bash
# compact: 保存当前工作进度
/memory:compact "实现了登录，待完成注册"
# → 返回 CMEM-20260201-143022

# load: 分析项目为新任务准备上下文
/memory:load "开发用户认证功能"
# → 返回项目结构、相关文件、技术栈等 JSON
```

### 紧急恢复流程

当会话因上下文满而中断时：

```bash
# 1. 新会话中查看之前的会话
/workflow:session:list

# 2. 恢复会话
/workflow:session:resume

# 3. 如果没有会话记录，手动查看工作流目录
# 查看 .workflow/active/ 下的文档继续工作
```

### 预防措施

| 策略 | 说明 | 命令 |
|------|------|------|
| **分阶段执行** | 规划、执行、审查分开进行 | - |
| **使用 Task 代理** | 复杂探索用子代理 | `subagent_type=Explore` |
| **CLI 分担** | 大量分析用 CLI | `ccw cli -p "..." --tool gemini` |
| **及时归档** | 完成一个功能就归档 | `/workflow:session:complete` |
| **定期压缩** | 长会话中定期压缩 | `/memory:compact` |
| **使用轻量命令** | 简单任务用轻量版 | `/workflow:lite-*` |

### 上下文管理快速参考

```
┌────────────────────────────────────────────────────────────┐
│              上下文溢出处理快速参考                          │
├────────────────────────────────────────────────────────────┤
│ 即将满时:                                                   │
│   /memory:compact          → 压缩保存，返回 Recovery ID     │
│   /workflow:session:complete → 归档已完成的工作             │
├────────────────────────────────────────────────────────────┤
│ 新会话恢复:                                                 │
│   /workflow:session:resume → 自动恢复最近会话               │
│   /workflow:session:list   → 选择特定会话恢复               │
│   "请导入记忆 CMEM-xxx"    → 恢复 compact 保存的记忆        │
│   core_memory export       → MCP 方式恢复记忆               │
├────────────────────────────────────────────────────────────┤
│ 注意:                                                       │
│   /memory:load 是分析项目生成上下文，不是恢复记忆！         │
├────────────────────────────────────────────────────────────┤
│ 预防措施:                                                   │
│   - 分阶段执行（规划/执行/审查分开）                        │
│   - 使用 CLI 分担复杂分析                                   │
│   - 及时归档完成的工作                                      │
│   - 定期压缩长会话                                          │
└────────────────────────────────────────────────────────────┘
```

---

## 常见问题解答 (FAQ)

### Q1: 我是新手，应该从哪个命令开始？

**A**: 推荐从最简单的工作流开始：

```bash
# 1. 先用最简单的方式完成一个小任务
/workflow:lite-lite-lite
# 直接描述你要做什么，Claude 会帮你完成

# 2. 熟悉后，尝试带规划的方式
/workflow:lite-plan
# 然后
/workflow:lite-execute

# 3. 需要帮助时
/ccw-help
```

### Q2: lite-plan 和 plan 我该用哪个？

**A**: 看任务能否在 2 小时内完成：

| 情况 | 选择 |
|------|------|
| 2 小时内能完成 | `/workflow:lite-plan` |
| 需要半天以上 | `/workflow:plan` |
| 需要跨天/多人协作 | `/workflow:collaborative-plan-with-file` |

### Q3: 上下文满了怎么办？

**A**: 立即执行 `/memory:compact`，记下返回的 Recovery ID，然后在新会话中说"请导入记忆 CMEM-xxx"。

### Q4: memory:compact 和 memory:load 有什么区别？

**A**:
- **compact** = 保存当前工作进度（上下文满时用）
- **load** = 分析项目生成上下文（开始新任务时用）

它们不是配对的！compact 的恢复方式是 `core_memory export`，不是 load。

### Q5: 什么时候需要用 session:start？

**A**: 当你使用 `/workflow:plan` 生成了规划文档后，在开始执行前用 `session:start` 创建正式会话。如果只是用 `lite-plan`，不需要 session。

### Q6: 代码写完了，提交前要做什么？

**A**:
```bash
# 1. 代码审查
/review-code

# 2. 如果有问题，自动修复
/workflow:review-cycle-fix

# 3. 更新文档
/memory:update-related

# 4. 然后 git commit
```

### Q7: 遇到 bug 该用哪个命令？

**A**:
- 知道问题在哪 → `/workflow:lite-fix`
- 不知道原因 → `/ccw-debug`
- 复杂问题需要记录 → `/workflow:debug-with-file`

### Q8: 如何查看之前的工作？

**A**:
```bash
# 查看工作流会话
/workflow:session:list

# 查看保存的记忆
mcp__ccw-tools__core_memory({ operation: "list" })

# 查看工作流目录
ls .workflow/active/
ls .workflow/archived/
```

### Q9: /ccw 命令是做什么的？

**A**: `/ccw` 是智能编排器，会根据你的描述自动选择合适的工作流：

```bash
/ccw "添加用户登录功能"
# Claude 会分析任务复杂度，自动选择 lite-plan 或 plan 等
```

### Q10: 如何让 Claude 记住项目的特定约定？

**A**:
```bash
# 方式 1: 完成会话后固化学习
/workflow:session:solidify

# 方式 2: 手动记录
/memory:tips
# 输入你想记录的约定
```

---

## 命令速查索引

### 按使用频率排序

| 频率 | 命令 | 用途 |
|------|------|------|
| ⭐⭐⭐ | `/workflow:lite-plan` | 轻量规划 |
| ⭐⭐⭐ | `/workflow:lite-execute` | 轻量执行 |
| ⭐⭐⭐ | `/review-code` | 代码审查 |
| ⭐⭐⭐ | `/memory:compact` | 保存进度 |
| ⭐⭐ | `/workflow:plan` | 完整规划 |
| ⭐⭐ | `/workflow:execute` | 完整执行 |
| ⭐⭐ | `/ccw-debug` | 调试诊断 |
| ⭐⭐ | `/workflow:lite-fix` | 快速修复 |
| ⭐⭐ | `/memory:update-related` | 更新文档 |
| ⭐ | `/workflow:session:start` | 启动会话 |
| ⭐ | `/workflow:session:resume` | 恢复会话 |
| ⭐ | `/workflow:session:complete` | 完成会话 |

### 按场景分类

**开始新任务**:
```
/workflow:init → /workflow:lite-plan 或 /workflow:plan
```

**日常开发**:
```
/workflow:lite-plan → /workflow:lite-execute → /review-code
```

**复杂功能**:
```
/workflow:brainstorm-with-file → /workflow:plan → /workflow:session:start → /workflow:execute
```

**修复 Bug**:
```
/ccw-debug → /workflow:lite-fix → /review-code
```

**上下文满**:
```
/memory:compact → (新会话) → "请导入记忆 CMEM-xxx"
```

**提交代码**:
```
/review-code → /memory:update-related → git commit
```

### 命令别名速记

| 简称 | 完整命令 | 记忆方法 |
|------|----------|----------|
| LLL | `/workflow:lite-lite-lite` | 三个 Lite，最轻量 |
| LP | `/workflow:lite-plan` | Lite Plan |
| LE | `/workflow:lite-execute` | Lite Execute |
| RC | `/review-code` | Review Code |
| MC | `/memory:compact` | Memory Compact |
| SS | `/workflow:session:start` | Session Start |
| SR | `/workflow:session:resume` | Session Resume |
| SC | `/workflow:session:complete` | Session Complete |

---

## 版本信息

- **文档版本**: 1.0
- **最后更新**: 2026-02-01
- **适用于**: CCW 工作流系统
