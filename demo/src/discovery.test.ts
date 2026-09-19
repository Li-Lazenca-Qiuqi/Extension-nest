import { describe, expect, it } from 'vitest';
import { DiscoveryRepository, DISCOVERY_KEY, ORGANIZATION_KEY } from '../../src/discoveryRepository';
import { emptyCache, emptyOrganization, observe, parseDiscoveryCache, projectDiscovery, type Observation } from '../../src/discoveryState';
import { WriterLease } from '../../src/writerLease';
import { reducer } from './state';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';

const item: Observation = { id: 'test.one', name: 'One', publisher: 'test', version: '1.0.0', description: '' };
function storage() {
  const values = new Map<string, unknown>();
  return { values, get<T>(key: string) { return values.get(key) as T | undefined; }, async update(key: string, value: unknown) { values.set(key, structuredClone(value)); } };
}

describe('公开发现与组织存储', () => {
  it('内置过滤同步统计且不删除隐藏项的组织数据，显示开关可恢复历史项', async () => {
    const db = storage(), repo = new DiscoveryRepository(db);
    const builtin = { ...item, id: 'vscode.git' };
    const user = { ...item, id: 'ms-python.python' };
    await repo.refresh(() => [builtin, user], true);
    await repo.save(reducer(repo.state, { type: 'createGroup', name: 'Keep' }));
    await repo.save(reducer(repo.state, { type: 'move', ids: [builtin.id], groupId: 'group-keep' }));
    await repo.save(reducer(repo.state, { type: 'setTags', ids: [builtin.id], tags: ['Internal'] }));
    await repo.refresh(() => [user], true, () => true, new Set([builtin.id]));
    expect(repo.state.extensions.map(e => e.id)).toEqual([user.id]);
    await repo.save(reducer(repo.state, { type: 'setTags', ids: [user.id], tags: ['User'] }));
    await repo.refresh(() => [user], true);
    expect(repo.state.extensions.map(e => e.id)).toEqual([builtin.id, user.id]);
    expect(repo.state.extensions.find(e => e.id === builtin.id)).toMatchObject({ visibility: 'NotVisible', groupId: 'group-keep', tags: ['Internal'] });
    expect(repo.state.extensions.find(e => e.id === user.id)?.tags).toEqual(['User']);
  });
  it('首次不加载示例，成功空快照有明确 Ready', async () => {
    const repo = new DiscoveryRepository(storage());
    expect(repo.state.extensions).toEqual([]);
    await repo.refresh(() => [], true);
    expect(repo.state).toMatchObject({ freshness: 'Ready', extensions: [] });
  });
  it('消失保留历史、组和标签，重现更新版本', async () => {
    const db = storage(), repo = new DiscoveryRepository(db);
    await repo.refresh(() => [item], true);
    await repo.save(reducer(repo.state, { type: 'createGroup', name: 'Test' }));
    await repo.save(reducer(repo.state, { type: 'move', ids: [item.id], groupId: repo.state.groups[0].id }));
    await repo.save(reducer(repo.state, { type: 'setTags', ids: [item.id], tags: [' Research '] }));
    const history = structuredClone(db.values.get(DISCOVERY_KEY));
    await repo.refresh(() => [], true);
    expect(repo.state.extensions[0]).toMatchObject({ visibility: 'NotVisible', tags: ['Research'], groupId: 'group-test' });
    expect(db.values.get(DISCOVERY_KEY)).toEqual(history);
    await repo.refresh(() => [{ ...item, version: '2.0.0' }], true);
    expect(repo.state.extensions[0]).toMatchObject({ visibility: 'Visible', version: '2.0.0', tags: ['Research'], groupId: 'group-test' });
    expect(JSON.stringify(db.values.get(ORGANIZATION_KEY))).not.toMatch(/visibility|version|lastSeen/);
  });
  it('迁移只保留组织，不把 Demo 版本当发现事实', async () => {
    const db = storage();
    db.values.set('extensionNest.demo.state', { schemaVersion: 1, groups: [], extensions: [{ ...item, groupId: null, tags: ['Old'], enabled: true }] });
    const repo = new DiscoveryRepository(db);
    await repo.refresh(() => [], true);
    expect(repo.state.extensions[0]).toMatchObject({ visibility: 'Unverified', version: '—', tags: ['Old'] });
    expect(db.values.get(DISCOVERY_KEY)).toEqual(emptyCache());
  });
  it('部分失败和读取异常不覆盖成功快照或时间', async () => {
    const db = storage(), repo = new DiscoveryRepository(db);
    await repo.refresh(() => [item], true);
    const successful = structuredClone(repo.state), history = structuredClone(db.values.get(DISCOVERY_KEY));
    await repo.refresh(() => [item, { ...item, id: 'bad' }], true);
    expect(repo.state).toMatchObject({ freshness: 'Stale', extensions: successful.extensions, lastSuccessfulAt: successful.lastSuccessfulAt });
    expect(db.values.get(DISCOVERY_KEY)).toEqual(history);
    await repo.refresh(() => { throw new Error('read failed'); }, true);
    expect(repo.state.extensions).toEqual(successful.extensions);
  });
  it('持久化失败不发布消失，重试成功后恢复', async () => {
    const db = storage(), repo = new DiscoveryRepository(db);
    await repo.refresh(() => [item], true);
    const write = db.update;
    db.update = async () => { throw new Error('disk'); };
    await repo.refresh(() => [], true);
    expect(repo.state).toMatchObject({ freshness: 'Stale', extensions: [expect.objectContaining({ visibility: 'Visible' })] });
    db.update = write;
    await repo.refresh(() => [], true);
    expect(repo.state).toMatchObject({ freshness: 'Ready', readOnly: false, extensions: [expect.objectContaining({ visibility: 'NotVisible' })] });
  });
  it('坏组织或缓存不会 seed 覆盖，首次读取失败显示 Error', async () => {
    for (const key of [ORGANIZATION_KEY, DISCOVERY_KEY]) {
      const db = storage(); db.values.set(key, { schemaVersion: 99 });
      const repo = new DiscoveryRepository(db);
      await repo.refresh(() => [item], true);
      expect(repo.state).toMatchObject({ freshness: 'Error', readOnly: true, extensions: [] });
      expect(db.values.get(key)).toEqual({ schemaVersion: 99 });
    }
  });
  it('只读窗口可发现但不写任何键或编辑组织', async () => {
    const db = storage(), repo = new DiscoveryRepository(db);
    await repo.refresh(() => [item], false);
    expect(repo.state.extensions[0].visibility).toBe('Visible');
    expect(db.values.size).toBe(0);
    await expect(repo.save(repo.state)).rejects.toThrow('read-only');
    await repo.refresh(() => [], false);
    expect(repo.state.extensions[0].visibility).toBe('NotVisible');
  });
  it('缓存损坏仍显示有效组织占位，保留原始坏值', async () => {
    const db = storage();
    db.values.set(ORGANIZATION_KEY, { ...emptyOrganization(), tags: { [item.id]: ['Keep'] } });
    db.values.set(DISCOVERY_KEY, { schemaVersion: 99 });
    const repo = new DiscoveryRepository(db);
    await repo.refresh(() => [item], true);
    expect(repo.state.extensions[0]).toMatchObject({ id: item.id, visibility: 'Unverified', tags: ['Keep'] });
    expect(repo.state.readOnly).toBe(true);
    expect(db.values.get(DISCOVERY_KEY)).toEqual({ schemaVersion: 99 });
  });
  it('失效上下文在异步写后不发布旧结果', async () => {
    const db = storage(); let current = true;
    db.update = async (key, value) => { db.values.set(key, value); current = false; };
    const repo = new DiscoveryRepository(db);
    await repo.refresh(() => [item], true, () => current);
    expect(repo.state.extensions).toEqual([]);
    expect(db.values.has(DISCOVERY_KEY)).toBe(false);
  });
  it('缓存校验拒绝伪造来源、无效时间、重复 ID，首次读前不推断 NotVisible', () => {
    const cache = observe(emptyCache(), [item], '2026-09-16T00:00:00.000Z');
    expect(projectDiscovery(emptyOrganization(), cache).extensions[0].visibility).toBe('Unverified');
    expect(() => parseDiscoveryCache({ ...cache, records: { [item.id]: { ...cache.records[item.id], source: 'seed' } } })).toThrow();
    expect(() => observe(cache, [item, { ...item, id: 'TEST.ONE' }], '2026-09-17T00:00:00.000Z')).toThrow();
  });
  it('50 个夹具整批消失与重现没有重复历史', async () => {
    const repo = new DiscoveryRepository(storage());
    const fixtures = Array.from({ length: 50 }, (_, i) => ({ ...item, id: `fixture.item-${i}` }));
    await repo.refresh(() => fixtures, true);
    await repo.refresh(() => fixtures.slice(0, 25), true);
    expect(repo.state.extensions.filter(e => e.visibility === 'NotVisible')).toHaveLength(25);
    await repo.refresh(() => fixtures, true);
    expect(repo.state.extensions).toHaveLength(50);
    expect(repo.state.extensions.every(e => e.visibility === 'Visible')).toBe(true);
  });
});

