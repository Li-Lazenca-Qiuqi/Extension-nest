import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** 桌面发行版目录适配：只读随应用分发的 manifest，不按 publisher 猜测，不读取私有安装登记。 */
export function readBundledExtensionIds(appRoot: string): Set<string> {
  const root = join(appRoot, 'extensions');
  const ids = new Set<string>();
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const manifest = JSON.parse(readFileSync(join(root, entry.name, 'package.json'), 'utf8'));
    if (typeof manifest.publisher !== 'string' || typeof manifest.name !== 'string') {
      throw new Error('无法识别应用内置扩展目录，请重试或开启 Show Builtin Extensions。');
    }
    ids.add(`${manifest.publisher}.${manifest.name}`.toLowerCase());
  }
  return ids;
}
