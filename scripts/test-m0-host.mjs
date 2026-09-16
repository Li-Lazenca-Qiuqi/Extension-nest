import { mkdir, mkdtemp, writeFile, readFile } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { build } from 'esbuild';
import assert from 'node:assert/strict';
import { createVSIX } from '@vscode/vsce';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const executable = process.argv[2];
const appRoot = process.argv[3];
if (!executable || !appRoot) throw new Error('用法：node scripts/test-m0-host.mjs <Code.exe> <resources/app>');
// 所有写入均在本次新建的目录；不使用已有用户数据目录和扩展目录。
await mkdir(join(repo, '.m0-runtime'), { recursive: true });
const root = await mkdtemp(join(repo, '.m0-runtime', 'run-'));
console.log(`M0 artifacts: ${root}`);
const userData = join(root, 'user-data');
const extensions = join(root, 'extensions');
const probe = join(root, 'probe');
const workspace = join(root, 'workspace');
for (const directory of [userData, extensions, probe, workspace]) await mkdir(directory, { recursive: true });
await mkdir(join(userData, 'User'), { recursive: true });
await writeFile(join(userData, 'User', 'settings.json'), JSON.stringify({
  'update.mode': 'none', 'extensions.autoUpdate': false, 'extensions.autoCheckUpdates': false,
  'telemetry.telemetryLevel': 'off', 'workbench.startupEditor': 'none',
}));
const fixtureNames = ['inactive', 'disabled', ...Array.from({ length: 48 }, (_, index) => `sample-${index + 3}`)];
for (const name of ['probe', ...fixtureNames]) {
  const directory = name === 'probe' ? probe : join(extensions, `extension-nest-m0.${name}-1.0.0`);
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, 'package.json'), JSON.stringify({
    name, publisher: 'extension-nest-m0', version: '1.0.0', engines: { vscode: '^1.137.0' },
    main: './index.cjs', activationEvents: name === 'probe' ? ['onStartupFinished'] : [],
    extensionKind: ['ui'],
  }));
  await writeFile(join(directory, 'index.cjs'), name === 'probe' ? `
const fs = require('node:fs/promises');
const path = require('node:path');
const vscode = require('vscode');
exports.activate = context => {
  setTimeout(async () => {
    let outcome;
    try {
      await require(${JSON.stringify(join(repo, 'scripts/m0-host-suite.cjs'))}).run();
      outcome = { passed: true };
    } catch (error) { outcome = { passed: false, error: String(error), stack: error.stack }; }
    await fs.writeFile(path.join(process.env.EXTENSION_NEST_M0_ROOT, process.env.EXTENSION_NEST_M0_SCENARIO + '.outcome.json'), JSON.stringify(outcome));
    await vscode.commands.executeCommand('workbench.action.quit');
  }, 100);
  return context;
};
` : 'exports.activate = context => context;\n');
}
await build({ entryPoints: [join(repo, 'src/capabilityProbe.ts')], outfile: join(root, 'probe.cjs'),
  bundle: true, platform: 'node', format: 'cjs', external: ['vscode'] });
const eventFixture = join(root, 'event-fixture');
await mkdir(eventFixture);
await writeFile(join(eventFixture, 'index.cjs'), 'exports.activate = () => {};\n');
await writeFile(join(eventFixture, 'README.md'), '# M0 Event Fixture\n\n仅用于隔离宿主测试。\n');
for (const version of ['1.0.0', '1.1.0']) {
  await writeFile(join(eventFixture, 'package.json'), JSON.stringify({
    name: 'event-fixture', publisher: 'extension-nest-m0', version, engines: { vscode: '^1.137.0' },
    main: './index.cjs', activationEvents: [], extensionKind: ['ui'], license: 'UNLICENSED',
  }));
  await createVSIX({ cwd: eventFixture, packagePath: join(root, `event-${version}.vsix`),
    dependencies: false, allowMissingRepository: true, skipLicense: true });
}

function run(args, extraEnv = {}) {
  return new Promise((accept, reject) => {
    const env = { ...process.env, ...extraEnv };
    if (!extraEnv.ELECTRON_RUN_AS_NODE) delete env.ELECTRON_RUN_AS_NODE;
    const child = spawn(resolve(executable), args, { env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    child.stdout.on('data', data => { output += data; });
    child.stderr.on('data', data => { output += data; });
    const timer = setTimeout(() => { child.kill(); reject(new Error(`测试超时：${output.slice(-3000)}`)); }, 90000);
    child.on('error', error => { clearTimeout(timer); reject(error); });
    child.on('exit', code => { clearTimeout(timer); code === 0 ? accept(output) : reject(new Error(`exit=${code}\n${output.slice(-5000)}`)); });
  });
}
const common = ['--user-data-dir', userData, '--extensions-dir', extensions];
const cli = async (...args) => run([join(resolve(appRoot), 'out/cli.js'), ...common, ...args], { ELECTRON_RUN_AS_NODE: '1' });
const cliInventory = await cli('--list-extensions', '--show-versions');
await writeFile(join(root, 'cli-installed.txt'), cliInventory);
const cliIds = cliInventory.split(/\r?\n/).filter(line => line.startsWith('extension-nest-m0.')).map(line => line.split('@')[0]).sort();
assert.deepEqual(cliIds, fixtureNames.map(name => `extension-nest-m0.${name}`).sort());
console.log(`CLI fixture count: ${cliIds.length}`);
for (const scenario of ['baseline', 'disabled', 'restart', 'workspace', 'profile', 'profile-restart', 'default-return', 'events']) {
  console.log(`Running ${scenario}`);
  const output = await run([...common, '--skip-welcome', '--skip-release-notes', '--disable-workspace-trust',
    // extensionTestsPath 会启用内存存储，不能用来验证重启持久化。
    '--extensionDevelopmentPath=' + probe,
    ...(scenario === 'disabled' ? ['--disable-extension', 'extension-nest-m0.disabled'] : []),
    ...(scenario.startsWith('profile') ? ['--profile', 'M0-Other'] : ['--profile', 'Default']),
    ...(scenario === 'workspace' ? [workspace] : []),
  ], { EXTENSION_NEST_M0_ROOT: root, EXTENSION_NEST_M0_SCENARIO: scenario });
  await writeFile(join(root, `${scenario}.log`), output);
  const outcome = JSON.parse(await readFile(join(root, `${scenario}.outcome.json`), 'utf8'));
  if (!outcome.passed) throw new Error(outcome.stack ?? outcome.error);
  const report = JSON.parse(await readFile(join(root, `${scenario}.json`), 'utf8'));
  console.log(JSON.stringify({ scenario, count: report.inventory.count, marker: report.persistedMarkerBefore,
    navigation: report.nativeNavigation }));
  if (scenario === 'profile') {
    const profileInventory = await cli('--list-extensions', '--show-versions', '--profile', 'M0-Other');
    await writeFile(join(root, 'cli-profile.txt'), profileInventory);
    assert.equal(profileInventory.includes('extension-nest-m0.'), false);
  }
}
console.log('M0 host scenarios passed.');
