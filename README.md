# Extension Nest Demo

当前版本：**0.1.2**。最低 VS Code 版本：1.137.0。

这是运行在 VS Code 内的交互演示：分组位于原生 Explorer 侧边栏，Dashboard 位于编辑器 Webview。Dashboard 不创建第二个网页侧边栏。

## 当前能力

使用 14 个示例扩展演示唯一分组、原生树拖动、组排序、灰显禁用条目、统计筛选、搜索、模拟更新以及独立 Tag 搜索筛选。两种界面由扩展宿主统一管理状态，保存在独立的 Demo 存储键中。

**示例扩展不代表本机安装清单。启用、禁用和更新只修改演示数据，不修改你真正安装的插件。** 原生 Marketplace 接入和完整清单读取仍是后续工作。

## 本地运行

1. 在项目根目录执行 `npm install`，随后执行 `npm --prefix demo install`。
2. 执行 `npm run build` 构建扩展宿主及 Dashboard。
3. 用 VS Code 打开项目，按 F5 启动 Extension Development Host。
4. 在 Explorer 侧边栏打开 Extension Nest Demo，或运行命令 `Extension Nest Demo: Open Extension Nest Dashboard`。

Tag 可添加多个，仅参与筛选和搜索，不参与分组；不提供配置导入导出或插件卸载。

分组可以通过原生侧边栏拖动整理；Dashboard 的分组选择器用于筛选，点击插件的组名可以移动归属。灰色条目仍可操作。

## 文档

- [产品需求](doc/PRD/000-overview.md)
- [当前待办](doc/TODO.md)
- [路线图](doc/Roadmap.md)

0.1.2 为本地交互 Demo，尚未发布到 Marketplace。版本变化见 [CHANGELOG](CHANGELOG.md)。
