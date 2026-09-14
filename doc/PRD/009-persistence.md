# PRD-009：本地状态与恢复

模块编号：PRD-009  |  需求编号：F09  |  优先级：P0

状态：正式产品需求；0.1.0 为示例数据 Demo，不能等同于本模块已验收。

[总览与索引](000-overview.md) · [当前待办](../TODO.md)

## 1. 目标与需求

| 编号 | 功能 | 必须满足的行为 |
| --- | --- | --- |
| F09 | 本地状态 | 保存唯一分组、顺序和 Tag；读取损坏或写入失败不以空状态覆盖；重启和普通 Workspace 切换不丢状态 |

## 2. 规则与交互

正式本地配置由本模块定义，使用 `schemaVersion=1`、`groups`、`assignments` 和 `tags`，建议 globalState key 为 `extensionNest.state`。普通 Workspace 切换与重启不丢数据；Profile/Remote 隔离、多窗口冲突必须实测。读取损坏、未知格式或保存失败时保留原有效数据，提供重试/恢复入口，不能用空状态覆盖。启停和更新不修改归属或 Tag；对 VS Code 外部安装/卸载只读同步状态，不由本地配置触发管理动作。不承诺跨机器同步。

本地配置的最小结构如下：

```json
{
  "schemaVersion": 1,
  "groups": [
    { "id": "g-python", "name": "Python & Data", "order": 0 }
  ],
  "assignments": {
    "ms-python.python": "g-python"
  },
  "tags": {
    "ms-python.python": ["Python", "Research"]
  }
}
```

`assignments` 的值只能是一个有效 Group ID；缺少 Extension ID 表示 Ungrouped。`tags` 的值必须是该扩展的字符串数组，缺少 Tag 项表示 `[]`。Tag 的规范化和数量限制遵循 [PRD-017](017-tags.md)，本地配置不保存动态版本、启用状态或更新结果。

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
