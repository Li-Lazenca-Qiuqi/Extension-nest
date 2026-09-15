import * as vscode from 'vscode';
import type { DemoState } from '../demo/src/models';

/** 仅允许打开当前清单中的完整扩展 ID，不接受任意命令或 URI。 */
export async function openNativeExtension(id: unknown, state: DemoState): Promise<void> {
  if (typeof id !== 'string' || !/^[a-z0-9][a-z0-9-]*\.[a-z0-9][a-z0-9-]*$/i.test(id)
    || !state.extensions.some(extension => extension.id === id)) {
    throw new Error('Invalid extension ID.');
  }
  await vscode.commands.executeCommand('extension.open', id);
}
