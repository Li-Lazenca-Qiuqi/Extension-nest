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
