import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

// 显式指定 resources/app，避免默认 Shell 中的 code 指向其他版本或宿主。
const appRoot = process.argv[2];
if (!appRoot) {
  throw new Error('用法：node scripts/audit-vscode.mjs <VS Code resources/app 路径>');
}
const read = path => readFile(resolve(appRoot, path), 'utf8');
const [packageText, productText, workbench, host] = await Promise.all([
  read('package.json'), read('product.json'),
  read('out/vs/workbench/workbench.desktop.main.js'),
  read('out/vs/workbench/api/node/extensionHostProcess.js'),
]);
const product = JSON.parse(productText);
const commandIds = [...new Set([...workbench.matchAll(
  /"((?:workbench\.extensions\.|extension\.)[^"\s]{1,100})"/g,
)].map(match => match[1]))].sort();
const checkUpdatesStart = workbench.indexOf('id:"workbench.extensions.action.checkForUpdates"');
const checkUpdatesRegion = checkUpdatesStart < 0 ? '' : workbench.slice(checkUpdatesStart, checkUpdatesStart + 1200);

console.log(JSON.stringify({
  capturedAt: new Date().toISOString(),
  version: JSON.parse(packageText).version,
  commit: product.commit,
  quality: product.quality,
  workbenchSha256: createHash('sha256').update(workbench).digest('hex'),
  extensionHostSha256: createHash('sha256').update(host).digest('hex'),
  sourceObservations: {
    hostInventoryUsesMineRegistry: host.includes('for(let C of va.mine.getAllExtensionDescriptions())'),
    checkForUpdatesMentionsPluginUpdate: checkUpdatesRegion.includes('pluginInstallService.updateAllPlugins'),
    workbenchHasEnablementService: workbench.includes('getEnablementState('),
  },
  commandIds,
  limitations: [
    '仅对指定安装版本做静态字符串核对，不证明命令已注册或调用成功。',
    '压缩变量名和布局变化会使检测失效；false 不代表能力不存在。',
    '未读取安装清单、用户配置、私有数据库，未调用任何管理动作。',
  ],
}, null, 2));
