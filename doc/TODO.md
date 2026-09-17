# 当前待办

更新日期：2026-09-16。唯一活动执行清单，按[决策 004](decisions/004-public-vsix-discovery.md)重整。原清单和完成记录见[归档](archive/2026-09-16-before-public-vsix-scope.md)，撤销不算完成。版本号已更新为 0.2.1；公开发现与历史主路径已接入，下面区分已完成代码与待验收边界。

## 基线与顺序

既有分组/Tag/排序/布局继续复用；正式组织解析与迁移纯函数、只读诊断和导航失败恢复已有实现。本轮 100 项测试、类型检查、构建和 6 个 Windows 隔离宿主场景通过，新增发现历史与持久化证据见[实现记录](note/public-discovery-implementation.md)。下一步补真实双窗口、运行中 Profile 切换、Remote 本地放置和完整交互/性能验收。

普通 VSIX 不要求完整安装、真实启停或更新结果；F12/F13、启停/更新相关 UI 与旧 M0 对应门槛撤销。导入导出、卸载和自建 Details 继续撤销。

## 发现与历史（F01）

- [ ] DISC-01：本地 UI 宿主放置与能力检查，直接读取公开可见项，不按 isActive 过滤、不主动激活；Remote 窗口不读远端替代本地。
- [x] DISC-02：以规范化 ID 合并真实发现和历史缓存，生成 Visible/NotVisible/Unverified；首次发现默认 Ungrouped，已有归属不变。
- [x] DISC-03：保存真实 firstSeenAt/lastSeenAt 和展示元数据；消失保留、重现恢复，不推断禁用/卸载原因或自动删除。
- [x] DISC-04：成功空快照、首次失败、部分读取、后续失败及持久化失败正确处理；失败不批量改 NotVisible，不伪造已安装版本。

## 保存与隔离（F09/F15）

- [x] STORE-01：切换正式组织存储，保留颜色、顺序、assignments/tags，发现缓存独立保存且与同一 Profile 命名空间绑定。
- [x] STORE-02：接入 Demo 组织迁移，不复制 seed 安装/发现事实；仅组织 ID 用 Unverified，真实发现后才创建历史。
- [ ] STORE-03：组织/缓存损坏、未知格式、非法 Tag 与写失败均保留有效数据并提供重试/恢复，不静默 seed 覆盖。已实现严格校验、保留原值和 Refresh 重试；损坏数据的专门修复交互待做。
- [ ] STORE-04：验证重启、普通 Workspace、命名/复制/继承资源 Profile 的隔离；不能把 globalStorageUri 或复制 marker 当 Profile 身份。已测默认/命名 Profile 的独立启动、重启、Workspace、切回；复制/继承与运行中切换待测。
- [ ] STORE-05：实现并验证多窗口单写者或事务方案，避免组织/发现整对象丢写；单宿主队列或 revision 不算完成。已接应用级命名管道租约并通过独立进程互斥测试；真实两个 VS Code 窗口的存储传播和 UI 待测。

## 同步（F15）

- [x] SYNC-01：统一发现协调器，事件、启动、聚焦、面板再次可见/激活和 Refresh 合并补读，防反馈循环。
- [ ] SYNC-02：上下文 generation 与请求顺序校验，切 Profile/切回丢弃旧结果，不跨命名空间标缺失。当前队列串行读取、宿主释放后拒绝发布；尚未验证运行中切 Profile 生命周期边界。
- [x] SYNC-03：成功合并持久化后同步发布树和 Dashboard；失败保留旧快照标 Stale，记录最近成功时间。

## 既有交互接入（F02–F08/F11/F16/F17）

