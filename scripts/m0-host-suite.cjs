const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const vscode = require('vscode');

/** 仅在独立测试数据目录运行，不接触日常 Profile。 */
exports.run = async function () {
  const root = process.env.EXTENSION_NEST_M0_ROOT;
  const scenario = process.env.EXTENSION_NEST_M0_SCENARIO;
  assert.ok(root && scenario, '缺少隔离测试环境');
  const probe = require(path.join(root, 'probe.cjs'));
  const report = await probe.collectCapabilityProbe();
  const context = await vscode.extensions.getExtension('extension-nest-m0.probe').activate();
  const before = context.globalState.get('m0.marker', null);
  if (scenario === 'baseline') await context.globalState.update('m0.marker', 'baseline');
  if (scenario === 'profile') await context.globalState.update('m0.marker', 'profile');
  const commands = await vscode.commands.getCommands(false);
  const ids = report.inventory.extensions.map(extension => extension.id);
  assert.equal(report.inventory.completeness, 'Unverified');
  const otherProfile = scenario.startsWith('profile');
  assert.equal(ids.includes('extension-nest-m0.inactive'), !otherProfile);
  if (!otherProfile) assert.equal(vscode.extensions.getExtension('extension-nest-m0.inactive').isActive, false);
  assert.equal(ids.includes('extension-nest-m0.disabled'), !otherProfile && scenario !== 'disabled');
  const fixtureCount = ids.filter(id => id.startsWith('extension-nest-m0.') && id !== 'extension-nest-m0.probe').length;
  assert.equal(fixtureCount, otherProfile ? 0 : scenario === 'disabled' ? 49 : 50);
  if (['restart', 'workspace', 'default-return'].includes(scenario)) assert.equal(before, 'baseline');
  if (scenario === 'profile') assert.equal(before, null);
  if (scenario === 'profile-restart') assert.equal(before, 'profile');
  const nativeNavigation = [];
  const inventoryEvents = [];
  if (scenario === 'events') {
    const eventId = 'extension-nest-m0.event-fixture';
    const subscription = vscode.extensions.onDidChange(() => {
      inventoryEvents.push({ at: Date.now(), version: vscode.extensions.getExtension(eventId)?.packageJSON.version ?? null });
    });
    try {
      for (const version of ['1.0.0', '1.1.0']) {
        await vscode.commands.executeCommand('workbench.extensions.installExtension',
          vscode.Uri.file(path.join(root, `event-${version}.vsix`)), { donotSync: true });
        const deadline = Date.now() + 15000;
        while (!inventoryEvents.some(event => event.version === version) && Date.now() < deadline) {
          await new Promise(accept => setTimeout(accept, 100));
        }
        assert.equal(vscode.extensions.getExtension(eventId)?.packageJSON.version, version);
        assert.ok(inventoryEvents.some(event => event.version === version), `未收到 ${version} 事件`);
      }
    } finally { subscription.dispose(); }
  }
  // 只运行导航命令，不触发查询、安装或启停。导航成功不算管理成功。
  for (const [id, args] of [
    ['extension.open', ['extension-nest-m0.inactive']],
    ['workbench.extensions.search', ['@installed']],
    ['workbench.extensions.action.extensionUpdates', []],
  ]) {
    try {
      await vscode.commands.executeCommand(id, ...args);
      nativeNavigation.push({ id, result: 'resolved' });
    } catch (error) {
      nativeNavigation.push({ id, result: 'rejected', message: String(error) });
    }
  }
  await fs.writeFile(path.join(root, `${scenario}.json`), JSON.stringify({
    ...report, scenario, persistedMarkerBefore: before,
    storageProfileSegment: context.globalStorageUri.path.includes('/profiles/') ? 'named' : 'default',
    nativeNavigation, inventoryEvents,
    candidateCommands: commands.filter(id => /extension/i.test(id) && /enable|disable|update|installed|get.*extension/i.test(id)),
  }, null, 2));
};
