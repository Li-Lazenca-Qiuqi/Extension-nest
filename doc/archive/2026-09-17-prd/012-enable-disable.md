# PRD-012：启用与禁用（已撤销）

> 已于 2026-09-17 归档，仅供历史追溯。下文“当前/正式需求”等表述属于归档时点；当前范围见 [PRODUCT](../../PRODUCT.md)，全部未完成任务与验收条件见 [TODO](../../TODO.md)。

2026-09-16 用户明确选择普通 VSIX 整理器，撤销 F12、A07、A08、A20，编号不复用。旧定义见 Git 681f655。

不再实现相关按钮、统计、筛选、查询、状态、管理动作或待重启提示。不是后端待补齐项，也不作为首版门槛。历史条目的 NotVisible 属于 [PRD-001](001-installed-inventory.md)，不得恢复为 Disabled 标记。

保留 [PRD-008](008-native-details.md) 的通用原生页导航，用户在原生页面自行管理，不由 Nest 读取或宣告操作结果。

[当前决策](../../decisions/004-public-vsix-discovery.md) · [总览](000-overview.md)
