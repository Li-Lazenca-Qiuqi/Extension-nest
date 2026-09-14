# PRD-000：产品总览与模块索引

更新日期：2026-09-14。当前软件版本：0.1.1（示例数据 Demo）。本文和模块 PRD 定义正式产品要求，Demo 完成不代表正式 P0 验收通过。

工作名称 Extension Nest；发布名称、publisher 和 License 尚待确认。来源为[原始聊天](https://chatgpt.com/c/6a3e8b9a-2fa8-83ee-9434-b25eb36b0ec2)，后续以用户明确修订及[决策记录](../decisions/003-tags-and-reduced-scope.md)为准。

## 编号与维护规则

- PRD-000 保存公共范围、集成约束和质量门槛；PRD-001～PRD-009、PRD-011～PRD-013、PRD-015～PRD-017 每份对应一个当前功能模块。
- F01～F09、F11～F13、F15～F17 和 A01～A11、A15～A25 是当前编号；每个当前 F 及 A 有且只有一个主定义，跨模块只链接引用。
- PRD-010/F10 与 PRD-014/F14 已撤销，仅保留占位和历史链接；A12、A13、A14 同样撤销，不计入当前 P0 验收，也不得分配给新功能。
- 原模块缺少独立案例时，补充 PRD-NNN-ACNN 局部验收编号；它们是需求细化，不表示测试已通过。
- 修改模块需求时同步核对依赖、公共约束和 [TODO](../TODO.md)，不复制多份执行状态。
- 本次为文档拆分，不更新软件版本、不修改 CHANGELOG、不自动提交。

## 模块索引

| 文档编号 | 功能模块 | 需求 | 主验收编号 |
| --- | --- | --- | --- |
| [PRD-001](001-installed-inventory.md) | 全量安装清单 | F01 | A01, A21 |
| [PRD-002](002-native-group-tree.md) | 原生分组树 | F02 | PRD-002-AC01/AC02 |
| [PRD-003](003-search-and-filters.md) | 搜索与状态筛选 | F03 | A18 |
| [PRD-004](004-group-management.md) | 分组管理 | F04 | A05, A06 |
| [PRD-005](005-single-group-assignment.md) | 单组归属与批量移动 | F05 | A02, A04 |
| [PRD-006](006-extension-drag-drop.md) | 插件拖放 | F06 | A03, A17 |
| [PRD-007](007-group-ordering.md) | 分组排序 | F07 | A16 |
| [PRD-008](008-native-details.md) | 原生详情与标识复制 | F08 | A23 |
| [PRD-009](009-persistence.md) | 本地状态与恢复 | F09 | A15 |
| [PRD-010](010-import-export.md) | 配置导入导出（撤销占位） | 已撤销 F10 | 已撤销 A13, A14 |
| [PRD-011](011-onboarding.md) | 首次引导 | F11 | PRD-011-AC01/AC02 |
| [PRD-012](012-enable-disable.md) | 启用、禁用与状态展示 | F12 | A07, A08, A20 |
| [PRD-013](013-updates.md) | 扩展更新 | F13 | A10, A11 |
| [PRD-014](014-uninstall.md) | 扩展卸载（撤销占位） | 已撤销 F14 | 已撤销 A12 |
| [PRD-015](015-state-sync.md) | 状态同步与并发 | F15 | A09, A19, A24 |
| [PRD-016](016-dashboard.md) | 紧凑卡片 Dashboard | F16 | A22 |
| [PRD-017](017-tags.md) | 插件 Tag | F17 | A25 |

## 产品目标

帮助安装大量扩展的 VS Code 用户以鼠标整理和管理插件：打开分组或 Dashboard，找到扩展，拖动分类，编辑 Tag，直接进入启用、禁用或更新流程。无需为了整理插件切换 Profile。

### 成功标准

- 每个 Extension ID 至多属于一个自定义组；未分配的插件位于 Ungrouped。
- 拖入新组即移动；原组不再保留该插件。分组和 Tag、启停互相独立。
- 每个扩展的 `tags` 是独立字符串数组；多 Tag 只参与搜索和筛选，不产生额外分组。
- 当前管理范围内，所有已安装扩展都可查看，包括禁用、未激活及本地 VSIX 扩展，不因元数据 API 缺失而静默漏项。
- 与 VS Code 原生扩展管理保持同一真实状态；启停、更新及外部安装/卸载变化完成后分组页与 Dashboard 同步。
- 鼠标点击、拖动、右键和可见按钮可完成核心流程；无需记忆快捷键或输入命令。
- Dashboard 可看、可筛选、可操作，首版交付时不是静态示例。

## 公共范围

| 概念 | 定义 |
| --- | --- |
| Extension ID | 规范化的 publisher.name；分组以此为主键，不使用显示名 |
| Group | 一级自定义文件夹式分组；无嵌套；每个 ID 至多一个归属 |
| Tag | 扩展的独立字符串数组；只用于搜索和筛选，不参与 Group 归属 |
| Ungrouped | 未分配自定义组的插件，是唯一归属的默认位置 |
| 安装实例 | 同一 ID 在某个安装目标的实例；版本和启用状态可能随 Local、WSL、SSH 等环境不同 |
| 当前管理范围 | 当前 VS Code Profile 对应的本地安装，以及当前窗口已连接的 Remote 安装；不自动连接未连接服务器或枚举其他 Profile |
| 全量列表/状态筛选 | All Installed、Enabled、Disabled、Updates 等查询视图，不保存分组归属，不构成第二个自定义组 |
| 保存的分组关系 | 暂时离线或清单暂不可见时仍可保留的单组元数据；外部安装/卸载变化只读同步 |

### P0：首版必须交付

完整安装清单；原生侧边栏分组；单组分配；插件拖动移动和组拖动排序；鼠标批量选择；创建/重命名/删除组；移至 Ungrouped；Tag 编辑和批量替换；真实启用状态及禁用灰显；启用/禁用（全局或 Workspace）、更新；原生详情入口；外部安装/卸载只读同步；本地保存；Dashboard 的统计、卡片、搜索、筛选和操作。

### P1/P2：后续范围

- P1：收藏、自定义图标、Settings Sync、批量启停、自选其他 Profile 或未连接 Remote 管理。
- P2：规则分类、Smart Groups、AI 分类、Extension Pack/工作区推荐生成、使用统计和未使用检测。分类建议接受后也只能产生唯一归属。

### 非目标

不自建 Marketplace、不自己下载更新包或解析依赖、不修改 VS Code 私有数据库、不自动改 Profile 或自动更新设置、不提供云账号；本插件不提供卸载入口，对 VS Code 外部安装/卸载只做只读同步。分组和 Tag 数据本地保存；Marketplace 查询与管理按原生流程使用网络。不把项目自身账号或遥测作为使用前提。

## 界面公共约束

原生 Explorer TreeView 承载分组导航与拖动；编辑器 Webview 承载紧凑卡片 Dashboard。Dashboard 不创建网页侧边栏，不使用表格列表、宣传式标题或副标题。鼠标为主，键盘导航仅辅助。

| 位置/动作 | 交互 |
| --- | --- |
| 组标题 | 点击展开/折叠；右键重命名、删除和添加扩展；拖动标题排序 |
| 原生扩展行 / Dashboard 卡片 | 点击选中；可见详情按钮或右键打开原生详情；右键提供 Move to Group、Move to Ungrouped、Edit Tags、Enable/Disable、Update、Copy ID |
| 插件拖放 | 从当前组拖到目标组即移动；拖到 Ungrouped 即解除归属；悬停提示 Move to… 并突出目标 |
| 批量整理 | Dashboard 卡片复选框支持纯鼠标多选并点击 Move to Group 或 Set Tags；拖动选中集合在原生 TreeView 内完成 |
| 标题工具栏 | Create Group、Refresh、Open Dashboard；其他动作置于可点击更多菜单 |
| 名称/搜索输入 | 输入文本仍可使用键盘，但不要求快捷键、命令面板或 Shell 命令 |

“键盘操作”仅指可选的 Tab 切换焦点、方向键浏览、Enter 确认和快捷菜单等辅助访问，不是主要工作流。保留基础可访问性，不以键盘路径替代鼠标入口。

## 公共集成规则

“与 Marketplace 同步”在本产品中包含：跟随 VS Code 已安装列表与启用状态、读取原生更新结果、从本插件发起原生管理操作，并同步用户在原生界面进行的修改。不是把本地分组上传到 Marketplace，也不是重新实现市场。

### 7.1 调用原则

优先公开命令和可支持的 VS Code 原生接口，统一经 ExtensionManagementAdapter 调用。直接调用不具备稳定能力时，提供明确标识的 Open in VS Code 操作，定位到目标扩展，由用户在原生界面完成；不能把“跳到详情页”记录成“已禁用/已更新”。

原生操作必须最终能完成用户需要的管理流程；清单与真实状态读取仍需独立满足 F01/F15。若无可维护途径完成，记录技术阻塞并回报，不静默把功能降级到 P1。

不读取或修改 VS Code 私有数据库来强制状态；不复制依赖解析、下载或安装器。不随意使用当前 Shell 中的 code 命令，因为它可能指向错误版本、Profile 或宿主。CLI 仅作为经过目标校验的原生补充方案。

### 7.2 操作反馈

1. 确定 Extension ID、安装目标及操作范围；有多个实例时先以鼠标选择目标。
2. 根据真实能力展示 Enable/Disable 或 Update；未知状态允许重新同步或进入原生管理，不猜测。
3. 调用原生操作，显示处理中并阻止同一实例的冲突重复操作。
4. 保留原生启停范围、依赖/策略提示和重启要求；更新跟随原生网络/渠道/兼容行为，不擅自改自动更新设置。
5. 从原生状态重新读取结果后同步 TreeView 与 Dashboard；需要重启时显示待生效，不能假报立即生效。
6. 取消、权限失败、网络失败保持可解释的现状并提供重试；不清除分组。

侧边栏聚合行发起管理时：单实例可直接定位；多实例先弹出可用鼠标点击的目标列表，列出 Local/Remote、版本和状态，再选择全局或 Workspace 范围。取消任一步均不执行动作。Dashboard 已选定实例时沿用该目标；仅选中聚合行时使用相同目标选择流程。

### 7.3 已核对与待验证

官方文档列出了扩展搜索及相关原生命令；本插件只调用经过目标版本验证的启停和更新入口。[Built-in Commands](https://code.visualstudio.com/api/references/commands)

原生扩展页提供已安装列表及启停、更新流程；本产品复用这些流程。VS Code 外部安装或卸载的变化只作为只读同步来源。[Extension Marketplace](https://code.visualstudio.com/docs/configure/extensions/extension-marketplace)

公开 Extension 对象的 isActive 代表已激活，不能当成 enabled；标准类型中没有可直接使用的统一 enable/disable 成对方法。完整清单、真实启用状态与更新可用性仍需 M0 实测数据通路。[VS Code 类型定义](https://github.com/microsoft/vscode/blob/main/src/vscode-dts/vscode.d.ts)

CLI 公开提供清单、版本、安装与更新能力，但不能由此假设获得完整的启用状态或正确 Remote 目标；本插件不把 CLI 当作卸载入口。[Command Line Interface](https://code.visualstudio.com/docs/configure/command-line)

以上是文档核对，不是运行验证，也不是“一套 Marketplace 接口已经全部可用”的结论。

## 质量目标

建议 TypeScript 扩展宿主 + 原生 TreeView + 编辑器 Webview Dashboard。Dashboard 可采用 React（TypeScript）+ Vite，在 VS Code 内运行，不另设 Web 后端。这里解除初稿对正式 Webview 的全面排除；原生侧边栏仍保留。

models 定义唯一归属、安装实例和 Tag；services 提供分组/标签/安装清单/状态同步；adapters 封装原生管理；views 提供树；dashboard 提供概览和卡片。两种 UI 只发送经过校验的动作，不直接写持久化或执行任意命令。

| 类别 | 要求 |
| --- | --- |
| 性能 | 100 个唯一 ID、最多 150 个安装实例、20 个组、最多 100 个 assignments；预热展开数据准备 p95<100 ms（30 次）；分组操作反馈目标<200 ms；本地快照就绪后 Dashboard 首屏目标<1 s；网络管理耗时单独呈现 |
| 同步 | 管理操作/原生变更后自动同步；收到可用状态通知后两种视图更新目标<2 s；漏事件需在面板重新聚焦及手动刷新时重读；后台更新状态也需验证 |
| 鼠标 | 核心整理和管理流程不依赖快捷键；拖放有目标提示；灰色禁用卡片/树节点仍可操作；名称和搜索可以输入文本 |
| 主题 | Light/Dark/High Contrast，清晰 Disabled/Unknown/Mixed/Restart Required 标识，保持文本对比度 |
| 数据 | 分组操作和安装操作分离；失败不部分保存；不主动激活其他扩展；保留最后有效清单并标注过期 |
| Webview | 限制脚本与资源来源；消息白名单并校验 ID/目标/操作；显示名、描述和 Tag 按文本渲染，不执行传入内容 |
| 平台 | Windows 优先；发布前验证 macOS/Linux 和 WSL/SSH 当前连接场景；未测试平台不得宣称已通过 |

## 交付门槛

P0 完成要求当前 F01–F09、F11–F13、F15–F17 和 A01–A11、A15–A25 有实现与验证证据；已撤销的 F10、F14 和 A12、A13、A14 不计入当前验收。Dashboard 必须可运行，所有已安装条目可见是硬性验收，不因公开 API 不足而自动缩减。原生流程委托允许增加明确的原生页面操作步骤，但必须真正完成启停或更新流程并同步结果。

M0 必须验证：完整清单（含禁用、内置、VSIX、Local/Remote）、真实启用状态、更新状态、原生命令的目标/参数/兼容性、TreeView 灰显能力、Profile/多窗口持久化。接口不足需给出可维护方案或报告阻塞，不将功能静默改为“以后再做”。

待确定的实现细节：最低 VS Code 版本、安装目标标识与宿主放置、同步事件/刷新方案、Tag 编辑界面细节、发布名称与授权。当前管理范围、Dashboard 布局与计数是工作默认值，后续可依据体验评审调整。

执行清单见 [TODO](../TODO.md)，阶段安排见 [Roadmap](../Roadmap.md)。版本号、CHANGELOG、Git 提交与发布仍按用户明确授权执行。

## 数据契约与 Demo 边界

正式本地配置中的 assignments 和 tags 由 [PRD-009](009-persistence.md) 唯一定义。0.1.0 的 DemoState 与正式配置不同，旧 Demo 缺少 tags 时的补全规则见 [PRD-017](017-tags.md) 和 [Demo 说明](../note/demo-implementation.md)。原生拖放处理逻辑已有测试，真实鼠标拖动手势仍待确认。
