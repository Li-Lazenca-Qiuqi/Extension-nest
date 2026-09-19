import { normalizeTags } from '../demo/src/tags';
import { t } from './i18n';

export interface OrganizationGroup {
  id: string;
  name: string;
  color: string;
  order: number;
}

/** 只保存组织元数据；extensionOrder 在各组内过滤后决定卡片顺序。 */
export interface OrganizationState {
  schemaVersion: 1;
  groups: OrganizationGroup[];
  assignments: Record<string, string>;
  tags: Record<string, string[]>;
  extensionOrder: string[];
}

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)
    || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) {
    throw new Error(t('Organization configuration must be a plain object.'));
  }
  return value as Record<string, unknown>;
}

/** Extension ID 大小写不敏感；只接受 publisher.name，拒绝命令和 URI。 */
function extensionId(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-z0-9][a-z0-9-]*\.[a-z0-9][a-z0-9-]*$/i.test(value)) {
    throw new Error(t('Organization configuration contains an invalid Extension ID.'));
  }
  return value.toLowerCase();
}

function groupList(value: unknown): OrganizationGroup[] {
  if (!Array.isArray(value)) throw new Error(t('groups must be an array.'));
  const ids = new Set<string>();
  const names = new Set<string>();
  const orders = new Set<number>();
  return value.map(item => {
    const group = record(item);
    const name = typeof group.name === 'string' ? group.name.trim() : '';
    if (typeof group.id !== 'string' || !group.id.trim() || group.id !== group.id.trim()
      || group.id.toLowerCase() === 'ungrouped' || ids.has(group.id)
      || !name || Array.from(name).length > 50 || name.toLowerCase() === 'ungrouped'
      || names.has(name.toLowerCase()) || typeof group.color !== 'string'
      || !/^#[0-9a-f]{6}$/i.test(group.color) || !Number.isSafeInteger(group.order)
      || (group.order as number) < 0 || orders.has(group.order as number)) {
      throw new Error(t('Organization configuration contains an invalid or duplicate group.'));
    }
    ids.add(group.id); names.add(name.toLowerCase()); orders.add(group.order as number);
    return { id: group.id, name, color: group.color, order: group.order as number };
  }).sort((left, right) => left.order - right.order);
}

/** 严格校验并复制配置；损坏数据抛错，由调用方保留原值，禁止回退 seed 后覆盖。 */
export function parseOrganizationState(value: unknown): OrganizationState {
  const input = record(value);
  if (input.schemaVersion !== 1) throw new Error(t('Unsupported organization configuration version.'));
  const groups = groupList(input.groups);
  const groupIds = new Set(groups.map(group => group.id));
  const assignments: Record<string, string> = {};
  for (const [rawId, target] of Object.entries(record(input.assignments))) {
    const id = extensionId(rawId);
    if (Object.hasOwn(assignments, id) || typeof target !== 'string' || !groupIds.has(target)) {
      throw new Error(t('An assignment is duplicated or references a missing group.'));
    }
    assignments[id] = target;
  }
  const tags: Record<string, string[]> = {};
  for (const [rawId, values] of Object.entries(record(input.tags))) {
    const id = extensionId(rawId);
    if (Object.hasOwn(tags, id)) throw new Error(t('Tags contain a duplicate Extension ID.'));
    // normalizeTags 同时校验数组、元素类型、Unicode 长度和数量上限。
    tags[id] = normalizeTags(values as string[]);
  }
  if (!Array.isArray(input.extensionOrder)) throw new Error(t('extensionOrder must be an array.'));
  const extensionOrder = input.extensionOrder.map(extensionId);
  if (new Set(extensionOrder).size !== extensionOrder.length) throw new Error(t('Extension order contains duplicate IDs.'));
  return { schemaVersion: 1, groups, assignments, tags, extensionOrder };
}

/** 只提取真实保存过的 Demo 元数据；不接收 seed 默认值，不生成已安装清单。 */
export function migrateDemoOrganization(value: unknown): OrganizationState {
  const demo = record(value);
  if (demo.schemaVersion !== 1 || !Array.isArray(demo.groups) || !Array.isArray(demo.extensions)) {
    throw new Error(t('Unable to migrate the Demo organization configuration.'));
  }
  const assignments: Record<string, string> = {};
  const tags: Record<string, string[]> = {};
  const extensionOrder: string[] = [];
  for (const item of demo.extensions) {
    const extension = record(item);
    const id = extensionId(extension.id);
    if (Object.hasOwn(tags, id)) throw new Error(t('Demo contains a duplicate Extension ID.'));
    if (extension.groupId !== null) {
      if (typeof extension.groupId !== 'string') throw new Error(t('Demo assignment is invalid.'));
      assignments[id] = extension.groupId;
    }
    tags[id] = normalizeTags((extension.tags === undefined ? [] : extension.tags) as string[]);
    extensionOrder.push(id);
  }
  return parseOrganizationState({
    schemaVersion: 1,
    groups: demo.groups.map((group, order) => ({ ...record(group), order })),
    assignments, tags, extensionOrder,
  });
}

/** 缺失与损坏必须区分，调用方只有 missing 状态可以执行首次初始化。 */
export function readOrganizationState(value: unknown):
  | { status: 'missing' }
  | { status: 'ready'; state: OrganizationState }
  | { status: 'invalid'; error: string } {
  if (value === undefined) return { status: 'missing' };
  try { return { status: 'ready', state: parseOrganizationState(value) }; }
  catch (error) { return { status: 'invalid', error: error instanceof Error ? error.message : String(error) }; }
}
