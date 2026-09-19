import { expect, it } from 'vitest';
import { DISCOVERY_KEY, DiscoveryRepository, ORGANIZATION_KEY } from '../../src/discoveryRepository';
import { emptyOrganization } from '../../src/discoveryState';

function setup() {
  const values = new Map<string, unknown>();
  values.set(ORGANIZATION_KEY, { ...emptyOrganization(),
    groups: [{ id: 'g', name: 'Keep', color: '#123456', order: 0 }],
    assignments: { 'old.demo': 'g' }, tags: { 'old.demo': ['Old'] }, extensionOrder: ['old.demo'] });
  const writes: string[] = [];
  const db = { get<T>(key: string) { return values.get(key) as T | undefined; },
    async update(key: string, value: unknown) { writes.push(key); values.set(key, structuredClone(value)); } };
  return { values, writes, db, repo: new DiscoveryRepository(db) };
}
const live = { id: 'real.extension', name: 'Real', publisher: 'real', description: '', version: '1.0.0' };

it('只预览未核验占位，不把 NotVisible、当前发现或内置隐藏项列为残留', async () => {
  const { repo, values } = setup();
  await repo.refresh(() => [live], true);
  await repo.refresh(() => [], true);
  const before = structuredClone([...values]);
  expect(repo.cleanupCandidates().map(e => e.id)).toEqual(['old.demo']);
  expect([...values]).toEqual(before);
  await repo.refresh(() => [], true, () => true, new Set(['old.demo']));
  expect(repo.cleanupCandidates()).toEqual([]);
});

it('直接清理所选元数据且不备份，保留分组和发现历史，重启不重新迁移旧 Demo', async () => {
  const { repo, db, values, writes } = setup();
  values.set('extensionNest.demo.state', { schemaVersion: 1, groups: [], extensions: [{ id: 'old.demo', groupId: null, tags: [] }] });
  await repo.refresh(() => [live], true);
  const history = structuredClone(values.get(DISCOVERY_KEY));
  writes.length = 0;
  expect(await repo.cleanupUnverified(['old.demo'])).toBe(1);
  expect(writes).toEqual([ORGANIZATION_KEY]);
  expect(values.has('extensionNest.cleanupBackups')).toBe(false);
  expect(repo.state.extensions.map(e => e.id)).toEqual([live.id]);
  expect(repo.state.groups).toHaveLength(1);
  expect(values.get(DISCOVERY_KEY)).toEqual(history);
  const restarted = new DiscoveryRepository(db);
  await restarted.refresh(() => [live], true);
  expect(restarted.cleanupCandidates()).toEqual([]);
});

it('预览后变成真实发现时拒绝整批清理', async () => {
  const { repo, values } = setup();
  await repo.refresh(() => [], true);
  await repo.refresh(() => [{ ...live, id: 'old.demo' }], true);
  await expect(repo.cleanupUnverified(['old.demo'])).rejects.toThrow('changed');
  expect(values.has('extensionNest.cleanupBackups')).toBe(false);
});

it('只读、失败和非法混合 ID 均不能清理', async () => {
  const { repo, values } = setup();
  await repo.refresh(() => [], false);
  await expect(repo.cleanupUnverified(['old.demo'])).rejects.toThrow();
  await repo.refresh(() => [], true);
  await expect(repo.cleanupUnverified(['old.demo', 'unknown.extension'])).rejects.toThrow();
  repo.fail(new Error('read failed'));
  await expect(repo.cleanupUnverified(['old.demo'])).rejects.toThrow();
  expect(values.has('extensionNest.cleanupBackups')).toBe(false);
});

it('删除写入失败保留原组织与视图，不创建其他存储键', async () => {
  const { repo, db, values } = setup();
  await repo.refresh(() => [], true);
  const before = structuredClone(repo.state), stored = structuredClone([...values]);
  db.update = async () => { throw new Error('write failed'); };
  await expect(repo.cleanupUnverified(['old.demo'])).rejects.toThrow('write failed');
  expect(repo.state).toEqual(before);
  expect([...values]).toEqual(stored);
});

it('释放宿主后不继续删除', async () => {
  const { repo, values } = setup();
  await repo.refresh(() => [], true);
  const stored = structuredClone([...values]);
  await expect(repo.cleanupUnverified(['old.demo'], () => false)).resolves.toBe(0);
  expect([...values]).toEqual(stored);
  expect(repo.cleanupCandidates()).toHaveLength(1);
});
