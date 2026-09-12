# Extension Nest 项目记忆

## 项目摘要与当前状态

- Extension Nest 是面向 VS Code 的插件分组、原生管理与 Dashboard 工具；项目目录名为 `Extension-nest`。
- 当前阶段：原生 VS Code 交互 Demo 已构建并生成 VSIX；11 项逻辑测试通过，鼠标移组/禁用/双面板同步已在真实窗口验证。真实拖动手势待人工确认，真实 Marketplace 与完整清单尚未接入。
- 工作名称依据当前目录暂用 Extension Nest；聊天中的 Extension Organizer、ExtNest 等为历史暂名或候选名，发布名称尚未确认。
- 初始化日期：2026-09-12。初始化前目录为空，未发现 Git 仓库及可读取的提交历史。
- 当前版本：0.1.0，本地交互 Demo；2026-09-12 已初始化 Git。版本变化记录在 CHANGELOG.md，真实接口接入仍待完成。

## 阅读顺序与目录地图

1. 本文件：稳定约定与项目入口。
2. [当前待办](doc/TODO.md)：唯一活动执行清单。
3. [产品需求](doc/PRD/extension-nest.md)：范围、行为与验收标准。
4. [路线图](doc/Roadmap.md)：阶段安排。
5. [当前需求决策](doc/decisions/002-single-group-management-dashboard.md)：用户最新要求及实现边界；001 仅记录被替代的初稿背景。
6. [聊天来源摘要](doc/note/2026-09-12-source-chat.md)：需求来源与证据边界。

`README.md` 用于运行说明；`src/` 为扩展宿主，`demo/src/` 为编辑器 Dashboard 和示例状态；`doc/archive/` 默认不主动读取。Demo 边界见 [实现说明](doc/note/demo-implementation.md)。

## 长期约定

- 正式界面包括原生 TreeView 侧边栏和可操作的 Dashboard；Dashboard 建议使用编辑器 Webview，允许 React（TypeScript）+ Vite。
- 用户明确要求直接接入 VS Code。分组放原生侧边栏，Dashboard 不得包含自建网页侧边栏，不用浏览器模拟壳替代原生体验。
- Dashboard 使用紧凑插件卡片，不用表格列表；删除宣传式标题和多余说明，统计保持单行紧凑。
- Group 为单一归属：每个 Extension ID 至多一个自定义组；拖到新组即移动，拖到 Ungrouped 即解除归属。
- 鼠标是主操作方式，支持拖动、右键、可见按钮和鼠标批量选择；键盘导航只是辅助，不要求记快捷键。
- 分组变更只处理组织元数据；独立的启用、禁用、更新和卸载属于 P0，复用 VS Code 原生流程并同步真实结果。
- 使用 TypeScript 和 VS Code Extension API；不为本地分组功能引入 Web 后端。
- 界面、服务、状态和外部命令适配分层；TreeItem 不直接写持久化状态。
- 数据格式统一使用 `schemaVersion`；显示名不能充当 Extension ID 或 Group ID。
- 当前 Profile 与当前已连接 Local/Remote 范围内全部已安装扩展必须可见，包含禁用、未激活与 VSIX；不能以不完整 API 集合降低验收目标。
- 禁用灰显并辅以文本；`isActive` 不等于启用状态。未知、待重启及跨实例 Mixed 必须明确区分。
- 全量与状态筛选放在 Dashboard，不是第二个自定义分组；同 ID 多安装实例共享唯一分组，管理操作明确目标。
- `assignments` 保存单个 Group ID；不再使用多组 `memberships` 数组。还没有已发布数据，当前 schemaVersion 为 1。
- 文档与注释使用简体中文，代码标识符、路径和界面示例标签使用英语。
- 开始工作时读取用户级规则、相关项目文档与存在的 Git 记录；完成后按真实证据更新 TODO，不能把需求定义写成已实现。
- 不使用 `LAST_RUN.md`。仅在用户明确要求更新项目版本时创建或更新 `CHANGELOG.md`；仅明确要求提交时执行 Git 提交。
