# 公开发现与历史记录实现

日期：2026-09-16。当前范围见[决策 004](../decisions/004-public-vsix-discovery.md)，待办见 [TODO](../TODO.md)。本轮未更新版本、提交或发布。

## 当前行为

- 正式宿主声明 `extensionKind: ["ui"]`，检查桌面 UI 宿主，读取 `vscode.extensions.all`；不按 `isActive` 过滤或激活其他插件。
- `discoveryState.ts` 整批校验公开观测、规范化 ID、保存真实历史，投影 Visible/NotVisible/Unverified。失败不能等价于成功空快照。
- `discoveryRepository.ts` 分别使用 `extensionNest.state` 和 `extensionNest.discovery`；只迁移实际存在的旧 Demo 组织关系。缓存包含 source、firstSeenAt、lastSeenAt、lastSeenMetadata；不保存启停或更新状态。
- 写入成功后同时更新原生树和 Dashboard。坏数据保留原值并阻止写入，Refresh 可重试；专门的坏数据修复界面尚未实现。
- 启动、公开注册表事件、窗口聚焦、面板再次可见和 Refresh 补读；宿主队列串行化动作与发现。宿主释放后不发布异步旧结果，图标结果另有修订号防止覆盖新视图。
- `writerLease.ts` 在 Windows 用命名管道保证应用存储目录级单写者。锁比 Profile 粒度保守，其他 Profile 窗口也可能只读。目录只定义锁域，不冒充 Profile 身份。其他窗口保留当次内存观测但不写任何 globalState；关闭写者后重新加载只读窗口获取写入权。
- 移除了启停/更新字段、reducer、命令注册、manifest 菜单、按钮、筛选、统计和禁用灰显。诊断只检查导航命令，不再生成旧启停/更新字段。宿主拒绝旧 toggle/update/reset 消息。
- 分组、Tag、排序、拖动沿用现有交互。原生导航返回 Opened/Cancelled/Failed，只表明导航；树与卡片提供 Copy ID。正式入口无 seed 或 Reset demo，浏览器预览仍保留样例。

## 自动验证

`npm --prefix demo test -- --run`：15 个文件、100 项测试通过。新增测试覆盖真实观测历史、消失重现、空快照、Demo 迁移、部分读取错误、坏组织/缓存、写入失败重试、只读窗口、上下文释放、50 个夹具和独立进程锁互斥。旧启停/更新测试已替换为当前语义。

`npm run typecheck`、`npm run build` 通过。`git diff --check` 用于最终差异检查。

`scripts/test-discovery-host.mjs` 使用显式 Code.exe、全新 user-data/extensions 和普通开发宿主；不使用 `--extensionTestsPath`，不操作用户原有 Profile。直接激活实际 Extension Nest 构建，通过仅开发模式暴露的只读快照验证两视图状态源。测试探针会激活被测 Extension Nest，但不会激活夹具。

| 场景 | 已知记录 | 夹具 Visible | 夹具 Not visible | 证据 |
| --- | ---: | ---: | ---: | --- |
| baseline | 147 | 50 | 0 | 50 个夹具全部未激活 |
| missing | 147 | 49 | 1 | 启动参数禁用一个，历史保留 |
| restart | 147 | 50 | 0 | 去掉禁用参数，历史恢复 |
| workspace | 147 | 50 | 0 | 普通 Workspace 不丢历史 |
| profile | 97 | 0 | 0 | 新命名 Profile 不混入默认历史 |
| default-return | 147 | 50 | 0 | 切回默认 Profile 恢复记录 |

全部场景还验证旧 toggle/update/resetDemo 命令未注册。汇总见[宿主证据](evidence/discovery-host-2026-09-16.json)。原始实验目录保存在被 Git/VSIX 排除的 `.m0-runtime/`，不属于正式数据。

## 界面检查

内置浏览器不可用，使用隔离 headless Edge + Playwright 访问本地 Vite。1440×1000 单/双栏及 420×900 窄屏截图已检查，无横向溢出；Not visible 筛选得到三个对应卡片，菜单没有启停或更新。宿主消息注入覆盖 Loading、成功空、仅历史、过滤空、只读、Stale/Error 和未核验版本。修复历史版本挤压 Tag，以及只读或失败时误显示 Saved 的文案。

应用未发现运行时异常或错误浮层；浏览器有已有的 favicon.ico 404。截图在本机临时目录 `C:/Users/pc/AppData/Local/Temp/extension-nest-frontend-qa/`，不打包进扩展。Vite 测试服务已停止。

## 未验证范围

运行中切 Profile/切回、复制与继承 Profile、Remote 窗口的本地放置、真实两个 VS Code 窗口的组织写入与传播、三主题全覆盖、正式性能阈值及干净 Profile VSIX 安装升级未完成。当前生命周期保护不等于实时原生 Profile 身份接口；独立进程锁测试不等于真实多窗口完整验收。macOS/Linux 未测。TODO 保留这些事项，不能把新主路径通过表述为全部 PRD 完成。

## 2026-09-17 内置扩展过滤

默认以当前应用 extensions 目录 manifest 中的 ID 隐藏内置项，公开发现与缓存继续保留原始事实；树、Dashboard、搜索和统计使用同一过滤投影。显示开关为 extensionNest.showBuiltinExtensions。编辑组织时合并隐藏项，保留归属、Tag 与顺序；发行版目录读取失败报告错误，不静默按 publisher 猜测。

新增目录识别、依赖目录排除和隐藏历史/组织保存回归测试，共 103 项通过；类型检查与构建通过。VS Code 已更新为 1.138.0，6 个隔离宿主场景均通过：默认 52 项（50 夹具与两个开发扩展），命名 Profile 2 项，消失/重现仍正确。见[过滤证据](evidence/builtin-filter-host-2026-09-17.json)。此前 147/97 是未过滤的历史实验结果，不是当前默认计数。

## 2026-09-17 清理入口

按用户最新要求改为直接永久删除，不创建备份，移除恢复命令。Dashboard 顶部新增 Clear unverified (N)，原生侧边栏和命令面板保留入口，统一走预览与确认。回归覆盖不写预览、无备份删除、重启不复活、状态变化拒绝和写入失败保留原值。

本轮最终验证：114 项测试、类型检查、构建与差异检查通过。Dashboard 在 1440×900 和 420×900 下检查清理按钮可见且无横向溢出；点击只发送固定 cleanupUnverified 消息，确认前不删除卡片，只读/未就绪/无候选时禁用。Browser plugin 不可用，采用隔离 headless Edge + Playwright；本次自启服务已停止。未替用户执行实际 Profile 删除。

## 2026-09-17 合并用户状态

界面统一以 Not found 表示本次未发现，合并原两种来源的卡片标签、树说明、统计与筛选。正常卡片无 Visible 标签。内部仍保存真实历史是否存在，以免编造版本/时间；本轮只合并展示，清理范围没有扩大到真实历史。115 项全量测试、类型检查、构建与差异检查通过；隔离 headless Edge 的桌面/窄屏检查通过，混合两类记录时计数2、筛选2卡，正常项无状态badge，无横向溢出。测试服务已停止。
