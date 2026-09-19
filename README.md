# Extension Nest

版本：**1.0.0**。参考运行版本：VS Code 1.137.0。未开展其他版本的兼容性测试；安装声明保留 `^1.137.0`。当前提供本地 VSIX 安装包。

在原生 Extension Nest 侧边栏和编辑器 Dashboard 中，用分组、标签、拖动和排序整理插件。正式扩展 ID 为 `Lazenca.extension-nest`，宿主使用真实公开发现数据。旧 `Lazenca.extension-nest-demo` 被视为另一扩展，其分组、标签和发现历史不会自动迁移到新 ID；旧数据不会被本次改名删除。

## 安装和使用

1. 在 VS Code 执行 `Extensions: Install from VSIX...`，选择 `extension-nest-1.0.0.vsix`。
2. 安装或升级后按提示重新加载窗口。
3. 运行 `Extension Nest: Open Extension Nest Dashboard`，或点击 Extension Nest 侧边栏的 Dashboard 图标。

Dashboard 默认显示 Visible。All 显示本插件保留的已知记录；Not found 表示本次未发现，不等于确认禁用或卸载。已发现记录消失后保留原组、Tag 和顺序，重新出现时恢复。

内置扩展默认从列表和统计中隐藏；设置 `extensionNest.showBuiltinExtensions` 可重新显示。组支持拖动和上下移动，组内插件支持字段排序。支持分组快速排序；没有启停、更新、卸载和导入导出入口；插件标题只导航到 VS Code 原生页面。

Dashboard 顶部 `Clear old records` 可预览并永久删除没有真实发现历史的旧组织占位。删除前列出 ID、分组和标签，不创建备份、不提供恢复；不会卸载插件。已有真实发现历史的 Not found 记录不属于此项残留清理范围。

## 范围和限制

- 仅发现当前本地 UI 宿主公开可见项，不代表全部已安装或已启用插件，不主动激活其他插件；不聚合 Remote/Web 宿主。
- 内置识别依赖当前桌面发行版随应用分发的 manifest ID；其他发行版目录布局未全面测试。
- 组织数据与发现历史分别保存于当前 Profile 的 globalState。为了防止跨窗口覆盖，同一应用存储目录仅一个窗口可写；其他窗口只读。关闭写者后重新加载只读窗口可重新取得写入权。
- 人工功能验收已由用户确认通过；参考环境为 Windows / VS Code 1.137.0，不承诺其他平台或版本已验证。
- 浏览器开发预览保留样例；安装后的宿主不加载示例清单。

## 本地开发

执行 `npm install` 和 `npm --prefix demo install`，再执行 `npm run build`，按 F5 启动 Extension Development Host。测试使用 `npm --prefix demo test`，宿主类型检查使用 `npm run typecheck`。

[产品说明](doc/PRODUCT.md) · [历史需求](doc/archive/2026-09-17-prd/000-overview.md) · [待办](doc/TODO.md) · [版本记录](CHANGELOG.md)

## 许可证

MIT，详见发布包中的 LICENSE。
