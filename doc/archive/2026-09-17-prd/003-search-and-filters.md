# PRD-003：搜索与可见性筛选

> 已于 2026-09-17 归档，仅供历史追溯。下文“当前/正式需求”等表述属于归档时点；当前范围见 [PRODUCT](../../PRODUCT.md)，全部未完成任务与验收条件见 [TODO](../../TODO.md)。

更新日期：2026-09-16。正式需求，当前 Demo 不代表已验收。

[总览](000-overview.md) · [活动清单](../../TODO.md) · [范围决策](../../decisions/004-public-vsix-discovery.md)

## 1. 目标与需求

F03：搜索名称、ID、publisher、Tag；Group、可见性和多个 Tag AND 取交集。

## 2. 规则与交互

统计入口 All、Visible、Not found、Ungrouped 互斥选中。All 清空所有筛选并恢复本上下文已知记录；不把 All 称为 All Installed。搜索大小写不敏感，历史记录按缓存名称/ID 搜索。无可靠类型来源前不提供 Built-in/User Installed 筛选，不以路径猜类型。无启停、更新或安装目标筛选。统计遵循 PRD-016，不修改元数据。

## 4. 验收条件

A18：搜索、Group、多 Tag、可见性组合正确，All 清空条件恢复全部已知记录；历史项可找到，不改变归属。

2026-09-17：用户界面合并原 NotVisible 与 Unverified，统一为 Not found（本次未发现）；树、卡片、统计和筛选口径一致，不显示来源区别。正常卡片不再显示 Visible 标签。后台保留是否存在真实发现证据，防止旧占位伪造版本/时间；旧记录清理的删除范围不因文案合并扩大到真实发现历史。
