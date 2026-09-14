# PRD-003：搜索与状态筛选

模块编号：PRD-003  |  需求编号：F03  |  优先级：P0

状态：正式产品需求；0.1.0 为示例数据 Demo，不能等同于本模块已验收。

[总览与索引](000-overview.md) · [当前待办](../TODO.md)

## 1. 目标与需求

| 编号 | 功能 | 必须满足的行为 |
| --- | --- | --- |
| F03 | 全量/状态视图 | All Installed、Enabled、Disabled、Updates 及 Built-in/User Installed 为 Dashboard 筛选；搜索覆盖名称、ID、publisher 和 Tag；没有额外归属；计数遵循 [PRD-016](016-dashboard.md) |

## 2. 规则与交互

搜索匹配名称、ID、publisher 和 Tag；组、状态、安装目标、Built-in/User Installed 及 Tag 筛选可以组合。多个 Tag 的交集语义、Tag 规范化和编辑规则由 [PRD-017](017-tags.md) 定义。Clear Filters 清除筛选，恢复当前管理范围全部条目。筛选不创建分组或改变归属，统计口径由 PRD-016 定义。

## 3. 模块依赖

- [PRD-001：全量安装清单](001-installed-inventory.md)
- [PRD-012：启用、禁用与状态展示](012-enable-disable.md)
- [PRD-013：扩展更新](013-updates.md)
- [PRD-016：紧凑卡片 Dashboard](016-dashboard.md)
- [PRD-017：插件 Tag](017-tags.md)

## 4. 验收条件

以下保留原 A 编号，本文件是这些案例的主定义。

| 编号 | 场景 | 预期 |
| --- | --- | --- |
| A18 | Dashboard 点击各统计项、搜索、清除筛选 | 卡片集合正确变化，可回到完整清单；系统筛选不新增归属 |

关联案例（主定义位于对应模块）：
- [A01 · PRD-001](001-installed-inventory.md#4-验收条件)
- [A20 · PRD-012](012-enable-disable.md#4-验收条件)

## 5. 范围与证据边界

遵循 [PRD-000 的公共约束](000-overview.md#公共集成规则)。实现、测试和剩余阻塞统一记录在 TODO，本文件不另建执行清单。
