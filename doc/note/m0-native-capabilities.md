# M0：原生数据通路调查

> 2026-09-16 范围更新：当前以 [决策 004](../decisions/004-public-vsix-discovery.md) 为准。本页保留历史调查/实现记录，启停、更新及完整安装清单要求不再作为活动首版门槛；新历史标记未由旧证据证明实现。


日期：2026-09-16。状态：静态调查与 8 个隔离真实宿主场景完成；仍缺完整清单、真实启停和更新结果读取通路，M0-01～M0-06 均未达到完整验收条件。原始结果汇总见 [运行证据](evidence/m0-host-2026-09-16.json)。

## 环境与可复现证据

- 本机安装：`D:/其他/Microsoft VS Code/645f29cc31/resources/app`。
- CLI 使用明确路径 `D:/其他/Microsoft VS Code/bin/code.cmd`，仅运行 `--version` 和 `--help`；未调用清单、安装、启停或更新动作。脚本实际指向上述版本目录。
- 版本 `1.137.0`，commit `645f29cc3176500b4b5762ba887cf2a7f0ffdf2c`，quality `stable`。
- 首次静态调查未启动 VS Code；后续自动运行独立开发宿主，所有测试插件、设置与 Profile 均在新建隔离目录内。没有读取私有数据库，没有修改日常用户安装状态、Profile 或自动更新设置。
- 静态检查命令：

```powershell
node scripts/audit-vscode.mjs 'D:/其他/Microsoft VS Code/645f29cc31/resources/app'
```

本轮两个源码文件 SHA-256：

| 文件（相对 resources/app） | SHA-256 |
| --- | --- |
| out/vs/workbench/workbench.desktop.main.js | e416416b1a6db5f181dc90d0096686532a9f57cf08691b8b3a8c5f8d93f47185 |
| out/vs/workbench/api/node/extensionHostProcess.js | adf8ee85beb36d9f55b91593c7d1952e93530ce8fb280025b00e25e3fe74451f |

脚本检测压缩源码中的候选字符串，只辅助人工核对；它不是生产适配器。变量名或打包方式变化可能导致检测失效，字符串出现也不等于命令已注册。不得通过这些检测结果自动开启正式管理能力。

## 关键发现

1. 本机 Extension Host 的 `extensions.all` 实现枚举 `va.mine.getAllExtensionDescriptions()`；这是当前宿主注册表，不是一个经逐 ID 验证的当前 Profile 全量安装接口。`allAcrossExtensionHosts` 分支还要求 proposed API `extensionsAny`，且跨宿主枚举本身也不证明包含全部禁用项。不能直接将现有 Demo 替换为此数组并标记 Complete。
2. 已核对的公开 `Extension` 类型提供 `isActive`，没有完整启停范围、限制原因、待重启、可用更新版本等字段。本机 Workbench 的内部 enablement service 确实计算状态，但尚未找到供普通扩展稳定读取这些结果的公开通路。内部服务存在不等于 Extension API 可调用。
3. **不能将 `workbench.extensions.action.checkForUpdates` 用作只读查询。** 本机实现同时调用 `extensionsWorkbenchService.checkForUpdates()` 和 `pluginInstallService.updateAllPlugins({ silent: true }, …)`，然后打开搜索或提示对话框；未向调用者返回可用于卡片统计的完整更新列表。本轮仅核对源码，未执行该命令，也未验证其运行时更新行为。
4. 本机候选更新列表入口是 `workbench.extensions.action.extensionUpdates`，实现打开 `@updates`。`workbench.extensions.search` 接收搜索字符串；这两个入口只提供原生导航，不提供真实更新状态的读取结果。
5. CLI 帮助列出 `--list-extensions`、`--show-versions`、`--profile` 和更新能力；当前窗口的 Profile 与本地目标仍需可靠定位，不能根据 Shell 路径或目录扫描推断。CLI 清单亦尚未对照禁用、内置、VSIX 和无市场记录等场景。

## M0 对照

| 条目 | 当前证据 | 未解决部分 |
| --- | --- | --- |
| M0-01 | 50 个夹具的 CLI 逐 ID 对照；禁用项从 API 消失已复现 | 自动定位当前 Profile、完整内置/用户清单读取方案及全量对照 |
| M0-02 | 公开类型与内部 enablement 计算已核对 | 可维护的真实状态读取，以及范围、限制与重启实测 |
| M0-03 | 更新查询副作用与原生更新列表入口已定位 | 安全的查询结果读取、单插件更新、离线与无市场行为 |
| M0-04 | 版本/commit、命令注册与三类原生导航成功/缺失目标失败已实测 | 自动 Profile 定位、管理命令目标与完整操作委托验收 |
| M0-05 | 全新命名 Profile 清单/存储隔离、重启与 Workspace 保存已实测 | Remote 窗口本地宿主放置、共享默认扩展的 Profile、多窗口一致性 |
| M0-06 | 本地 VSIX 安装/升级均收到事件并读到版本变化 | 启停/卸载/后台更新事件覆盖、漏事件补读、正式状态同步和树展示 |

阻塞集中在“完整清单及真实启停/更新状态可读”。原生页面委托能够提供操作入口，但不能独立满足 F01/F12/F13/F15 的状态与同步要求。在找到可维护数据源之前，不将跳转成功当成管理成功，不使用私有数据库或猜测状态绕过门槛。此结论是当前调查结果，不宣称已穷尽所有可能方案。

## 只读宿主诊断

新增命令 `extensionNest.inspectCapabilities`，命令面板显示 **Extension Nest: 检查原生数据通路（只读）**。该命令生成未保存的 JSON 文档，不改组织状态或安装状态，不执行候选管理命令，也不主动激活其他扩展。

