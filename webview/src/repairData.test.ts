import { expect, it } from 'vitest';
import { DiscoveryRepository, ORGANIZATION_KEY, DISCOVERY_KEY } from '../../src/discoveryRepository';
import { emptyCache, emptyOrganization } from '../../src/discoveryState';

function storage() {
  const values = new Map<string, unknown>();
  return { values, get<T>(key: string) { return values.get(key) as T | undefined; },
    async update(key: string, value: unknown) { values.set(key, structuredClone(value)); } };
}

it.each(['organization', 'discovery'] as const)('仅重置损坏的 %s 并保留另一份数据',async target=>{
  const db=storage(), repo=new DiscoveryRepository(db);
  const other=target==='organization'?DISCOVERY_KEY:ORGANIZATION_KEY;
  const key=target==='organization'?ORGANIZATION_KEY:DISCOVERY_KEY;
  db.values.set(key,{schemaVersion:99});
  const kept=target==='organization'?emptyCache():{...emptyOrganization(),tags:{'test.one':['Keep']}};
  db.values.set(other,kept);
  await repo.refresh(()=>[],true);
  expect(repo.state).toMatchObject({damagedData:[target],canRepair:true,readOnly:true});
  const [candidate]=repo.repairCandidates();
  expect(db.values.get(key)).toEqual({schemaVersion:99});
  await repo.resetDamaged(candidate,true);
  expect(db.values.get(other)).toEqual(kept);
  expect(db.values.get(key)).toEqual(target==='organization'?emptyOrganization():emptyCache());
  await repo.refresh(()=>[],true);
  expect(repo.state.freshness).toBe('Ready');
  expect(repo.state.damagedData).toBeUndefined();
});

it('两份均损坏时逐项确认重置，不自动清空另一份',async()=>{
  const db=storage(),repo=new DiscoveryRepository(db);
  db.values.set(ORGANIZATION_KEY,{bad:1});db.values.set(DISCOVERY_KEY,{bad:2});
  await repo.refresh(()=>[],true);
  expect(repo.state.damagedData).toEqual(['organization','discovery']);
  await repo.resetDamaged(repo.repairCandidates()[0],true);
  expect(db.values.get(DISCOVERY_KEY)).toEqual({bad:2});
  await repo.refresh(()=>[],true);
  expect(repo.state.damagedData).toEqual(['discovery']);
});

it('旧迁移配置损坏时写入新的空组织，重启不会再次迁移坏配置',async()=>{
  const db=storage(),repo=new DiscoveryRepository(db);
  db.values.set('extensionNest.demo.state',{bad:true});
  await repo.resetDamaged(repo.repairCandidates()[0],true);
  expect(db.values.get('extensionNest.demo.state')).toEqual({bad:true});
  const restarted=new DiscoveryRepository(db);
  expect(restarted.repairCandidates()).toEqual([]);
  await restarted.refresh(()=>[],true);
  expect(restarted.state.freshness).toBe('Ready');
});

it('有效或缺失数据不是损坏；确认后变化、只读、失效或写入失败均不误删',async()=>{
  const db=storage(),repo=new DiscoveryRepository(db);
  expect(repo.repairCandidates()).toEqual([]);
  db.values.set(DISCOVERY_KEY,{bad:1});
  const [candidate]=repo.repairCandidates();
  await repo.refresh(()=>[],false);
  expect(repo.state.canRepair).toBe(false);
  await expect(repo.resetDamaged(candidate,false)).rejects.toThrow('writable');
  await repo.resetDamaged(candidate,true,()=>false);
  expect(db.values.get(DISCOVERY_KEY)).toEqual({bad:1});
  db.values.set(DISCOVERY_KEY,{bad:2});
  await expect(repo.resetDamaged(candidate,true)).rejects.toThrow('changed');
  db.values.set(DISCOVERY_KEY,emptyCache());
  await expect(repo.resetDamaged(candidate,true)).rejects.toThrow('changed');
  db.values.set(DISCOVERY_KEY,{bad:1});
  db.update=async()=>{throw new Error('disk')};
  await expect(repo.resetDamaged(candidate,true)).rejects.toThrow('disk');
  expect(db.values.get(DISCOVERY_KEY)).toEqual({bad:1});
});

it('普通发现错误不提供破坏性恢复入口',async()=>{
  const repo=new DiscoveryRepository(storage());
  await repo.refresh(()=>{throw new Error('scan')},true);
  expect(repo.state.damagedData).toEqual([]);
  expect(repo.state.canRepair).toBe(false);
});
