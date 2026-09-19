import { expect, it } from 'vitest';
import { seedState } from '../test/extensionFixture';
import { migrateDemoOrganization, parseOrganizationState, readOrganizationState } from '../../src/organizationState';

it('迁移保留分组、颜色、顺序和标签，但不保存任何安装或启停状态', () => {
  const input = structuredClone(seedState);
  const result = migrateDemoOrganization(input);
  expect(result.groups.map(group => [group.id, group.color])).toEqual(input.groups.map(group => [group.id, group.color]));
  expect(result.extensionOrder).toEqual(input.extensions.map(extension => extension.id));
  for (const extension of input.extensions) {
    expect(result.assignments[extension.id] ?? null).toBe(extension.groupId);
    expect(result.tags[extension.id]).toEqual(extension.tags);
  }
  expect(Object.keys(result).sort()).toEqual(['assignments', 'extensionOrder', 'groups', 'schemaVersion', 'tags']);
  expect(JSON.stringify(result)).not.toMatch(/"(?:enabled|version|update|extensions)":/);
  result.tags[input.extensions[0].id].push('Independent');
  expect(input).toEqual(seedState);
});

it('旧 Demo 缺少 tags 补空数组，不改变归属', () => {
  const input = JSON.parse(JSON.stringify(seedState));
  delete input.extensions[0].tags;
  const result = migrateDemoOrganization(input);
  expect(result.tags[input.extensions[0].id]).toEqual([]);
  expect(result.assignments[input.extensions[0].id]).toBe(input.extensions[0].groupId);
});

it('缺失和损坏明确区分，损坏值不返回 seed 或空配置', () => {
  expect(readOrganizationState(undefined)).toEqual({ status: 'missing' });
  for (const value of [null, {}, { schemaVersion: 99 }, [], 'broken']) {
    expect(readOrganizationState(value)).toMatchObject({ status: 'invalid' });
  }
});

it.each(['dangling', 'duplicate-group', 'duplicate-name', 'duplicate-order', 'duplicate-id', 'bad-tag', 'bad-color', 'bad-order', 'long-name'])('拒绝 %s 配置并保持输入完整', kind => {
  const state = migrateDemoOrganization(seedState);
  const id = state.extensionOrder[0];
  if (kind === 'dangling') state.assignments[id] = 'missing';
  if (kind === 'duplicate-group') state.groups.push({ ...state.groups[0] });
  if (kind === 'duplicate-name') state.groups[1].name = state.groups[0].name.toUpperCase();
  if (kind === 'duplicate-order') state.groups[1].order = state.groups[0].order;
  if (kind === 'duplicate-id') state.tags[id.toUpperCase()] = [];
  if (kind === 'bad-tag') state.tags[id] = Array.from({ length: 11 }, (_, index) => String(index));
  if (kind === 'bad-color') state.groups[0].color = 'url(https://example.com)';
  if (kind === 'bad-order') state.extensionOrder.push(id.toUpperCase());
  if (kind === 'long-name') state.groups[0].name = '界'.repeat(51);
  const before = structuredClone(state);
  expect(() => parseOrganizationState(state)).toThrow();
  expect(state).toEqual(before);
});

it('规范化 ID 和标签，并保留暂时不在清单中的组织元数据', () => {
  const state = migrateDemoOrganization(seedState);
  state.tags['LOCAL.OFFLINE'] = [' Research ', 'research', 'Data'];
  state.assignments['LOCAL.OFFLINE'] = state.groups[0].id;
  const result = parseOrganizationState(state);
  expect(result.tags['local.offline']).toEqual(['Research', 'Data']);
  expect(result.assignments['local.offline']).toBe(state.groups[0].id);
});

it('不能将非法 Tag 或缺失分组的 Demo 部分迁移', () => {
  const state = structuredClone(seedState);
  state.extensions[1].tags = ['界'.repeat(31)];
  expect(() => migrateDemoOrganization(state)).toThrow();
  state.extensions[1].tags = [];
  state.extensions[0].groupId = 'missing';
  expect(() => migrateDemoOrganization(state)).toThrow();
});