报告包含当前宿主 API 可见 ID、版本、isActive、extensionKind、位置 URI scheme，以及固定候选命令是否注册。完整性、Profile、本地目标均保持 Unverified，启停与更新保持 Unknown。不输出用户路径、完整 manifest、工作区内容或私有数据库。

下一轮真实宿主采集步骤：

1. 使用现有开发启动配置运行最新构建，执行只读诊断命令。
2. 记录实际窗口 Profile、是否连接 Remote、本地扩展宿主位置；诊断本身不推断这些信息。
3. 将报告与原生本地 Installed 和 Built-in 列表逐 ID 对照，特别记录禁用、未激活、VSIX 和无市场记录条目；不可只比较总数。
4. 对管理流程另用可丢弃测试 Profile 与测试扩展验证，记录操作前后原生状态、候选事件、刷新及重启结果。只读诊断不能替代这部分验收。
5. 另行验证 Profile 切换、普通 Workspace 切换和多窗口写入。未测试场景保持未通过。

上述人工全量验收仍未执行；下面的自动宿主测试已提供独立夹具结果，但不替代用户完整安装清单或全部启停范围的验收。

## 隔离真实宿主结果

测试入口：`scripts/test-m0-host.mjs`；参数为明确的 Code.exe 与 resources/app 路径。运行时创建全新 user-data-dir、extensions-dir、50 个未激活本地测试扩展及独立探针扩展。设置关闭自动更新与遥测，不加载日常 Profile。全部 8 个场景成功退出。

```powershell
node scripts/test-m0-host.mjs 'D:/其他/Microsoft VS Code/Code.exe' 'D:/其他/Microsoft VS Code/645f29cc31/resources/app'
node scripts/summarize-m0-host.mjs '<上一步输出的隔离测试目录>'
```

| 场景 | API 可见总数 | 夹具可见数 | 实际结果 |
| --- | --- | --- | --- |
| baseline | 146 | 50 | 原生 CLI 逐 ID 对齐 50 个夹具；未激活项可见 |
| disabled | 145 | 49 | 启动参数禁用一个夹具后，API 不再返回该 ID |
| restart | 146 | 50 | 重启后 globalState 标记保留 |
| workspace | 146 | 50 | 打开普通 Workspace 后标记保留 |
| profile | 96 | 0 | 新命名 Profile 的清单不含默认 Profile 的夹具，标记为空 |
| profile-restart | 96 | 0 | 命名 Profile 的独立标记重启保留 |
| default-return | 146 | 50 | 回到默认 Profile，原标记与 50 个夹具恢复 |
| events | 146（操作前） | 50（操作前） | 安装本地 VSIX 1.0.0，再安装 1.1.0，两次均读取到新版本且收到 onDidChange |

这里的总数是 API 可见数，不是完整原生安装数。测试没有将内置原生清单逐 ID 对齐；CLI 的 50 项也不能充当含内置项的全量清单。

原生 `extension.open`、`workbench.extensions.search`、`workbench.extensions.action.extensionUpdates` 在目标存在时均完成调用。命名 Profile 不含目标夹具时，`extension.open` 明确失败，而搜索与更新列表导航仍成功。尚未对原生页面布局作视觉验收。

发现测试陷阱：使用 `--extensionTestsPath` 的首轮测试采用内存存储，重启标记断言失败，不能据此判断 globalState 不持久化。正式证据改用独立数据目录下的开发宿主，由探针执行断言并通过 `workbench.action.quit` 正常退出；未使用测试模式读取持久化结论。失败试跑不计入通过数量。

VSIX 只用于测试原生安装/升级事件，不代表已实现 Marketplace 更新查询、后台更新或产品安装入口。禁用通过启动参数复现，不代表持久化全局/Workspace 禁用、依赖限制、信任限制或待重启已通过。多窗口并发、Remote 窗口的本地宿主放置、漏事件补读仍待测。事件时间戳不是延迟测量。

汇总证据已保存且 SHA-256 与运行目录中的 summary.json 一致。清理 4 个本轮隔离目录时自动审批返回 `blocked by policy`，删除未执行，目录暂留 `.m0-runtime/`；两个测试 VSIX 不属于产品交付。Git 忽略运行目录，产品打包明确排除 scripts 与 .m0-runtime，`vsce ls --no-dependencies` 已验证包清单没有测试数据。

## 本轮工程验证

- `npm --prefix demo test`：13 个测试文件、83 项测试通过，包含只读诊断、原生页失败恢复、正式组织数据解析和迁移校验。
- `npm run typecheck`：宿主 TypeScript 检查通过。
- `npm run build`：Dashboard 类型检查、Vite 构建与宿主 esbuild 构建通过。
- 静态检查脚本已对上述安装路径运行成功。没有重新打包产品 VSIX；既有产品 VSIX 不包含本轮变化。
- 单元测试使用替身；上述 8 个场景使用真实 VS Code，并调用实际诊断采集函数。命令面板入口本身仍未人工点击。未更改版本、CHANGELOG 或 Git 提交。

## 官方参考

- [VS Code API](https://code.visualstudio.com/api/references/vscode-api)：公开 Extension、extensions 与事件契约。
- [Built-in Commands](https://code.visualstudio.com/api/references/commands)：仅列出部分命令；没有列出不能单独证明不存在。
- [CLI](https://code.visualstudio.com/docs/configure/command-line)：公开命令行和 Profile 参数。
- [Extension Marketplace](https://code.visualstudio.com/docs/configure/extensions/extension-marketplace)：原生启停及更新流程。
- [Testing Extensions](https://code.visualstudio.com/api/working-with-extensions/testing-extension)：真实扩展宿主测试入口；本次持久化场景改用普通隔离开发宿主，原因见上文。

网页信息与本机静态证据分别使用；网页不能代替目标版本运行验证。
