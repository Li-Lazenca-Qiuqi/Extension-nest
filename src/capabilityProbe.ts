import * as vscode from 'vscode';
import { t } from './i18n';

/** 仅检查命令是否注册，不执行管理动作；存在不代表参数、目标或结果已验证。 */
export const PROBE_COMMANDS = [
  'extension.open',
  'workbench.extensions.search',
] as const;

/** 快照只反映当前宿主可见 API；不推断完整安装清单、Profile、启停或更新状态。 */
export async function collectCapabilityProbe() {
  const commands = new Set(await vscode.commands.getCommands(true));
  const extensions = vscode.extensions.all.map(extension => ({
    id: extension.id,
    version: typeof extension.packageJSON?.version === 'string'
      ? extension.packageJSON.version : null,
    isActive: extension.isActive,
    extensionKind: extension.extensionKind,
    locationScheme: extension.extensionUri.scheme,
  })).sort((left, right) => left.id.localeCompare(right.id));

  return {
    schemaVersion: 1,
    capturedAt: new Date().toISOString(),
    environment: {
      vscodeVersion: vscode.version,
      appName: vscode.env.appName,
      uiKind: vscode.env.uiKind,
      remoteName: vscode.env.remoteName ?? null,
      // remoteName 描述窗口连接，不能单独证明本扩展运行于本地宿主。
      processPlatform: process.platform,
      profile: t('Unverified'),
      localTarget: t('Unverified'),
    },
    inventory: {
      source: 'vscode.extensions.all',
      completeness: t('Unverified'),
      count: extensions.length,
      extensions,
    },
    commands: PROBE_COMMANDS.map(id => ({ id, registered: commands.has(id), executed: false })),
    limitations: [
      t('The visible API inventory was not compared with the native installation inventory by ID, so it is not a complete local inventory.'),
      t('isActive only indicates activation; enabled scope, restriction reasons, restart requirements, and update results were not verified.'),
      t('Checking command registration does not prove management success; this diagnostic does not start, stop, update, or install extensions.'),
      t('User paths, workspace contents, complete manifests, and private databases were not collected.'),
    ],
  };
}

/** 生成未保存的 JSON 文档，只有用户主动保存时才形成文件。 */
export async function showCapabilityProbe(): Promise<void> {
  const report = await collectCapabilityProbe();
  const document = await vscode.workspace.openTextDocument({
    language: 'json',
    content: JSON.stringify(report, null, 2),
  });
  await vscode.window.showTextDocument(document, { preview: false });
}
