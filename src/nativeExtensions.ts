import * as vscode from 'vscode';
import type { DemoState } from '../demo/src/models';

/** 仅允许打开当前清单中的完整扩展 ID，不接受任意命令或 URI。 */
export async function openNativeExtension(id: unknown, state: DemoState): Promise<void> {
  if (typeof id !== 'string' || !/^[a-z0-9][a-z0-9-]*\.[a-z0-9][a-z0-9-]*$/i.test(id)
    || !state.extensions.some(extension => extension.id === id)) {
    throw new Error('Invalid extension ID.');
  }
  try {
    await vscode.commands.executeCommand('extension.open', id);
  } catch {
    const recovery = '在 VS Code 中查找';
    const choice = await vscode.window.showErrorMessage(
      `无法打开扩展 ${id} 的原生页面。可以在 VS Code 扩展视图中查找。`, recovery,
    );
    if (choice === recovery) {
      await vscode.commands.executeCommand('workbench.extensions.search', `@id:${id}`);
    }
  }
}
