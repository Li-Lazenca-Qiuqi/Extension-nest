# Demo 实现说明

整理日期：2026-09-14。当前产品状态见 [PRODUCT](../PRODUCT.md)；以下说明现有结构和验证边界。

## 模块结构

- `src/extension.ts`：扩展宿主、命令、状态保存与动作校验。
- `src/demoTree.ts`：VS Code 原生分组树和拖放处理。
- `src/dashboardPanel.ts`：编辑器 Webview 和受限消息桥。
- `demo/src/App.tsx`：Dashboard 交互与宿主快照消费。
- `demo/src/ExtensionCards.tsx`：紧凑插件卡片。
- `demo/src/state.test.ts`、`demo/src/nativeTree.test.ts`：状态和拖放控制器测试。

## 当前视觉与交互约束

每个插件使用独立紧凑卡片，统计为单行；没有宣传式标题、副标题或自建网页侧边栏。保留鼠标复选、分组移动、状态切换、版本和管理菜单。Tag 编辑、批量替换、卡片标签筛选和标签名搜索已接入 Demo；标签与 Group 独立。样式跟随 VS Code 主题和字体，禁用条目灰显且仍可操作。

分组导航和拖动放在 VS Code 原生侧边栏。浏览器入口仅用于组件开发检查，不能替代真实扩展宿主验证。

## 数据边界

DemoState 是包含示例扩展、唯一分组和 `tags: string[]` 的演示快照，不等于正式 [PRD-009](../PRD/009-persistence.md) 的本地配置。旧 Demo 快照缺少 `tags` 时，正式迁移要求自动补为 `[]`，同时保留原 `groupId`；该迁移尚未验证。宿主使用独立 globalState 键保存并同步两种界面，启停和更新动作只作用于示例数据；本插件不提供卸载入口，对 VS Code 外部安装/卸载只做只读同步说明。Webview 消息经宿主校验，不能直接修改真实插件。

## 已有验证证据

日期：2026-09-12；环境：Windows、VS Code 1.137.0。

- 宿主类型检查、Dashboard 构建和 11 项状态/拖放控制器测试通过。
- 原生组点击筛选 Dashboard；Python 模拟禁用后两处显示 Disabled，Enabled 从 11 变为 10、Disabled 从 3 变为 4。
- 鼠标把 Python 移至 Writing 后，原生组计数从 4/2 变为 3/3。
- 紧凑卡片显示与管理菜单已在真实窗口检查，构建与 VSIX 打包通过。
- 自动化拖动未触发 handleDrag/handleDrop；控制器逻辑通过不代表真实鼠标手势已验证。
- 外部变化只读同步与跨平台完整端到端验证尚未完成；配置文件交换已取消。

本次整理没有重新运行上述测试。原始验证和被替代的表格布局记录见 [历史归档](../archive/2026-09-14-memory-maintenance.md)。

## 历史设计资源

已确认清理的旧设计资源不再列入当前实现结构；历史归档和 Git 历史保留追溯入口，不作为当前设计约束。

## 2026-09-14 Tag 验证

宿主类型检查、构建、19 项测试与 VSIX 打包通过。原生窗口中旧快照的组与状态保留；为 Python 添加 Research/Data 后，点击标签或搜索标签名只显示匹配插件，Writing 组计数不变。配置导入导出及卸载的 UI、命令、协议均已移除。批量 Tag 替换有逻辑测试，完整鼠标端到端仍待补充。

经用户逐项确认，旧 Sidebar 辅助模块和两张设计图已移入回收站，3 个原路径均不存在；其余历史记录保留。

## 2026-09-15 默认分组视图修正

Dashboard 默认按 Group 分区展开卡片，每组有标题和数量，Ungrouped 置后；空组默认可见，搜索筛选时省略无匹配组。原生树初始组节点也设为展开。Tag 不参与分区。

真实 VS Code 开发窗口已确认默认显示各 Group 区块，而非平铺卡片。新增默认渲染回归测试验证 5 个展开分区、14 张唯一卡片；连同原有测试共 23 项通过，类型检查、构建和 VSIX 打包通过。本次没有更新版本或提交。

## 2026-09-15 拖放修复

补齐 Dashboard 卡片的拖放事件和 Group 分区接收事件，并增加六点鼠标拖动手柄，使用指针捕获避免按钮拦截拖动；目标高亮，多选时批量移动。原生 TreeView 读取拖放数据时兼容异步 asString。

验证：类型检查、构建、打包及 28 项测试通过，其中 React DOM 测试覆盖 dragstart/dragover/drop、鼠标手柄移动、多选、Ungrouped、非法载荷和原生异步数据。真实 VS Code 窗口使用手柄将 GitHub Copilot 从 AI Coding 移入 Python & Data，原生树计数由 2/3 变为 1/4。此次已验证 Dashboard 手柄实际拖动；不能据此推断所有跨面板或原生树拖放路径均通过。