it('独立进程占用写者锁时本进程只能只读', async () => {
  const namespace = `cross-process-${process.pid}-${Date.now()}`;
  const hash = createHash('sha256').update(namespace).digest('hex');
  const address = process.platform === 'win32' ? `\\\\.\\pipe\\extension-nest-${hash}`
    : { host: '127.0.0.1', port: 20000 + Number.parseInt(hash.slice(0, 4), 16) % 40000 };
  const child = spawn(process.execPath, ['-e', `require('node:net').createServer(s=>s.destroy()).listen(${JSON.stringify(address)},()=>process.stdout.write('ready'));`], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  const lease = new WriterLease(namespace);
  try {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('子进程锁超时')), 5000);
      child.stdout.once('data', () => { clearTimeout(timeout); resolve(); });
      child.once('error', error => { clearTimeout(timeout); reject(error); });
      child.once('exit', code => { clearTimeout(timeout); reject(new Error(`子进程退出 ${code}`)); });
    });
    expect(await lease.acquire()).toBe(false);
  } finally {
    lease.dispose();
    await new Promise<void>(resolve => { child.once('exit', () => resolve()); child.kill(); });
  }
});

it('应用级租约拒绝第二写者并在释放后可重新获得', async () => {
  const namespace = `test-${process.pid}-${Date.now()}`;
  const first = new WriterLease(namespace), second = new WriterLease(namespace);
  try {
    expect(await first.acquire()).toBe(true);
    expect(await second.acquire()).toBe(false);
    first.dispose();
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(await second.acquire()).toBe(true);
  } finally { first.dispose(); second.dispose(); }
});
