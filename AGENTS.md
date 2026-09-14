# Extension Nest 项目约定

## 稳定背景与技术栈

Extension Nest 为 VS Code 提供插件分组、原生管理入口与 Dashboard。扩展宿主使用 TypeScript 和 VS Code Extension API，编辑器 Webview 使用 React（TypeScript）+ Vite，不引入独立 Web 后端。

## 阅读顺序与目录地图

1. [PRODUCT](doc/PRODUCT.md)：产品定位、现有能力、流程、支持范围和已知限制。
2. [TODO](doc/TODO.md)：唯一活动执行清单。
3. [PRD-000](doc/PRD/000-overview.md)：需求索引；PRD-001～PRD-009、PRD-011～PRD-013、PRD-015～PRD-017 为当前模块需求；PRD-010 与 PRD-014 仅保留撤销占位和历史链接。
4. [Roadmap](doc/Roadmap.md)：阶段目标与退出条件。
5. [当前决策](doc/decisions/003-tags-and-reduced-scope.md)：设计取舍；001、002 仅记录历史范围。
6. [Demo 实现说明](doc/note/demo-implementation.md)：结构、数据与验证证据边界。

- `src/`：扩展宿主、原生 TreeView 和 Webview 消息桥。
- `demo/src/`：Dashboard、示例数据、状态模型及测试。
- `demo/test/`：测试替身。
- `doc/note/`：专题笔记与来源记录。
- `doc/archive/`：历史记录，按需读取，不作为当前规范。
- `README.md`：对外安装与使用说明，主要由用户维护或按明确要求更新。
- `CHANGELOG.md`：版本级变化；动态版本与功能状态不在本文件重复维护。

## 长期约定

- 直接接入 VS Code。分组导航和拖动使用原生侧边栏，Dashboard 不自建网页侧边栏或模拟外壳。
- Dashboard 使用紧凑插件卡片，统计保持单行，避免宣传式文案和多余说明。
- 每个 Extension ID 至多一个自定义组；拖入新组即移动，拖到 Ungrouped 即解除归属。
- 鼠标为主，保留键盘辅助访问；分组变更只修改组织元数据，与安装管理分离。
- 正式管理能力复用 VS Code 原生流程，操作明确安装目标和范围，读取真实状态后确认结果；本插件不提供卸载入口，对 VS Code 外部卸载只做只读同步。
- 全量清单、Profile/Remote 范围及验收标准由模块 PRD 定义，不因 API 返回不完整而降低要求。
- 禁用灰显并辅以文本；isActive 不等于启用状态，Unknown、Mixed 与待重启状态需区分。
- UI、服务、状态和适配器分层；TreeItem 与 Webview 不直接写持久化，不执行任意传入命令。
- 正式本地配置以稳定 ID、唯一 assignments 和每个扩展的 tags 表达归属与标签；格式以 PRD-009 为准，不与 Demo 全快照混用。
- Tag 与 Group 独立：每个扩展的 tags 是字符串数组；标签只参与搜索和筛选，不改变唯一分组。标签首尾空白会被去除，按大小写不敏感规则去重；每个标签最多 30 个 Unicode 字符，每个扩展最多 10 个标签。
- 当前能力维护在 PRODUCT，执行进度维护在 TODO，完成记录定期归档；不得把需求或 Demo 完成当作正式验收通过。
- Git 提交与版本更新分别需要用户明确要求；仅版本更新时修改 CHANGELOG。删除操作遵循用户级授权规则。
- 不使用 LAST_RUN.md。
