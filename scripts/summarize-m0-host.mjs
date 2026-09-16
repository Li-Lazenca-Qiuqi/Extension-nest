import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';

const root = process.argv[2];
if (!root) throw new Error('用法：node scripts/summarize-m0-host.mjs <本次隔离测试目录>');
const scenarios = ['baseline', 'disabled', 'restart', 'workspace', 'profile', 'profile-restart', 'default-return', 'events'];
const cli = await readFile(join(root, 'cli-installed.txt'), 'utf8');
const cliIds = cli.split(/\r?\n/).filter(line => line.startsWith('extension-nest-m0.')).map(line => line.split('@')[0]).sort();
assert.equal(cliIds.length, 50);
const results = [];
for (const scenario of scenarios) {
  const report = JSON.parse(await readFile(join(root, `${scenario}.json`), 'utf8'));
  const outcome = JSON.parse(await readFile(join(root, `${scenario}.outcome.json`), 'utf8'));
  assert.equal(outcome.passed, true);
  const fixtureIds = report.inventory.extensions.map(extension => extension.id)
    .filter(id => id.startsWith('extension-nest-m0.') && id !== 'extension-nest-m0.probe').sort();
  const expectedIds = scenario.startsWith('profile') ? []
    : cliIds.filter(id => scenario !== 'disabled' || id !== 'extension-nest-m0.disabled');
  assert.deepEqual(fixtureIds, expectedIds);
  for (const navigation of report.nativeNavigation) {
    const expected = scenario.startsWith('profile') && navigation.id === 'extension.open' ? 'rejected' : 'resolved';
    assert.equal(navigation.result, expected);
  }
  results.push({ scenario, capturedAt: report.capturedAt, vscodeVersion: report.environment.vscodeVersion,
    apiVisibleCount: report.inventory.count, fixtureCount: fixtureIds.length,
    missingFixtureIds: cliIds.filter(id => !fixtureIds.includes(id)),
    persistedMarkerBefore: report.persistedMarkerBefore, storageProfileSegment: report.storageProfileSegment,
    nativeNavigation: report.nativeNavigation, inventoryEvents: report.inventoryEvents,
  });
}
const summary = { schemaVersion: 1, fixtureCount: cliIds.length, cliIds, results,
  limitations: [
    '禁用通过启动参数复现，不代表 Workspace 或持久化全局禁用已测。',
    'VSIX 为隔离的本地测试扩展；不等于 Marketplace 查询或后台更新已测。',
    '事件时间戳不能用于推断原生事件通知延迟。',
    '没有读取完整原生内置清单、远端宿主或验证多窗口并发。',
    '导航 Promise 完成不等于启停或更新成功。',
  ],
};
await writeFile(join(root, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(resolve(root, 'summary.json'));
