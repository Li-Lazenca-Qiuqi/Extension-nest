# 001：需求基线与冲突整理

日期：2026-09-12。状态：历史初稿记录，已被用户本轮修改及 [002 当前决策](002-single-group-management-dashboard.md) 替代，不可作为当前实现依据。下表保留初稿背景，其中多组、拖放复制、管理后置、检测集合和排除 Webview 等结论已失效。

来源为[指定聊天](https://chatgpt.com/c/6a3e8b9a-2fa8-83ee-9434-b25eb36b0ec2)。以下用于消除原草案歧义。

| 主题 | 来源情况 | 当前处理 |
| --- | --- | --- |
| 名称 | PRD 暂名 Extension Organizer；后续讨论 ExtShelf、ExtNest 等，无最终用户选择 | 依据目录暂称 Extension Nest；发布前确认，不声称查重完成 |
| 原生 UI | 方案主张 TreeView，另给 HTML 示意 | 正式产品坚持 TreeView；HTML 仅为后续可选设计资料，本次不生成原型 |
| Group | 方案持续采用多对多模型 | 保留，拖拽添加归属；Move 仅移除当前来源组，保留其他关系 |
| 搜索 | 正文提 MVP 搜索，P1 表又列 Search，HTML 有固定搜索框 | 以最终分期表为准，独立搜索为 P1；P0 QuickPick 选择过程仍可输入匹配 |
| 图标 | 菜单有 Change Icon，P1 表列 Custom Group Icons | P0 默认图标，P1 自定义图标；不保留无功能菜单 |
| 系统组 | 初步构想包括 Disabled/Builtin，正式草案仅 All/Ungrouped | P0 只提供后两者；不以 isActive 推断 Disabled |
| schema | 内存示例 version，导出示例 schemaVersion | 统一 schemaVersion=1；属于数据格式，不触发产品版本更新 |
| 导入 | P0 导入但合并策略放 P1 | P0 完整校验、预览、确认后替换；提供先导出入口，失败不部分写入 |
| 暂不可见关系 | 原稿强调卸载后保留 | 扩展为任何暂不可检测情形保留；不自动推断卸载原因 |
| 计数 | 原稿使用已安装总数举例 | 统一为可检测集合内去重 ID 数；隐藏关系不计入可见成员数 |
| 存储 | globalState 被描述为全局 | 不等价于跨 Profile/机器/Remote 同步，多窗口行为待实测 |
| 发布文档 | 来源 DoD 包含 CHANGELOG | 遵循当前用户规则，仅明确更新项目版本时维护，不为文档初始化编造版本 |

导入原子性、输入边界、名称去重规则、失败恢复和可重复的性能指标为本次补充的工程化要求。后续改变上述基线时同步更新 PRD 与 TODO；无需复制来源中所有探索功能进入 P0。
