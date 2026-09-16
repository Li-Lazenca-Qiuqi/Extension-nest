import * as vscode from 'vscode';

/** 仅检查命令是否注册，不执行管理动作；存在不代表参数、目标或结果已验证。 */
export const PROBE_COMMANDS = [
  'extension.open',
  'workbench.extensions.search',
  'workbench.extensions.action.extensionUpdates',
  'workbench.extensions.action.checkForUpdates',
  'workbench.extensions.action.showEnabledExtensions',
  'workbench.extensions.action.showDisabledExtensions',
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
    enablement: 'Unknown' as const,
    updateState: 'Unknown' as const,
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
      profile: 'Unverified',
      localTarget: 'Unverified',
    },
    inventory: {
      source: 'vscode.extensions.all',
      completeness: 'Unverified',
      count: extensions.length,
      extensions,
    },
    commands: PROBE_COMMANDS.map(id => ({ id, registered: commands.has(id), executed: false })),
    limitations: [
      'API 可见清单未与原生安装清单逐 ID 对照，不能作为完整本地清单。',
      'isActive 仅表示已激活；启用范围、限制原因、待重启与更新结果均未验证。',
      '命令注册检查不证明管理操作成功；本诊断不执行启停、更新或安装。',
      '未采集用户路径、工作区内容、完整 manifest 或私有数据库。',
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
