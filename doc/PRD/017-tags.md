# PRD-017：插件 Tag

模块编号：PRD-017  |  需求编号：F17  |  优先级：P0

更新日期：2026-09-16。正式需求，以[普通 VSIX 决策](../decisions/004-public-vsix-discovery.md)为准；当前 Demo 不代表验收。

[总览与索引](000-overview.md) · [当前待办](../TODO.md)

## 1. 目标与需求

| 编号 | 功能 | 必须满足的行为 |
| --- | --- | --- |
| F17 | 插件 Tag | 每个扩展保存 `tags: string[]`；Tag 独立于唯一 Group，只用于搜索和筛选；支持单个编辑和批量明确替换 |

## 2. Tag 数据规则

Tag 是扩展自身的可选标签，不是分组的别名，也不创建层级或归属关系。一个扩展可以有多个 Tag，但一个 Extension ID 仍至多属于一个自定义 Group；Tag 数量不会改变 Group 归属。

保存前统一规范化：去除每个 Tag 首尾空白，忽略空字符串，按大小写不敏感规则去重，并保留第一次出现的文本形式。单个 Tag 最多 30 个 Unicode 字符；每个扩展最多 10 个 Tag。超过长度或数量上限时拒绝本次变更并说明原因，不截断、不部分保存。

`tags` 必须是字符串数组。读取旧 Demo 状态时如果扩展没有 `tags` 字段，补为 `[]` 并保留其原 `groupId`；迁移不能借 Tag 改变或清空原有分组。非法 Tag 数据进入可解释的错误状态，不以静默丢弃代替校验。

## 3. 搜索、筛选与编辑

搜索文本匹配扩展名称、Extension ID、publisher 以及 Tag 文本，大小写不敏感。选择多个 Tag 时使用 AND：结果必须同时含有所有选中的 Tag。Tag 条件与 Group、Visible/NotVisible/Unverified及搜索文本条件取交集；清除筛选后恢复当前上下文的全部已知记录。任何筛选都不写入 Group 或 Tag 数据。

Dashboard 卡片显示当前 Tag，并提供鼠标可点击的编辑入口。单个扩展编辑可以添加和删除 Tag；提交后只修改该扩展的 Tag，保留唯一 Group 和发现历史。取消或校验失败不改变原数组。

Dashboard 使用 Ctrl/Command 点击批量选择，不提供复选框。批量设置 Tag 必须先明确显示目标扩展数量和将要写入的完整数组；提交采用替换语义，不追加、不合并旧 Tag。一次批量操作成功或失败，不能留下部分扩展已更新的状态。拖动扩展到其他 Group 或 Ungrouped 只改变 Group 归属，不改变 Tag。

## 4. 模块依赖

- [PRD-003：搜索与可见性筛选](003-search-and-filters.md)
- [PRD-005：单组归属与批量移动](005-single-group-assignment.md)
- [PRD-006：插件拖放](006-extension-drag-drop.md)
- [PRD-009：本地状态与恢复](009-persistence.md)
- [PRD-016：Dashboard](016-dashboard.md)

## 5. 验收条件

以下保留新的 A 编号，本文件是 A25 的主定义；本模块没有复用已撤销的 A12、A13 或 A14。

| 编号 | 场景 | 预期 |
| --- | --- | --- |
| A25 | 对一个扩展编辑含空白、大小写重复和多个 Tag，执行多 Tag 筛选、单个编辑、批量设置，并将该扩展拖到另一组 | Tag 首尾空白被去除、大小写重复只保留一项；多个 Tag 使用 AND，并与 Group、可见性和搜索文本取交集；批量设置明确替换完整数组；拖动只改变唯一 Group，不改变 Tag；超过 30 字符或 10 项时整次操作拒绝且原状态不变；旧 Demo 缺少 `tags` 时补为 `[]` 并保留原 `groupId` |

关联案例（主定义位于对应模块）：
- [A18 · PRD-003](003-search-and-filters.md#4-验收条件)
- [A03 · PRD-006](006-extension-drag-drop.md#4-验收条件)
- [A15 · PRD-009](009-persistence.md#4-验收条件)
- [A22 · PRD-016](016-dashboard.md#4-验收条件)

## 6. 范围与证据边界

遵循 [PRD-000 的公共约束](000-overview.md#公共集成规则)。实现、测试和剩余阻塞统一记录在 TODO，本文件不另建执行清单。当前 Demo 中的字段或示例数据不能作为 Tag 编辑、筛选或迁移已经完成的证据。


当前可见、历史不可见与未核验记录使用相同的组织规则；消失/重现不改变 Group、Tag 或保存顺序。标记定义见 [PRD-001](001-installed-inventory.md)，数据新鲜度独立处理。
