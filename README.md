# Extension Nest

[![Version](https://img.shields.io/badge/version-1.0.1-blue)](https://marketplace.visualstudio.com/items?itemName=Lazenca.extension-nest)
[![VS Code](https://img.shields.io/badge/VS_Code-%5E1.137.0-007ACC)](https://code.visualstudio.com/)
[![Marketplace](https://img.shields.io/badge/Marketplace-Extension_Nest-007ACC)](https://marketplace.visualstudio.com/items?itemName=Lazenca.extension-nest)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](https://github.com/Li-Lazenca-Qiuqi/Extension-nest/blob/main/LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-Source-181717?logo=github)](https://github.com/Li-Lazenca-Qiuqi/Extension-nest)

[简体中文](https://github.com/Li-Lazenca-Qiuqi/Extension-nest/blob/main/README.md) | [English](https://github.com/Li-Lazenca-Qiuqi/Extension-nest/blob/main/README.en.md)

VS Code 插件繁多，安装数量增加后，整理也变得不便。Extension Nest 用分组和标签整理 VS Code 插件，通过原生侧边栏和 Dashboard 快速查找与整理。

## 主要功能

- 分组管理：创建、重命名、拖动归组与排序，每个插件至多属于一个自定义组。
- 标签整理：手动标签与自动类别标签，搜索与多标签组合筛选。
- Dashboard：分组展示、单/双栏、批量选择、展开/收起和快速排序。
- 发现历史：保留历史插件在本次未被发现时的分组与标签，重新发现后恢复显示。
- 原生入口：点击插件名称或图标打开 VS Code 原生详情页。

## 安装

### Marketplace

[Extension Nest - Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=Lazenca.extension-nest)

### 本地 VSIX

执行 `Extensions: Install from VSIX...`，选择发布的 VSIX 文件，按提示重新加载窗口。

参考运行版本：VS Code 1.137.0。安装声明为 `^1.137.0`，未验证其他版本和平台的兼容范围。

## 快速开始

1. 点击活动栏的 Extension Nest 图标，打开 Dashboard。
2. 创建分组，将插件拖到对应分组。
3. 为插件编辑手动标签，或按自动类别筛选。
4. 使用搜索、Group 和 Tags 组合缩小列表范围。

## 列表与状态

- **Visible**：本次从当前本地 UI 宿主公开接口发现的插件，默认显示此列表。
- **Not found**：保留记录中本次未发现的插件，不等于已禁用或已卸载。
- **All**：已知记录的集合，不是全部已安装插件。

内置扩展默认隐藏，可以通过设置 `extensionNest.showBuiltinExtensions` 显示。

## 数据与使用限制

- 仅整理当前本地 UI 宿主公开可见插件，不聚合 Remote/Web，不承诺全部已安装或已启用项。
- 不主动激活其他插件，不提供启停、更新或卸载功能。
- 组织配置与发现历史分别保存；同一应用存储目录只允许一个窗口写入，其余窗口只读。关闭写者后重新加载只读窗口可重新取得写入权。
- “清理旧记录”只删除没有真实发现历史的旧组织占位，确认后永久删除，不创建备份。
- 损坏数据修复只重置所选的组织配置或发现缓存，保留另一份数据，确认前会说明损失。

## 源码与反馈

- [GitHub 项目主页](https://github.com/Li-Lazenca-Qiuqi/Extension-nest)
- [问题反馈与功能建议](https://github.com/Li-Lazenca-Qiuqi/Extension-nest/issues)

## 版本记录

见 [CHANGELOG](CHANGELOG.md)。

## 许可证

[MIT](LICENSE)。