- [ ] UI-01：原生树和默认分组 Dashboard 接已知记录并集，历史项不隐藏；同 ID 唯一，空组/Ungrouped 保留，展开与选中尽量保留。
- [x] UI-02：移除模拟启停/更新命令、按钮、统计、筛选、箭头、禁用灰显及待重启文案；不实现自动更新查询或启停后端。
- [ ] UI-03：两视图加入 Not visible/Unverified 文本和 Tooltip，历史项仍可拖动、排序、Tag 编辑；保留单/双栏、组色线、插入线和卡片预览。
- [x] UI-04：实现 All/Visible/Not visible/Unverified/Ungrouped 唯一 ID 统计，历史版本标 Last seen version；搜索与 Group/可见性/多 Tag AND 组合，All 清空筛选。
- [ ] UI-05：正式模型验证组名 50 Unicode 字符、去空白/去重、保留名、删除确认/取消；成员含历史项都回 Ungrouped，Tag/历史不变。
- [ ] UI-06：正式 assignments 接单选/Ctrl 多选拖动，批量原子写；组内/跨组插入、六点组抓手、字段排序、重启顺序验证。
- [ ] UI-07：原生树落点、筛选落点、边缘滚动、取消/失焦、目标失效和非法外部载荷验证；不恢复 Move 弹窗、复选框，不宣称跨面板双向拖动已支持。
- [ ] UI-08：导航明确 Opened/Cancelled/Failed，保留失败查找入口；当前/历史/未核验项 Copy ID、原生页与失败验证，不当作管理成功。
- [ ] UI-09：正式 tags 接入单个/批量编辑，验证 trim、大小写去重、30 Unicode 字符/10 项上限、完整替换、取消和失败无部分写入。
- [x] UI-10：区分首次未读取、成功无可见项、仅历史项、无组、筛选无结果和错误；创建空组无引导，正式入口不加载 seed/Reset demo。

## 质量验收

- [ ] QA-01：覆盖 13 个活动模块与新 A26–A30，50 个可见夹具及消失/重现；历史与未核验记录不冒充禁用或已安装，需求改写不等于旧验收通过。
- [ ] QA-02：100 个已知 ID（含历史）、20 组，30 次预热 p95<100 ms；整理反馈<200 ms、快照就绪首屏<1 s，可用通知后同步目标<2 s。
- [ ] QA-03：Light/Dark/High Contrast、鼠标与键盘辅助、窄窗口、标记可读与图标失效回退；状态不只靠颜色。
- [ ] QA-04：Windows 真宿主全流程，Remote 窗口本地放置；macOS/Linux 未测注明，不宣称跨宿主聚合。
- [ ] QA-05：CSP、资源范围、消息白名单、ID/动作/拖放校验和纯文本渲染；不读取私有数据库/安装登记，不执行任意 URI 或命令。

## 交付准备

- [ ] REL-01：确认正式包名/显示名、License 和最低 VS Code 版本；publisher Lazenca 与市场图标已具备。
- [ ] REL-02：新范围功能完成后重建 VSIX，干净 Profile 安装/升级验证组织与历史保存，包内容无测试目录，正式入口无模拟管理。
- [ ] REL-03：按用户要求更新对外安装/范围/恢复说明；本轮已按授权同步 README、安装说明及 CHANGELOG；仅交付本地 VSIX，未上架。

## 后续方向

收藏、自定义图标、Settings Sync、Remote 聚合、其他 Profile 管理及规则分类仅作后续提案，不是本轮实施任务。不可自动恢复已撤销功能。

2026-09-17：默认从树、Dashboard 和统计中隐藏当前 VS Code 随应用分发的内置扩展；`extensionNest.showBuiltinExtensions` 可重新显示。发现历史及隐藏项组织数据保留，按当前应用 manifest ID 识别，不按 Microsoft/vscode 发布者前缀过滤。

2026-09-17：清理改为确认后直接永久删除，不备份、无恢复；Dashboard 增加带数量入口，侧边栏入口保留。实际 Profile 清理仍通过精确清单确认。

2026-09-17：用户界面统一 Not found（合并历史缺失与旧占位），去掉正常卡片 Visible 标签，统计与筛选合并；后台只保留事实来源以保证版本/时间不被伪造。

2026-09-17 本地 patch：0.2.1 已构建版本化 VSIX，包内容检查通过，隔离 user-data/extensions 的干净安装及版本枚举通过。REL-02 的升级后数据保留和完整交互验收仍待完成，未上架或推送。见[交付证据](note/evidence/local-vsix-0.2.1.json)。
