# 当前待办

更新日期：2026-09-14。此文件是唯一活动执行清单。实现状态不能由 PRD 完成推断。

现有能力与限制见 [PRODUCT](PRODUCT.md)；14 项已完成记录见 [历史归档](archive/2026-09-14-memory-maintenance.md)。版本、提交和发布授权规则见根目录 AGENTS.md，不作为待办项。

## 产品决策

- [ ] 确认发布名称、publisher、License 和最低 VS Code 版本。

## M0：实现前验证

### Demo 验证缺口

- [ ] 在真实 VS Code 中人工确认拖动手势：自动化工具未触发拖放回调，控制器逻辑测试已通过。
- [ ] 补齐批量 Tag 编辑的鼠标端到端验证，以及不同平台的验证。旧 Demo 标签补全已通过本轮测试。

### 正式 API 与数据通路

- [ ] 验证完整清单：与原生安装列表逐 ID/目标对照，覆盖禁用、未激活、内置、VSIX、Local 和当前 Remote。
- [ ] 验证真实启用状态、Workspace/全局范围、受限原因及重启待生效状态。
- [ ] 验证更新查询、版本和自动更新后的同步，不以网络失败推断无更新。
- [ ] 验证详情、启停、更新原生入口，以及 VS Code 外部安装/卸载的只读同步；记录直接调用/原生页面委托的命令、目标参数和最低版本。
- [ ] 验证 TreeView 灰显可用方式，确定与 Dashboard 一致的 Disabled/Unknown/Mixed 表达。
- [ ] 验证 Profile/Remote 的宿主选择、globalState 隔离和多窗口冲突处理。
- [ ] 验证外部原生操作的事件与同步通路；未覆盖事件提供重新聚焦/手动刷新恢复。
- [ ] 固定 Dashboard 鼠标布局、实例/ID 计数标签和 Tag 编辑/筛选交互等工作细节。

## M1–M4：P0 实现

- [ ] 将现有 Demo 宿主与共享状态服务接入正式原生管理适配层；保留 TreeView 与 Dashboard 共用状态。
- [ ] 实现 [PRD-001](PRD/001-installed-inventory.md)、[PRD-002](PRD/002-native-group-tree.md)、[PRD-003](PRD/003-search-and-filters.md)：完整安装清单、原生分组树与查询筛选。
- [ ] 实现 [PRD-004](PRD/004-group-management.md)、[PRD-005](PRD/005-single-group-assignment.md)、[PRD-006](PRD/006-extension-drag-drop.md)、[PRD-007](PRD/007-group-ordering.md)：分组、唯一归属、拖动和排序。
- [ ] 实现 [PRD-008](PRD/008-native-details.md)、[PRD-009](PRD/009-persistence.md)、[PRD-011](PRD/011-onboarding.md)：详情、本地保存、旧 Demo 状态补全与引导。
- [ ] 实现 [PRD-012](PRD/012-enable-disable.md)、[PRD-013](PRD/013-updates.md)：原生启停、更新及结果反馈；外部安装/卸载只读同步归入 PRD-015。
- [ ] 实现 [PRD-015](PRD/015-state-sync.md)：原生外部修改与两种界面状态同步。
- [ ] 实现 [PRD-016](PRD/016-dashboard.md)：紧凑卡片 Dashboard、统计、筛选和管理入口。
- [ ] 实现 [PRD-017](PRD/017-tags.md)：在真实扩展数据上验收 Tag 编辑、批量替换及搜索筛选；Demo 已实现。
- [ ] 完成当前 A01–A11、A15–A25 和性能、主题、平台测试并记录证据；撤销的 A12–A14 不计入验收；全量清单不完整不能判通过。

## M5：交付准备

- [ ] 补齐真实安装、使用、原生流程委托与故障排查说明。
- [ ] 确定发布标识与授权，准备图标、安装包和安装验证。

P1/P2 方向见 [路线图](Roadmap.md)。交互 Demo 已可在 VS Code 中运行，但正式宿主仍只操作示例数据；真实扩展管理、外部变化只读同步和全量清单仍未接入。Tag Demo 能力以 PRODUCT 和 Demo 说明中的已验证范围为准。验证边界见 [Demo 说明](note/demo-implementation.md)。

PRD-010 与 PRD-014 仅保留撤销编号占位，避免旧链接失效；不属于待实现功能。已确认的 3 个多余文件已移入回收站。
