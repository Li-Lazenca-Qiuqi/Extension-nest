# 004：普通 VSIX 与发现历史

日期：2026-09-16。依据用户本轮明确确认，替代 003 中要求完整安装清单和真实启停/更新管理的部分。仅修改需求与文档，本轮不实现功能。

## 产品范围

- 发布普通 VSIX，运行于桌面 VS Code 本地 UI 扩展宿主；不要求定制 VS Code、Workbench 桥接、CLI 绑定或读取私有安装登记/数据库。
- 自动发现当前上下文中本地宿主公开 API 可见的扩展，包括未激活的可见项；不得过滤 isActive=false 或主动激活其他插件。不能承诺所有已启用、所有已安装、其他宿主或未曾发现的禁用插件均可见。
- 不聚合 Remote/Web 宿主。Remote 窗口中本扩展仍应放置在本地 UI 宿主；无法认证范围时报告不支持，不读远端替代本地。
- 移除更新查询、可用版本、更新统计/筛选/箭头与更新入口；移除 Enabled/Disabled、启停按钮/筛选/灰显、启停原因、Mixed、Restart Required 展示。原生页仍可由用户自行操作，但 Nest 不监控或宣告管理成功。
- 保留原生树、Dashboard、Group/Tag、Ctrl 多选、拖动归组和排序、单/双栏、展开收起、原生页导航、Copy ID、本地组织保存。导入导出和卸载入口继续撤销。

## 历史记录与标记

- Visible（当前可见）：本次同上下文成功发现包含该 ID。
- NotVisible（当前不可见）：本上下文有可信真实发现历史，但本次成功发现不再包含。可能因为禁用、卸载、宿主变化等；不得标为 Disabled、Uninstalled 或判断具体原因。提示文案：Previously discovered; not visible in the current local extension host.
- Unverified（未核验）：仅有旧组织元数据或未完成本会话首次读取，尚无足够证据给出当前可见性。首次读取前可展示缓存上次观测，但必须标过期。
- 记录缺失不自动删除，不改变归属、标签和排序；NotVisible 仍可编辑、拖动、复制 ID、尝试原生导航。再次出现更新展示缓存、恢复 Visible，不能重复建项或移回 Ungrouped。
- Freshness（Loading/Ready/Stale/Error）独立于条目可见性；失败或部分读取不做缺失推断。成功的空快照只表示本次未发现可见项，不表示全部卸载。
- Profile/上下文隔离；旧异步请求不得覆盖新上下文或把另一 Profile 的记录标为不可见。不能用 globalStorageUri 或复制过的标记推断 Profile 身份。

## 编号和实现边界

F12/F13 与 A07/A08/A10/A11/A20 撤销，不复用；F10/F14、A12–A14 保持撤销。A26–A30 新增发现历史、失败、上下文、迁移和计数验收。旧要求与 TODO 见 [归档](../archive/2026-09-16-before-public-vsix-scope.md)。

现有 0.2.0 仍是 Demo；此次文档变更不代表真实发现、历史标记或 UI 移除已实现。后续改动保留独立待办，不自动提交、更新版本或 CHANGELOG。
