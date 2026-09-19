import * as vscode from 'vscode';
import type { DemoState } from '../demo/src/models';
import { t } from './i18n';

type NavigationResult = 'Opened' | 'Cancelled' | 'Failed';
const pending = new Map<string, Promise<NavigationResult>>();

/** 仅允许打开当前清单中的完整扩展 ID，不接受任意命令或 URI。 */
export async function openNativeExtension(id: unknown, state: DemoState): Promise<NavigationResult> {
  if (typeof id !== 'string' || !/^[a-z0-9][a-z0-9-]*\.[a-z0-9][a-z0-9-]*$/i.test(id)
    || !state.extensions.some(extension => extension.id === id)) {
    throw new Error(t('Invalid extension ID.'));
  }
  const existing = pending.get(id);
  if (existing) return existing;
  const request = navigate(id);
  pending.set(id, request);
  try { return await request; }
  finally { if (pending.get(id) === request) pending.delete(id); }
}

async function navigate(id: string): Promise<NavigationResult> {
  // 内部导航命令直接使用原生已安装模型；不存在或目标缺失时回退商店入口。
  // 返回仅表示导航委托完成，不能证明页面渲染完成或绑定物理本地副本。
  try {
    await vscode.commands.executeCommand('_extensions.manage', id);
    return 'Opened';
  } catch { /* 历史条目及不支持此命令的版本仍可尝试原有导航。 */ }
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
