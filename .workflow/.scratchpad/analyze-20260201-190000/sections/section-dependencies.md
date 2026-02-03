## 系统架构设计报告 - 依赖管理与生态集成

### 外部集成拓扑与防腐层设计

系统采用分层隔离策略，通过明确的模块边界与适配器模式有效地隔离外部依赖变化。在外部生态集成方面，系统主要依赖四个核心第三方库：React 19.0.0 作为 UI 框架基础、Tailwind CSS 4.0.0 提供样式系统、jszip 3.10.1 负责批量文件打包、file-saver 2.0.5 处理客户端下载。这些依赖的引入遵循了"最小化外部耦合"的原则，每个库都被限制在特定的职责边界内。

值得注意的是，系统对外部 API 和数据库的依赖极为有限。整个应用运行于浏览器端，不存在后端服务依赖，这一架构决策从根本上消除了网络延迟、服务可用性等分布式系统的复杂性。所有数据持久化均通过浏览器原生的 localStorage API 实现，避免了对外部存储服务的依赖。这种设计使得系统具有高度的独立性和离线可用性。

在防腐层设计上，系统通过工具层（utils）建立了对第三方库的统一访问点。fileUtils.ts 模块对 jszip 和 file-saver 进行了封装，暴露出 downloadSingleResult 和 downloadBatchResults 两个高层接口，隐藏了底层库的具体实现细节。这一设计使得如果未来需要替换文件下载方案（例如从 file-saver 迁移到其他库），仅需修改 fileUtils.ts 内部实现，上层组件无需感知变化。类似地，imageProcessor.ts 对 Canvas API 和 ImageData 进行了深度封装，提供了 processImagePair 和 generatePreview 等业务级接口，使得 UI 层完全不需要了解像素级图像处理的复杂性。

### 核心依赖分析与锁定风险评估

系统的依赖可分为两个清晰的层级：核心业务依赖与基础设施依赖。React 和 Tailwind CSS 属于核心业务依赖，它们直接影响应用的功能和用户体验。React 19.0.0 的选择体现了对最新稳定版本的追求，该版本引入了 useCallback、useRef 等高级 Hook，为系统的性能优化和状态管理提供了坚实基础。Tailwind CSS 4.0.0 通过 @tailwindcss/vite 插件集成，提供了原子化的样式系统，使得 UI 组件的样式定义与逻辑代码紧密耦合，提高了开发效率。

jszip 和 file-saver 属于基础设施依赖，它们支撑批量处理和文件下载功能。这两个库的版本选择相对保守（3.10.1 和 2.0.5），反映了对稳定性的重视。特别地，file-saver 库已进入成熟阶段，其 API 相对稳定，被锁定的风险较低。jszip 虽然功能复杂，但其核心 API（new JSZip()、zip.file()、zip.generateAsync()）在多个版本间保持一致，迁移成本相对可控。

系统对 React 的依赖程度较高，这是前端应用的普遍特征。React 的生态成熟度高，社区活跃，版本升级通常具有良好的向后兼容性。然而，React 19.0.0 相对较新，存在一定的稳定性风险。为了降低这一风险，系统应建立完善的测试体系，特别是针对 Hook 相关的单元测试和集成测试。此外，系统应定期监控 React 的安全公告和性能优化建议，及时进行版本更新。

### 依赖注入与控制反转的实现模式

系统采用了 React Hooks 作为依赖注入的主要机制，这一选择充分利用了 React 函数式编程的优势。在 App.tsx 中，通过 useState 和 useCallback 实现了状态的集中管理和事件处理的解耦。具体而言，App.tsx 作为中央协调器，维护了应用的全局状态（originalFile、annotatedFile、options、userPresets 等），并通过 Props 将这些状态和回调函数注入到子组件中。这一模式确保了数据流的单向性，使得状态变化的追踪变得直观。

在工具层的设计中，系统实现了更深层次的依赖倒置。imageProcessor.ts 导出的函数（如 generatePreview、processImagePair）不依赖于任何 UI 框架或全局状态，而是通过函数参数接收所有必要的输入。这种纯函数式的设计使得这些工具函数可以独立进行单元测试，无需模拟复杂的 React 环境。fileUtils.ts 同样遵循这一原则，其 downloadSingleResult 和 downloadBatchResults 函数通过参数接收 File 对象和 ProcessingOptions，而不是从全局状态中读取。

系统中的 useDebounce Hook 体现了对性能优化的关注。当用户快速调整处理选项时，防抖机制延迟了 generatePreview 的调用，避免了频繁的图像处理计算。这一设计通过 useEffect 的依赖数组实现了自动的生命周期管理，当输入值或延迟时间变化时，定时器会被正确地清理和重新设置。这种模式展示了 React Hooks 在实现控制反转时的优雅性。

localStorage 的使用体现了系统对持久化状态的管理策略。系统定义了 STORAGE_KEYS 常量来集中管理存储键名，通过 readPersistedCollapsed 和 readPersistedPreset 函数进行类型安全的读取，避免了硬编码字符串散布在代码各处。这一设计使得存储策略的变更（例如从 localStorage 迁移到 IndexedDB）可以通过修改这些函数来实现，而不影响应用的其他部分。

### 供应链安全与版本治理策略

系统的依赖树相对简洁，共包含 4 个生产依赖和 11 个开发依赖。这种精简的依赖结构大幅降低了供应链攻击的风险面。package.json 中使用了 caret 版本约束（^），允许在主版本号相同的前提下自动升级次版本和补丁版本。这一策略在获得安全补丁的同时，降低了引入破坏性变更的风险。

对于开发依赖，系统采用了现代的工具链：TypeScript 5.6.2 提供类型安全，ESLint 9.17.0 和相关插件确保代码质量，Vite 6.0.5 提供快速的开发和构建体验。这些工具的版本选择相对激进，反映了项目对最新开发实践的追求。然而，这也意味着需要更频繁地关注这些工具的更新日志，以及时应对可能的破坏性变更。

系统缺乏显式的依赖版本锁定机制（如 package-lock.json 的完整版本控制）。虽然 npm 会自动生成 package-lock.json，但在团队协作中应确保该文件被纳入版本控制，以保证所有开发者和 CI/CD 环境使用相同的依赖版本。此外，系统应建立定期的依赖审计流程，使用 npm audit 检查已知的安全漏洞，并根据风险等级制定更新计划。

在模块间的依赖治理上，系统展现了清晰的单向依赖流：App.tsx 依赖于 imageProcessor.ts 和 fileUtils.ts，fileUtils.ts 依赖于 imageProcessor.ts，而 imageProcessor.ts 不依赖于任何其他内部模块。这种无循环的依赖图确保了模块的独立可测试性，同时为未来的微服务拆分或模块复用奠定了基础。特别地，imageProcessor.ts 的完全独立性使得其可以被提取为独立的 npm 包，供其他项目使用。

系统对 localStorage 的依赖虽然简化了架构，但也引入了一个隐性的约束：用户数据完全存储在本地，无法跨设备同步。如果未来需要支持云同步功能，系统需要引入后端服务依赖。这一演进路径应在架构设计时就被考虑，通过定义清晰的数据持久化接口（例如一个 StorageProvider 抽象），使得从 localStorage 迁移到远程存储时的改动最小化。
