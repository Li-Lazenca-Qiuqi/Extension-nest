# PRD-000：产品总览与模块索引

更新日期：2026-09-16。普通 VSIX 扩展整理器；当前代码版本 0.2.0，publisher Lazenca，仍处于 Demo 向正式数据接入阶段。当前范围以 [决策 004](../decisions/004-public-vsix-discovery.md) 为准。

## 产品目标

在本地扩展宿主自动发现公开 API 可见的扩展，将当前可见项与本上下文保存的历史记录统一用于分组、标签、搜索和排序。未激活不等于不可见；不主动激活其他扩展。此前发现后不可见的插件留在原组并标 NotVisible，不能解释为已禁用或已卸载。

## 模块索引

| 模块 | 需求 | 主验收 |
| --- | --- | --- |
| [001 自动发现与历史记录](001-installed-inventory.md) | F01 | A01、A21、A26、A27 |
| [002 原生分组树](002-native-group-tree.md) | F02 | PRD-002-AC01/02 |
| [003 搜索与可见性筛选](003-search-and-filters.md) | F03 | A18 |
| [004 分组管理](004-group-management.md) | F04 | A05、A06 |
| [005 唯一归属](005-single-group-assignment.md) | F05 | A02、A04 |
| [006 拖放](006-extension-drag-drop.md) | F06 | A03、A17 |
| [007 排序](007-group-ordering.md) | F07 | A16 |
| [008 原生导航](008-native-details.md) | F08 | A23 |
| [009 组织与发现缓存](009-persistence.md) | F09 | A15、A29 |
| [011 空状态](011-onboarding.md) | F11 | PRD-011-AC01/02 |
| [015 发现同步](015-state-sync.md) | F15 | A09、A19、A24、A28 |
| [016 Dashboard](016-dashboard.md) | F16 | A22、A30 |
| [017 Tag](017-tags.md) | F17 | A25 |

共 13 个活动模块。[010](010-import-export.md)、[012](012-enable-disable.md)、[013](013-updates.md)、[014](014-uninstall.md) 是撤销占位，不恢复、不复用编号。A07/A08/A10–A14/A20 撤销；A01–A06、A09、A15–A19、A21–A25 按本轮新范围修订，旧定义见 Git 681f655，不代表旧条件通过。

## 公共范围

- 当前范围是本地 UI 宿主在当前上下文可见的注册表，不是完整安装数据库或全部已启用插件。Remote/Web 宿主不聚合。
- Extension ID 规范化为小写 publisher.name，每个 ID 至多一个 Group；其余为 Ungrouped。Tag 独立且多选 AND。
- 已知记录集合为当前可见项、本上下文可信发现历史及保留的旧组织 ID 的并集，不能跨 Profile 合并。未曾发现的禁用项不会自动生成。
- Visible/NotVisible/Unverified 是观测标记，不是启停状态。Freshness 独立表示加载、就绪、过期或错误。定义和状态转换由 PRD-001/015 唯一规定。
- 不提供启停、更新、卸载、导入导出。不查询 Gallery 更新；不修改自动更新设置，不读取私有数据库，不要求核心改造或 CLI。

## 界面公共约束

原生 TreeView 加编辑器 Webview，不创建网页侧边栏。Dashboard 默认分组展开、空组可见、Ungrouped 置后；支持单/双栏、全部展开收起。卡片单击单选，Ctrl/Command 追加选择；移组仅拖动，不恢复复选框、Move 弹窗、自建 Details 或创建组引导。保留组抓手、插入线、卡片原尺寸 0.82 透明预览和按钮隔离。

点击图标或标题导航到原生扩展页，Copy ID 复制完整 ID。NotVisible 使用文本/图标标记，可弱化视觉但不沿用 Disabled 图标语义；始终可以整理。统计按唯一已知 ID，详细口径见 PRD-016，不展示 Enabled/Disabled/Updates。

## 公共集成规则

UI 只发送校验后的整理动作；发现服务、历史缓存、组织仓库、同步协调器和视图投影分层。公开发现读取成功后才发布同一份树与 Dashboard 快照；写入失败、读取失败和上下文变化不得造成丢记录。

当前 API 不给完整实时 Profile 身份：使用经实测的当前 Profile 存储命名空间和会话 generation，切换时重新初始化，不伪造 Profile 名称/ID。globalState 隔离不是 globalStorageUri 隔离；跨窗口不能只靠 Promise 队列或 revision 声称 CAS。具体方案仍需验收。

原生导航返回 Opened/Cancelled/Failed 等明确结果，命令 Promise 完成不表示安装、启停或更新成功。返回面板只触发可见性补读，不推断用户做过什么。

## 质量与交付

100 个已知唯一 ID（含历史项）、20 组，30 次预热数据准备 p95<100 ms；整理反馈<200 ms，缓存就绪后首屏<1 s。可用发现通知后的视图刷新目标<2 s；不承诺捕获所有原生管理事件。Light/Dark/High Contrast 标记可读、非仅颜色表达；鼠标主流程和键盘辅助均验证。

Windows 优先，其他平台未测试明确限制；Remote 窗口的本地宿主放置需验证，远端聚合不是验收门槛。Webview CSP、资源路径、消息/ID/拖放校验必须通过。正式入口不加载 seed 或模拟管理，支持损坏恢复、Profile 隔离与不丢写的多窗口策略。

[TODO](../TODO.md) 是唯一活动清单；历史调查保留证据但旧完整管理 M0 不再阻塞新范围。README 不在本轮维护，版本、CHANGELOG、提交和发布不自动执行。
