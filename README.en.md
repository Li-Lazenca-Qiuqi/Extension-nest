# Extension Nest

[![Version](https://img.shields.io/badge/version-1.0.1-blue)](https://marketplace.visualstudio.com/items?itemName=Lazenca.extension-nest)
[![VS Code](https://img.shields.io/badge/VS_Code-%5E1.137.0-007ACC)](https://code.visualstudio.com/)
[![Marketplace](https://img.shields.io/badge/Marketplace-Extension_Nest-007ACC)](https://marketplace.visualstudio.com/items?itemName=Lazenca.extension-nest)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](https://github.com/Li-Lazenca-Qiuqi/Extension-nest/blob/main/LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-Source-181717?logo=github)](https://github.com/Li-Lazenca-Qiuqi/Extension-nest)

[简体中文](https://github.com/Li-Lazenca-Qiuqi/Extension-nest/blob/main/README.md) | [English](https://github.com/Li-Lazenca-Qiuqi/Extension-nest/blob/main/README.en.md)

VS Code has a vast extension ecosystem, and keeping extensions organized becomes harder as your collection grows. Extension Nest helps you organize them with groups and tags, and find what you need through a native sidebar and Dashboard.

## Features

- Group management: create, rename, drag extensions into groups, and reorder them. Each extension belongs to at most one custom group.
- Tags: manual tags and automatic category tags, with search and combined tag filters.
- Dashboard: grouped views, one or two columns, multi-selection, expand/collapse controls, and quick sorting.
- Discovery history: retain groups and tags for previously discovered extensions that are no longer found, and restore their visibility when they reappear.
- Native navigation: click an extension's name or icon to open its native VS Code details page.

## Installation

### Marketplace

[Extension Nest - Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=Lazenca.extension-nest)

### Local VSIX

Run `Extensions: Install from VSIX...`, select the published VSIX file, and reload the window if prompted.

Reference environment: VS Code 1.137.0. The declared version requirement is `^1.137.0`; compatibility with other versions and platforms has not been verified.

## Quick Start

1. Click the Extension Nest icon in the Activity Bar and open the Dashboard.
2. Create groups and drag extensions into them.
3. Edit manual tags or filter by automatic categories.
4. Combine search, Group, and Tags filters to narrow down the list.

## Lists and States

- **Visible**: extensions discovered through the public API of the current local UI extension host in the latest scan. This is the default view.
- **Not found**: retained records of extensions not found in the latest scan. This does not mean they are disabled or uninstalled.
- **All**: all known records, not all installed extensions.

Built-in extensions are hidden by default. Enable `extensionNest.showBuiltinExtensions` to show them.

## Data and Limitations

- Only extensions publicly visible to the current local UI extension host are organized. Remote/Web hosts are not aggregated, and the list is not guaranteed to include every installed or enabled extension.
- Extension Nest does not activate other extensions or provide enable, disable, update, or uninstall operations.
- Organization data and discovery history are stored separately. Only one window can write within the same application storage directory; other windows are read-only. Close the writer window and reload a read-only window to let it acquire write access.
- **Clear old records** only removes legacy organization placeholders without actual discovery history. Deletion is permanent after confirmation, and no backup is created.
- Damaged-data recovery resets only the selected organization data or discovery cache and preserves the other. The confirmation dialog explains what will be lost.

## Source and Feedback

- [GitHub repository](https://github.com/Li-Lazenca-Qiuqi/Extension-nest)
- [Bug reports and feature requests](https://github.com/Li-Lazenca-Qiuqi/Extension-nest/issues)

## Changelog

See [CHANGELOG](CHANGELOG.md).

## License

[MIT](LICENSE).
