import { expect, it, vi } from 'vitest';
const fs = vi.hoisted(() => ({ readdirSync: vi.fn(), readFileSync: vi.fn() }));
vi.mock('node:fs', () => fs);
import { readBundledExtensionIds } from '../../src/bundledExtensions';

it('忽略依赖目录，仅由随应用分发的 manifest 识别 ID', () => {
  fs.readdirSync.mockReturnValue(['git', 'node_modules', '.cache'].map(name => ({ name, isDirectory: () => true })));
  fs.readFileSync.mockReturnValue(JSON.stringify({ publisher: 'vscode', name: 'git' }));
  expect([...readBundledExtensionIds('C:/Code/resources/app')]).toEqual(['vscode.git']);
  expect(fs.readFileSync).toHaveBeenCalledTimes(1);
});

it('目录损坏不能伪装成成功空目录', () => {
  fs.readdirSync.mockImplementation(() => { throw new Error('unavailable'); });
  expect(() => readBundledExtensionIds('C:/Missing')).toThrow('unavailable');
});
