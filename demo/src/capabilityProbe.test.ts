import { beforeEach, expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => ({
  getCommands: vi.fn(),
  executeCommand: vi.fn(),
  activate: vi.fn(),
  openTextDocument: vi.fn(),
  showTextDocument: vi.fn(),
}));

vi.mock('vscode', () => ({
  version: '1.137.0',
  env: { language: 'en', appName: 'Visual Studio Code', uiKind: 1, remoteName: 'ssh-remote' },
  commands: mock,
  extensions: { all: [{
    id: 'sample.inactive', isActive: false, extensionKind: 2,
    extensionUri: { scheme: 'vscode-remote', fsPath: '/private/path' },
    packageJSON: { version: '1.0.0', privateValue: 'must-not-leak' },
    activate: mock.activate,
  }] },
  workspace: { openTextDocument: mock.openTextDocument },
  window: { showTextDocument: mock.showTextDocument },
}));

import { collectCapabilityProbe, showCapabilityProbe } from '../../src/capabilityProbe';

beforeEach(() => {
  vi.clearAllMocks();
  mock.getCommands.mockResolvedValue(['extension.open', 'unrelated.command']);
  mock.openTextDocument.mockResolvedValue({ uri: 'untitled:probe' });
});

it('不把未激活或远端窗口信息推断成禁用状态和本地目标', async () => {
  const report = await collectCapabilityProbe();
  expect(report.environment.localTarget).toBe('Unverified');
  expect(report.environment.profile).toBe('Unverified');
  expect(report.inventory.completeness).toBe('Unverified');
  expect(report.inventory.extensions[0]).toMatchObject({
    isActive: false,
  });
  expect(mock.activate).not.toHaveBeenCalled();
  expect(mock.executeCommand).not.toHaveBeenCalled();
  expect(JSON.stringify(report)).not.toMatch(/private.path|must-not-leak|privateValue/);
});

it('区分已注册与缺失命令，且从不执行候选命令', async () => {
  const report = await collectCapabilityProbe();
  expect(report.commands.find(command => command.id === 'extension.open'))
    .toEqual({ id: 'extension.open', registered: true, executed: false });
  expect(report.commands.find(command => command.id === 'workbench.extensions.search'))
    .toMatchObject({ registered: false, executed: false });
  expect(mock.executeCommand).not.toHaveBeenCalled();
});

it('命令读取失败时传播错误，不生成虚假的成功报告', async () => {
  mock.getCommands.mockRejectedValueOnce(new Error('Unavailable'));
  await expect(showCapabilityProbe()).rejects.toThrow('Unavailable');
  expect(mock.openTextDocument).not.toHaveBeenCalled();
});

it('只打开未保存报告，不写入组织状态', async () => {
  await showCapabilityProbe();
  expect(mock.openTextDocument).toHaveBeenCalledWith({
    language: 'json', content: expect.stringContaining('"completeness": "Unverified"'),
  });
  expect(mock.showTextDocument).toHaveBeenCalledWith({ uri: 'untitled:probe' }, { preview: false });
  expect(mock.executeCommand).not.toHaveBeenCalled();
});
