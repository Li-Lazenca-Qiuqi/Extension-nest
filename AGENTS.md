# Extension Nest 项目约定

## 稳定背景与技术栈

Extension Nest 为 VS Code 提供插件分组、原生管理入口与 Dashboard。扩展宿主使用 TypeScript 和 VS Code Extension API，编辑器 Webview 使用 React（TypeScript）+ Vite，不引入独立 Web 后端。

## 阅读顺序与目录地图

1. [PRODUCT](doc/PRODUCT.md)：产品定位、现有能力、流程、支持范围和已知限制。
2. [TODO](doc/TODO.md)：唯一活动执行清单。
3. [PRD 归档说明](doc/PRD/README.md)：原 19 份 PRD 已归档，仅供追溯；全部待办与验收条件由 TODO 承接。
4. [Roadmap](doc/Roadmap.md)：阶段目标与退出条件。
5. [当前决策](doc/decisions/004-public-vsix-discovery.md)：设计取舍；001～003 保留历史与未被替代的约定。
6. [公开发现实现](doc/note/public-discovery-implementation.md)：当前结构、数据与验证边界。

- `src/`：扩展宿主、原生 TreeView 和 Webview 消息桥。
- `webview/src/`：Dashboard、状态模型及测试。
- `webview/test/`：测试替身与专用夹具。
- `doc/note/`：专题笔记与来源记录。
- `doc/archive/`：历史记录，按需读取，不作为当前规范。
- `README.md`：对外安装与使用说明，主要由用户维护或按明确要求更新。
- `CHANGELOG.md`：版本级变化；动态版本与功能状态不在本文件重复维护。

## 长期约定

- 直接接入 VS Code。分组导航和拖动使用原生侧边栏，Dashboard 不自建网页侧边栏或模拟外壳。
- Dashboard 默认按 Group 分区展开紧凑卡片，每组有标题和数量，Ungrouped 置后；不能默认平铺全部卡片。统计保持单行，避免宣传式文案和多余说明。
- 每个 Extension ID 至多一个自定义组；拖入新组即移动，拖到 Ungrouped 即解除归属。
- 鼠标为主，保留键盘辅助访问；分组变更只修改组织元数据，与安装管理分离。
- 所有新增界面文案（含命令、设置说明、提示与辅助标签）接入本地化，跟随 VS Code 显示语言；维护中文与英文，其他语言回退英文。保留品牌、技术术语、用户组名与标签，不翻译内部 ID 或持久化状态值。
- 普通 VSIX 整理器，仅自动发现当前本地 UI 宿主公开可见扩展，不聚合其他宿主，不承诺全部已安装或全部已启用。原生页仅导航，不提供启停、更新或卸载功能。
- 当前范围以 PRODUCT 和决策 004 为准，全部未完成任务与验收条件以 TODO 为准；历史完整安装/管理门槛已撤销，发现成功不等于安装全量认证。
- 曾发现后不可见标 NotVisible，保留 Group、Tag、顺序与最后观测元数据；不推断禁用/卸载。重现恢复 Visible；NotVisible 与旧 Unverified 在用户界面统一标 Not found，正常卡片不标 Visible；读取失败用 Stale/Error，不批量标不可见。isActive 不用于筛选。
- UI、服务、状态和适配器分层；TreeItem 与 Webview 不直接写持久化，不执行任意传入命令。
- 正式本地配置以稳定 ID、唯一 assignments 和每个扩展的 tags 表达归属与标签；格式由 src/organizationState.ts 定义，待验收约束见 TODO，原 PRD-009 仅供历史追溯；真实发现历史单独缓存，不能从 Demo/seed 伪造，不与 Demo 全快照混用。
- Tag 与 Group 独立：每个扩展的 tags 是字符串数组；标签只参与搜索和筛选，不改变唯一分组。标签首尾空白会被去除，按大小写不敏感规则去重；每个标签最多 30 个 Unicode 字符，每个扩展最多 10 个标签。
- 当前能力维护在 PRODUCT，执行进度维护在 TODO，完成记录定期归档；不得把需求或 Demo 完成当作正式验收通过。
- Git 提交与版本更新分别需要用户明确要求；仅版本更新时修改 CHANGELOG。删除操作遵循用户级授权规则。
- 不使用 LAST_RUN.md。
