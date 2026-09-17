# PRD-009：本地状态与恢复

模块编号：PRD-009  |  需求编号：F09  |  优先级：P0

更新日期：2026-09-16。正式需求；组织仓库和发现缓存已接入，未验收项见 TODO。

[总览与索引](000-overview.md) · [当前待办](../TODO.md)

## 1. 目标与需求

| 编号 | 功能 | 必须满足的行为 |
| --- | --- | --- |
| F09 | 本地状态 | 保存唯一分组、顺序和 Tag；读取损坏或写入失败不以空状态覆盖；重启和普通 Workspace 切换不丢状态 |

## 2. 规则与交互

正式本地配置由本模块定义，使用 `schemaVersion=1`、`groups`、`assignments` 和 `tags`，建议 globalState key 为 `extensionNest.state`。普通 Workspace 切换与重启不丢数据；当前 Profile 上下文隔离、多窗口冲突必须实测。读取损坏、未知格式或保存失败时保留原有效数据，提供重试/恢复入口，不能用空状态覆盖。公开发现的变化不修改归属或 Tag，不由本地配置触发安装管理动作。不承诺跨机器同步。

本地配置的最小结构如下：

```json
{
  "schemaVersion": 1,
  "groups": [
    { "id": "g-python", "name": "Python & Data", "color": "#2563EB", "order": 0 }
  ],
  "assignments": {
    "ms-python.python": "g-python"
  },
  "tags": {
    "ms-python.python": ["Python", "Research"]
  },
  "extensionOrder": ["ms-python.python"]
}
```

`assignments` 的值只能是一个有效 Group ID；缺少 Extension ID 表示 Ungrouped。`tags` 的值必须是该扩展的字符串数组，缺少 Tag 项表示 `[]`。Tag 的规范化和数量限制遵循 [PRD-017](017-tags.md)，组织配置不保存动态版本、启用状态或更新结果；最后观测元数据放在独立发现缓存中。

组 `color` 为六位十六进制颜色；`order` 为唯一非负安全整数，按升序显示，改名不改变 ID、颜色或顺序。`extensionOrder` 是去重后的规范化 Extension ID 数组，按当前分组过滤后得到组内卡片顺序，Ungrouped 同样适用。新发现而未记录顺序的 ID 由展示层追加，不得因刷新或暂不可见而清除已有顺序、归属或标签。规范化 ID 转小写；同一映射中存在仅大小写不同的重复 ID 时拒绝整个配置，不能静默覆盖。

当前实现通过严格解析器、组织仓库与独立缓存接入宿主。迁移只能接收实际保存过的 Demo 值，不把 seed 当作用户配置；仅提取组、归属、标签和顺序，不迁移安装记录。读到缺失配置与非法配置使用不同结果，非法值不返回默认数据。正式存储与 Refresh 重试已接入；非法数据不会自动删除，修复交互和完整 Profile/多窗口验收仍待完成。

旧 Demo 状态中的扩展记录若缺少 `tags`，读取时自动补为 `[]`，原 `groupId` 原样保留；补全过程不能把一个扩展移入其他组或 Ungrouped。迁移失败时保留原有效状态并提示恢复。

## 3. 模块依赖

- [PRD-005：单组归属与批量移动](005-single-group-assignment.md)
- [PRD-017：插件 Tag](017-tags.md)
- [PRD-015：状态同步与并发](015-state-sync.md)

## 4. 验收条件

以下保留原 A 编号，本文件是这些案例的主定义。

| 编号 | 场景 | 预期 |
| --- | --- | --- |
| A15 | 持久化失败、批量移动或 Tag 更新失败 | 回到原有效状态，无重复、丢失或半完成关系；原 Group 和 Tag 均保持一致 |

关联案例（主定义位于对应模块）：
- [A02 · PRD-005](005-single-group-assignment.md#4-验收条件)
- [A25 · PRD-017](017-tags.md#5-验收条件)
- [A24 · PRD-015](015-state-sync.md#4-验收条件)

## 5. 范围与证据边界

遵循 [PRD-000 的公共约束](000-overview.md#公共集成规则)。实现、测试和剩余阻塞统一记录在 TODO，本文件不另建执行清单。


## 6. 发现历史缓存

组织配置 extensionNest.state 保持 schemaVersion=1 的 groups/assignments/tags/extensionOrder。另建同一 Profile 存储命名空间的 extensionNest.discovery（schemaVersion=1），不能混成 Demo 全快照。

每个规范化 ID 的真实发现记录保存 firstSeenAt、lastSeenAt（UTC ISO 8601）、lastSeenMetadata（name/publisher/version 及可选图标缓存引用），以及 source=public-local-host。时间只在真实成功发现该 ID 时产生/推进；历史版本不是当前已安装版本。不保存 enabled、更新候选、推测禁用原因、原生管理结果或任意可执行内容。

Visible/NotVisible 由当前会话成功快照与历史集合推导，磁盘缓存不能直接证明当前可见性。启动尚未成功读取时显示 Unverified/过期缓存；缺失记录不删除。首次成功观测当前可见项持久化后才能成为可信发现历史；写入失败保留上次有效状态并提示重试。

旧 Demo 迁移仅保留组织关系，不使用 seed 的名称/版本制造真实历史，不伪造 lastSeenAt。只有组织 ID 但无可信发现记录的占位标 Unverified，仍可整理；真正发现后升级为 Visible，再次缺失才成为 NotVisible。发现缓存损坏需独立报错恢复，不能静默清空历史或破坏正常组织配置。

Profile 切换分别加载当前命名空间的组织与发现数据；普通 Workspace 切换保持组织数据。globalState 隔离不能推出 globalStorageUri 隔离，不能把同一目录当 Profile ID。自有文件存储如需采用必须另行证明隔离；多窗口写入遵循 PRD-015 的实际冲突控制方案。

A29：旧 Demo、缺 tags、仅组织 ID、缓存损坏、写失败与重启验证；没有真实观测的旧项不伪装曾发现，原分组/Tag/顺序保留，合法历史不可见项重启后仍可展示。

## 未核验记录清理（2026-09-17）

Dashboard 顶部提供带数量的 Clear old records 按钮，原生侧边栏菜单和命令面板保留“Extension Nest: 清理旧记录”。只读、读取未成功或没有候选时面板按钮不可用。成功刷新后预览无真实发现历史的 Unverified ID、分组和标签；用户多选并确认精确 ID 后永久删除这些组织归属、Tag 和顺序记录，不创建备份，不提供恢复功能。NotVisible、当前可见项和隐藏的内置项不列入候选。分组本身与真实发现历史保留，不卸载实际扩展。

确认对话框明确说明永久删除且不可恢复。对话框期间元数据变化或条目被真实发现，整批操作取消；删除写入失败保留原状态。正式组织键继续存在，重启不会从旧 Demo 再次迁移已清理条目。
