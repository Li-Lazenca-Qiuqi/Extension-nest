# PRD-016：紧凑卡片 Dashboard

> 已于 2026-09-17 归档，仅供历史追溯。下文“当前/正式需求”等表述属于归档时点；当前范围见 [PRODUCT](../../PRODUCT.md)，全部未完成任务与验收条件见 [TODO](../../TODO.md)。

更新日期：2026-09-16。正式需求，当前 Demo 不代表已验收。

[总览](000-overview.md) · [活动清单](../../TODO.md) · [范围决策](../../decisions/004-public-vsix-discovery.md)

## 1. 目标与需求

F16：已知记录驱动 Group 分区与准确计数，同一面板重复打开只聚焦。包括历史不可见项，不能只显示本次发现数组。

## 2. 规则与交互

保留默认展开分组、空组、Ungrouped 最后、单/双栏、面板宽度不超过 760px 时单栏回退、全部展开收起、组色线、Ctrl/Command 多选与拖动插入。无网页侧边栏、复选框、Move 弹窗或自建 Details。

| 区域 | 内容 |
| --- | --- |
| 顶栏 | Local host 范围、Refresh、通用原生 Extensions 入口、最近成功观测时间；未取得真实 Profile 名称时不伪造 |
| 统计 | All、Visible、Not found、Ungrouped，按唯一已知 ID |
| 卡片 | 图标/名称/publisher、Tag、版本观测、管理组织元数据菜单；本次未发现的记录统一标 Not found，正常卡片不标 Visible |
| 搜索 | Group、可见性、Tag 与关键词，无启停/更新/目标筛选 |
| 反馈 | Loading/Ready/Stale/Error、重试和缓存时间；不提示安装或更新成功 |

NotVisible 可弱化但可选、可拖动、可编辑，不能复用 Disabled 含义；Tooltip 说明可能禁用/卸载/宿主变化，原因未知。可见项显示本次版本；历史版本标 Last seen version，缺元数据用 ID 与图标占位。Dashboard 默认 Visible，通过 All 或 Not found 查看保留记录；原生树明确选择组时展示该组全部记录。默认 Visible 不应使空组及其拖放入口消失。

统计以未施加搜索/筛选的本上下文全部已知记录计算并明确此口径：All = Visible + Not found，Ungrouped 为 All 中无归属子集，不相加到总数。分区标题显示当前筛选后的匹配数量，筛选不会改归属。快照过期时标记统计也是上次观测，不能把缓存数称为当前启用数或安装数。

不展示 Enabled/Disabled、Updates、可用版本、更新箭头、自动查询、启停按钮、Mixed、Restart Required；原有 Demo 相关 UI 的删除列入 TODO，文档改完不代表已删除。

## 4. 验收条件

A22：三种主题、键盘辅助与鼠标主流程验证；不可见标记非仅颜色、条目仍可整理。

A30：空清单、历史项、未核验项、重新出现、失败、筛选组合的唯一 ID 计数满足上述公式；不以 Installed/Enabled 命名观测数量。

2026-09-17：用户界面合并原 NotVisible 与 Unverified，统一为 Not found（本次未发现）；树、卡片、统计和筛选口径一致，不显示来源区别。正常卡片不再显示 Visible 标签。后台保留是否存在真实发现证据，防止旧占位伪造版本/时间；旧记录清理的删除范围不因文案合并扩大到真实发现历史。

2026-09-17：Dashboard 默认打开 Visible 筛选，仅展示本次发现的插件；用户仍可点击 All 或 Not found 查看保留记录。原生树明确选择分组时查看该组全部记录。
