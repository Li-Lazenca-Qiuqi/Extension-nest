# PRD-016：紧凑卡片 Dashboard

模块编号：PRD-016  |  需求编号：F16  |  优先级：P0

状态：正式产品需求；0.1.0 为示例数据 Demo，不能等同于本模块已验收。

[总览与索引](000-overview.md) · [当前待办](../TODO.md)

## 1. 目标与需求

| 编号 | 功能 | 必须满足的行为 |
| --- | --- | --- |
| F16 | Dashboard | 按本模块定义交付真实统计、鼠标筛选、搜索、分组移动和管理入口；共享服务与状态，不能各自保存一套分组 |

## 2. 规则与交互

Dashboard 在 VS Code 编辑器 Webview 中打开，同一面板重复打开时聚焦，不新增失步实例。使用紧凑插件卡片，自适应列数；删除宣传式标题、副标题和大面积留白。统计是一行可点击的紧凑筛选，不做大统计卡片。每个 ID 一张聚合卡片，可查看安装实例；分组导航与拖动放在原生侧边栏。

Dashboard 是 P0 的正式管理面板，默认展示当前管理范围内所有已安装扩展。界面保持简洁紧凑，不使用宣传式标题、副标题或大面积留白；统计为单行紧凑筛选，插件采用卡片网格。以下布局是需求说明，不是已生成的 UI 原型。

| 区域 | 内容与行为 |
| --- | --- |
| 顶栏 | 当前 Profile/安装目标，Refresh、Check Updates、打开原生 Extensions 入口，数据更新时间 |
| 概览 | Installed、Enabled、Disabled、Updates、Ungrouped；点击统计项应用对应筛选 |
| 分组入口 | 导航和拖动放在 VS Code 原生侧边栏；Dashboard 仅用工具栏组筛选器和行内移动入口，不另占侧边栏 |
| 插件卡片网格 | 每个插件一张紧凑卡片，显示图标、名称、publisher、版本、唯一分组和启用状态；保留复选框、更新及管理按钮。自适应列数，不使用表格列表 |
| 搜索/筛选 | 按名称、ID、publisher 搜索；按分组、状态、安装目标、Built-in/User Installed 类型筛选；Clear Filters 一键恢复完整清单，默认不排除内置扩展 |
| 反馈区 | 加载中、同步失败、操作进度、重启要求、离线与重试；不显示虚构统计或成功状态 |

计数口径必须可解释：Dashboard 的 Installed 等管理统计按当前筛选安装范围的**安装实例**计数，通过范围标签或 Tooltip 说明 Includes local and remote installations；组内数量按唯一 Extension ID 计数。默认每个 ID 一张聚合卡片，展开可看实例；跨环境相同 ID 不被误当成两份分组。选择单一目标后统计和列表均限定该目标。

Enabled、Disabled、Unknown 构成安装实例的互斥状态分类；受策略阻止而非正常启用的实例在 Disabled 详情标明原因。Updates 是可与任意启用状态交叉的子集，未知更新状态单独提示。Ungrouped 统计未分组 ID 对应的安装实例，不能拿组数相加去伪造实例总数。

没有数据时区分“尚未读取”“读取失败”“已确认没有安装”和“筛选无结果”。禁用条目默认不隐藏。仅颜色不应承担唯一状态信息；Light、Dark、High Contrast 下均可读。

## 3. 模块依赖

- [PRD-001：全量安装清单](001-installed-inventory.md)
- [PRD-002：原生分组树](002-native-group-tree.md)
- [PRD-003：搜索与状态筛选](003-search-and-filters.md)
- [PRD-005：单组归属与批量移动](005-single-group-assignment.md)
- [PRD-008：原生详情与标识复制](008-native-details.md)
- [PRD-012：启用、禁用与状态展示](012-enable-disable.md)
- [PRD-013：扩展更新](013-updates.md)
- [PRD-015：状态同步与并发](015-state-sync.md)
- [PRD-017：插件 Tag](017-tags.md)

## 4. 验收条件

以下保留原 A 编号，本文件是这些案例的主定义。

| 编号 | 场景 | 预期 |
| --- | --- | --- |
| A22 | 不同主题下用鼠标执行整理和管理 | 灰显仍可读/可操作；按钮和右键可达；键盘仅辅助 |

关联案例（主定义位于对应模块）：
- [A18 · PRD-003](003-search-and-filters.md#4-验收条件)
- [A19 · PRD-015](015-state-sync.md#4-验收条件)
- [A20 · PRD-012](012-enable-disable.md#4-验收条件)

## 5. 范围与证据边界

遵循 [PRD-000 的公共约束](000-overview.md#公共集成规则)。实现、测试和剩余阻塞统一记录在 TODO，本文件不另建执行清单。
