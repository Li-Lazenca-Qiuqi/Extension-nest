# PRD-002：原生分组树

模块编号：PRD-002  |  需求编号：F02  |  优先级：P0

状态：正式产品需求；0.1.0 为示例数据 Demo，不能等同于本模块已验收。

[总览与索引](000-overview.md) · [当前待办](../TODO.md)

## 1. 目标与需求

| 编号 | 功能 | 必须满足的行为 |
| --- | --- | --- |
| F02 | 分组树 | 自定义组与 Ungrouped 互斥覆盖全部已安装 ID；一个 ID 一行；支持原生展开折叠并尽量保留刷新前位置 |

## 2. 规则与交互

分组视图放在 VS Code 原生 Explorer 侧边栏，不再自建网页侧边栏。树中仅有用户组与 Ungrouped，每个 ID 只显示一次；点击组筛选编辑器 Dashboard。刷新尽量保持展开、选中与滚动位置。

- **侧边栏**：VS Code 原生 Explorer 中的 Extension Nest，原生 TreeView 显示自定义组和 Ungrouped；扩展在分组树中只显示一次。
- **Dashboard**：点击侧边栏标题上的 Open Dashboard，在编辑器区域打开独立面板；已有面板再次点击时聚焦，不创建多个互相失步的实例。用户明确要求直接接入 VS Code，不得在 Webview 中再制作网页侧边栏或模拟 VS Code 外壳。
- 侧边栏不额外挂一个重复的 All Installed 分组树；全量清单和状态查询集中到 Dashboard，避免看起来同一插件属于多个组。

## 3. 模块依赖

- [PRD-001：全量安装清单](001-installed-inventory.md)
- [PRD-004：分组管理](004-group-management.md)
- [PRD-005：单组归属与批量移动](005-single-group-assignment.md)
- [PRD-006：插件拖放](006-extension-drag-drop.md)
- [PRD-007：分组排序](007-group-ordering.md)
- [PRD-016：紧凑卡片 Dashboard](016-dashboard.md)

## 4. 验收条件


关联案例（主定义位于对应模块）：
- [A01 · PRD-001](001-installed-inventory.md#4-验收条件)
- [A19 · PRD-015](015-state-sync.md#4-验收条件)
- [A22 · PRD-016](016-dashboard.md#4-验收条件)
- PRD-002-AC01：自定义组和 Ungrouped 互斥覆盖全部已安装 ID，同 ID 不重复建树叶子。
- PRD-002-AC02：点击原生组后，Dashboard 切换对应组；刷新保留原生树展开状态。

## 5. 范围与证据边界

遵循 [PRD-000 的公共约束](000-overview.md#公共集成规则)。实现、测试和剩余阻塞统一记录在 TODO，本文件不另建执行清单。
