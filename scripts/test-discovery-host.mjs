import { mkdir, mkdtemp, writeFile, readFile } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const executable = process.argv[2];
if (!executable) throw new Error('用法：node scripts/test-discovery-host.mjs <显式 Code.exe 路径>');
// 普通隔离开发宿主，避免 extensionTestsPath 的内存存储影响重启实验。
await mkdir(join(repo, '.m0-runtime'), { recursive: true });
const root = await mkdtemp(join(repo, '.m0-runtime', 'discovery-'));
console.log(`Discovery artifacts: ${root}`);
const userData = join(root, 'user-data'), extensions = join(root, 'extensions'), probe = join(root, 'probe');
for (const path of [join(userData, 'User'), extensions, probe, join(root, 'workspace')]) await mkdir(path, { recursive: true });
await writeFile(join(userData, 'User', 'settings.json'), JSON.stringify({ 'update.mode': 'none', 'extensions.autoUpdate': false,
  'extensions.autoCheckUpdates': false, 'telemetry.telemetryLevel': 'off', 'workbench.startupEditor': 'none' }));
for (let index = 0; index < 50; index++) {
  const path = join(extensions, `extension-nest-discovery.item-${index}-1.0.0`);
  await mkdir(path);
  await writeFile(join(path, 'package.json'), JSON.stringify({ publisher: 'extension-nest-discovery', name: `item-${index}`,
    version: '1.0.0', engines: { vscode: '^1.137.0' }, main: './index.cjs', activationEvents: [], extensionKind: ['ui'] }));
  await writeFile(join(path, 'index.cjs'), 'exports.activate = () => {};');
}
await writeFile(join(probe, 'package.json'), JSON.stringify({ publisher: 'extension-nest-discovery', name: 'probe', version: '1.0.0',
  engines: { vscode: '^1.137.0' }, main: './index.cjs', activationEvents: ['onStartupFinished'], extensionKind: ['ui'] }));
await writeFile(join(probe, 'index.cjs'), `
const vscode = require('vscode');
const fs = require('node:fs/promises');
exports.activate = () => {
  setTimeout(async () => {
    let outcome;
    try {
      const extension = vscode.extensions.getExtension('Lazenca.extension-nest');
      if (!extension) throw new Error('Target extension missing');
      const api = await extension.activate();
      let state;
      for (let i = 0; i < 100; i++) {
        state = api.getSnapshot();
        if (state.freshness !== 'Loading') break;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      outcome = { passed: state.freshness === 'Ready', vscodeVersion: vscode.version, state,
        fixtureActivity: vscode.extensions.all.filter(e => e.id.startsWith('extension-nest-discovery.item-')).map(e => ({ id: e.id, isActive: e.isActive })),
        commandIds: (await vscode.commands.getCommands(true)).filter(id => id.startsWith('extensionNest.')) };
    } catch (error) { outcome = { passed: false, error: String(error), stack: error.stack }; }
    await fs.writeFile(process.env.EXTENSION_NEST_DISCOVERY_RESULT, JSON.stringify(outcome, null, 2));
    await vscode.commands.executeCommand('workbench.action.quit');
  }, 500);
};
`);
function run(args, outputPath) {
  return new Promise((accept, reject) => {
    const env = { ...process.env, EXTENSION_NEST_DISCOVERY_RESULT: outputPath }; delete env.ELECTRON_RUN_AS_NODE;
    const child = spawn(resolve(executable), args, { env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    child.stdout.on('data', data => { output += data; }); child.stderr.on('data', data => { output += data; });
    const timer = setTimeout(() => { child.kill(); reject(new Error('隔离宿主超时：' + output.slice(-1500))); }, 90000);
    child.on('error', error => { clearTimeout(timer); reject(error); });
    child.on('exit', code => { clearTimeout(timer); code === 0 ? accept() : reject(new Error(`exit=${code}: ${output.slice(-1500)}`)); });
  });
}
const summary = [];
for (const scenario of ['baseline', 'missing', 'restart', 'workspace', 'profile', 'default-return']) {
  console.log(`Running ${scenario}`);
  const outputPath = join(root, scenario + '.json');
  await run(['--user-data-dir', userData, '--extensions-dir', extensions, '--skip-welcome', '--skip-release-notes', '--disable-workspace-trust',
    '--extensionDevelopmentPath=' + repo, '--extensionDevelopmentPath=' + probe,
    '--profile', scenario === 'profile' ? 'Discovery-Other' : 'Default',
    ...(scenario === 'missing' ? ['--disable-extension', 'extension-nest-discovery.item-0'] : []),
    ...(scenario === 'workspace' ? [join(root, 'workspace')] : [])], outputPath);
  const result = JSON.parse(await readFile(outputPath, 'utf8'));
  assert.equal(result.passed, true, JSON.stringify(result));
  assert.equal(result.state.readOnly, false);
  for (const id of ['extensionNest.toggle', 'extensionNest.update', 'extensionNest.resetDemo']) assert.ok(!result.commandIds.includes(id));
  const fixtures = result.state.extensions.filter(e => e.id.startsWith('extension-nest-discovery.item-'));
  if (scenario === 'profile') assert.equal(fixtures.length, 0);
  else {
    assert.equal(fixtures.length, 50);
    assert.equal(fixtures.filter(e => e.visibility === 'NotVisible').length, scenario === 'missing' ? 1 : 0);
    assert.ok(result.fixtureActivity.every(e => !e.isActive));
  }
  summary.push({ scenario, vscodeVersion: result.vscodeVersion, known: result.state.extensions.length, fixtureCount: fixtures.length,
    visible: fixtures.filter(e => e.visibility === 'Visible').length, notVisible: fixtures.filter(e => e.visibility === 'NotVisible').length,
    inactive: result.fixtureActivity.filter(e => !e.isActive).length, passed: true });
}
await writeFile(join(root, 'summary.json'), JSON.stringify({ capturedAt: new Date().toISOString(), executable, scenarios: summary }, null, 2));
console.log(JSON.stringify(summary, null, 2));
