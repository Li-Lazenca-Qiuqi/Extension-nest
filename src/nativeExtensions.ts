import * as vscode from 'vscode';
import type { DemoState } from '../demo/src/models';
import { t } from './i18n';

/** 仅允许打开当前清单中的完整扩展 ID，不接受任意命令或 URI。 */
export async function openNativeExtension(id: unknown, state: DemoState): Promise<'Opened' | 'Cancelled' | 'Failed'> {
  if (typeof id !== 'string' || !/^[a-z0-9][a-z0-9-]*\.[a-z0-9][a-z0-9-]*$/i.test(id)
    || !state.extensions.some(extension => extension.id === id)) {
    throw new Error(t('Invalid extension ID.'));
  }
  try {
    await vscode.commands.executeCommand('extension.open', id);
    return 'Opened';
  } catch {
    const recovery = t('Find in VS Code');
    const choice = await vscode.window.showErrorMessage(
      t("Unable to open extension {id}'s native page. Find it in the VS Code Extensions view.", { id }), recovery,
    );
    if (choice === recovery) {
      try {
        await vscode.commands.executeCommand('workbench.extensions.search', `@id:${id}`);
        return 'Opened';
      } catch { return 'Failed'; }
    }
    return 'Cancelled';
  }
}