## 历史拖动交互（已替代）

用户指出双重拖动和手柄不跟手后，移除六点手柄及自定义 Pointer Capture 路径，只保留卡片原生 dragstart/dragover/drop。功能控件的 pointerdown 会禁止本次卡片拖放，但不阻止点击；卡片空白处按下恢复可拖动。28 项测试通过，包含所有按钮/复选框不能启动拖动的回归验证。此前手柄实测记录为历史，不代表当前实现。

历史拖动外观（2026-09-15，已替代）：取消 Group 目标区域的高亮背景、外扩边框和 Move here 提示；拖动预览限定为源卡片，源卡片 opacity 为 0.82，不改变尺寸、圆角或布局。取消/结束拖动恢复透明度。类型检查、构建、打包和 29 项测试通过。

## 当前拖动实现

useCardDrag 使用单一 Pointer Events 路径，在 Webview 内绘制源卡片的同尺寸预览，opacity 固定 0.82，pointer-events 为 none。禁用源卡片原生 draggable/setDragImage，避免系统拖影的额外透明度与遮罩。坐标直接使用鼠标位置减去起拖偏移，样式无缩放、滤镜或动画，不提供手柄。功能控件不进入拖动；Escape、pointercancel、失焦和卸载组件会清理预览，只有有效 Group 内释放才移动。

29 项测试验证预览大小、透明度、坐标跟随、归属与标签保留、多选、Ungrouped、按钮隔离和取消清理；类型检查、构建和打包通过。

## 2026-09-15 原生树成员接收拖放

插件拖到组内成员条目时，按目标插件的最新所属组执行移动，与拖到组标题使用同一动作；支持多选及 Ungrouped，保留 Tag。失效目标与无节点空白不写状态，组排序仍仅接受组标题。

33 项测试、类型检查和构建通过，新增覆盖成员与标题结果等价、重复同组、批量移入 Ungrouped、最新归属和无效目标。尚未实测本次原生鼠标手势。TreeDragAndDropController 仅提供拖动及放下回调，未公开悬停高亮控制，因此当前不能将整组范围绘制成统一接收高亮；仍使用 VS Code 原生反馈。

## 2026-09-15 Dashboard 目标区域高亮

指针拖动时高亮整个目标 Group，使用主题拖放背景与细轮廓，保持卡片布局。标题、成员卡片和组内空白采用同一命中规则；滚动时更新目标，离开、松手、Escape、pointercancel 和失焦均清理。

37 项测试、类型检查和构建通过。内置浏览器 localhost:5173 中实测 Python 拖入 AI Coding：标题、成员及空白均高亮同组，移出清除，放下后归属变化且高亮消失；截图检查无布局偏移，控制台无警告或错误。VS Code Webview 主题及跨面板拖放未在本次浏览器验证中覆盖。

主题颜色补充：移除拖放高亮的固定灰色和绿色回退。背景依次使用 list.dropBackground、editorGroup.dropBackground，轮廓依次使用 contrastActiveBorder、focusBorder；主题未提供时从 currentColor 派生。切换主题由 Webview 的 CSS 变量自动更新，具体主题下的视觉效果待人工确认。

## 2026-09-15 分类色线

沿用持久化 Group.color，为分类标题设置 2px 分割线，并给全部所属卡片增加 3px 顶部色线；Ungrouped 使用主题 descriptionForeground。卡片色线依赖当前分组，不依赖扩展图标颜色；卡片自身保留颜色变量，拖动预览脱离分组容器后仍正确显示。新建组沿用已有自动配色逻辑。

37 项测试和构建通过。内置浏览器检查五个分类的分割线与全部 14 张卡片的计算颜色一致，截图确认顶部细线与圆角正常。VS Code 主题下的观感待人工确认。

## 2026-09-15 原生侧边栏分类图标

活动栏入口补充：分组树从 Explorer 移到独立 Extension Nest 容器，使用 media/extension-nest.svg 的模块收纳图标；原视图 ID 和持久化状态键保持不变，Show Groups 继续聚焦原生树。安装说明与 PRD-002 已同步，宿主类型检查和构建通过。更早的 Explorer 容器描述属于历史。

分类文件夹改为 layers，启用插件保留 extensions 图标并跟随分类颜色，禁用插件仍为灰色 circle-slash。package.json 注册六个 extensionNest.group.* 颜色，侧边栏与 Dashboard 通过 groupColors.ts 共用映射，支持高对比度默认色和主题覆盖；自定义色板以外颜色在原生树回退为中性色。37 项测试、宿主类型检查与构建通过，原生图标实际显示待人工验收。
