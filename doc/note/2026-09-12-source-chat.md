# 聊天来源与技术核对

读取日期：2026-09-12。

## 需求来源

- 标题：[vscode插件分组方法](https://chatgpt.com/c/6a3e8b9a-2fa8-83ee-9434-b25eb36b0ec2)。通过用户指定的已打开浏览器标签读取。
- 前文用户询问插件是否可以分组，并继续询问管理插件的插件。
- 后文用户请求具体 PRD 和 HTML 布局说明；聊天助手提供 38 节 PRD、HTML 示例和开发顺序。
- 最后用户请求命名；助手给出 ExtShelf、ExtNest、Extree 等候选，没有读到用户确认最终名称的消息。
- 本次用户要求先初始化项目记忆系统，再依据聊天生成 PRD。因此保留需求来源与决策摘要，不把历史助手建议解释为本次安装、开发或发布授权。

## 采纳的核心方向

以下为初次整理时采纳的历史方向，不是当前基线：原生 TreeView、一级用户组、多对多归属、拖放添加、本地保存、JSON 迁移和原生详情，管理操作后置。用户随后明确改为单组、鼠标拖动移动、首版原生管理、全部安装可见与 Dashboard，当前以 [002 决策](../decisions/002-single-group-management-dashboard.md) 和 PRD 为准。

聊天提及的第三方插件仅作为需求背景，本次未重新验证其维护状态、功能、安装量或 License，也未复制其源码。聊天中的 HTML 代码未作为完整源码导出或运行。

## 官方资料核对

以下为文档核对，不是运行验证：

- [VS Code API：extensions](https://code.visualstudio.com/api/references/vscode-api#extensions)：all 是系统当前已知扩展集合；onDidChange 对应集合变化。这个 API 边界仍需注意，但初稿据此缩小展示集合的产品决定已被用户修改；现在必须找到满足完整安装清单要求的数据通路。
- [VS Code API：Extension](https://code.visualstudio.com/api/references/vscode-api#Extension)：isActive 表示已激活，不是启用标记；用于元数据读取的公开属性不等同于启停管理接口。
- [Tree View API](https://code.visualstudio.com/api/extension-guides/tree-view)：支撑原生树贡献点与数据提供者路线。
- [Built-in Commands](https://code.visualstudio.com/api/references/commands)：详情命令的具体名称和参数仍需目标版本实测；本次没有将聊天中的名称视为已验证稳定契约。

## 当前项目事实

初始化前工作目录为空；Git 检查提示不在仓库中，没有提交历史可读。本次建立文档和项目记忆入口，不初始化 Git、不提交、不更新产品版本。尚未安装依赖、构建或运行扩展。
