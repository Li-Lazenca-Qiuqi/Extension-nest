# 002：单组归属、原生管理与 Dashboard

当前 Tag、配置与管理范围以 [003 决策](003-tags-and-reduced-scope.md) 为准；本文中的导入导出和卸载要求已撤销，保留历史背景。

日期：2026-09-12。状态：用户明确的产品要求已生效；安装范围、布局和适配方案为实现前工作解释，尚未运行验证。替代 [001 初稿](001-requirements-baseline.md) 中冲突的结论。

## 用户明确要求

1. 一个插件不能出现在不同分组中。
2. 核心操作依赖鼠标，能够拖动；键盘含义需解释。
3. 与 Marketplace 同步，支持启用、禁用、更新与卸载，复用原生接口。
4. 已安装扩展都可见，禁用可以灰色表示。
5. 提供可查看的 Dashboard。

## 当前设计决策

用户在 Demo 阶段进一步明确：直接接入 VS Code，不创建 Webapp 侧边栏。分组导航、插件拖动和组排序放在原生 Explorer TreeView；Dashboard 只保留编辑器面板中的统计、列表、筛选和管理入口。

| 主题 | 决策与原因 |
| --- | --- |
| 唯一归属 | 每个 ID 对应一个 assignments 值；未分配即 Ungrouped；拖动是移动，不再复制 |
| 全量视图 | 侧边栏仅组和 Ungrouped；Dashboard 使用 All Installed/状态筛选，避免同一树中重复展示被理解为多组 |
| 鼠标 | 拖放、右键、复选框与可见按钮是主流程；键盘仅为原生辅助导航，不要求快捷键或命令 |
| 管理优先级 | 启停、更新、卸载、同步提升至 P0；操作与分组命令分离 |
| 完整清单 | 已安装即需显示，禁用/未激活/VSIX 不得漏；API 能力不足是技术问题，不改变用户验收要求 |
| 状态 | 禁用灰显且保留可操作性；加文本；Unknown、Mixed、Restart Required 不能强行归成 enabled/disabled |
| Dashboard | P0 正式可操作面板，默认建议编辑器 Webview；与原生树共用服务，允许 React + Vite，不引入后端 |
| 安装范围 | 工作默认是当前 Profile、本地与当前已连接 Remote；不擅自连接其他主机或枚举其他 Profile |
| 实例与计数 | 同 ID 跨安装目标共享唯一归属；管理先选实例；Dashboard 统计按实例、组计数按唯一 ID，明确标签 |
| schema | 未发布也无已写入用户数据，直接定义 schemaVersion=1 的 assignments；初稿数组格式拒绝并提示，不做静默转换 |
| 发布规则 | 仅文档修订，不更新产品版本或 CHANGELOG，不执行安装/卸载或 Git 提交 |

## 接口核对及执行边界

- 官方列出的原生命令包括安装、卸载和扩展搜索，适配器优先复用。[Built-in Commands](https://code.visualstudio.com/api/references/commands)
- 原生扩展管理界面提供已安装（含禁用）清单及启停、更新和卸载流程。[Extension Marketplace](https://code.visualstudio.com/docs/configure/extensions/extension-marketplace)
- isActive 表示激活状态，公开 Extension 接口不是统一启停管理接口；清单、启用状态、更新状态不能靠猜测拼出。[VS Code 类型定义](https://github.com/microsoft/vscode/blob/main/src/vscode-dts/vscode.d.ts)
- CLI 提供安装清单与管理补充能力，但 Profile/目标/宿主必须校验，不能混用 Windows 与 WSL 工具链。[Command Line Interface](https://code.visualstudio.com/docs/configure/command-line)

可直接调用时执行原生动作；缺少可支持的直接入口时，明确标识并打开目标原生管理界面，由用户在那里完成。不把跳转视为完成，不以接口困难把管理移回 P1。完整清单、真实状态、灰显和同步仍是 M0 重点验证；本轮只做文档核对，没有验证运行环境中的接口。
