import type { DemoState, Extension } from '../demo/src/models';
import type { OrganizationState } from './organizationState';
import { t } from './i18n';

export type Observation = Pick<Extension, 'id' | 'name' | 'publisher' | 'description' | 'version'> & { categories?: string[] };

/** 类别来自外部 manifest；忽略无效值，不使可选字段中断整批发现。 */
export function readCategories(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const categories = new Map<string, string>();
  for (const entry of value) {
    if (typeof entry !== 'string') continue;
    const name = entry.trim();
    if (!name || Array.from(name).length > 30) continue;
    const key = name.toLowerCase();
    if (!categories.has(key)) categories.set(key, name);
  }
  return [...categories.values()];
}
export interface DiscoveryRecord {
  source: 'public-local-host';
  firstSeenAt: string;
  lastSeenAt: string;
  lastSeenMetadata: Observation;
}
export interface DiscoveryCache { schemaVersion: 1; records: Record<string, DiscoveryRecord> }
export const emptyOrganization = (): OrganizationState => ({ schemaVersion: 1, groups: [], assignments: {}, tags: {}, extensionOrder: [] });
export const emptyCache = (): DiscoveryCache => ({ schemaVersion: 1, records: {} });
const isTimestamp = (value: unknown): value is string => typeof value === 'string'
  && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)
  && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;

/** 整批校验；任何坏项都不能被误解释为成功读取后消失。 */
export function validateObservations(values: readonly Observation[]): Observation[] {
  const ids = new Set<string>();
  return values.map(value => {
    if (!value || typeof value.id !== 'string' || !/^[a-z0-9][a-z0-9-]*\.[a-z0-9][a-z0-9-]*$/i.test(value.id)
      || !(['name', 'publisher', 'version'] as const).every(key => typeof value[key] === 'string' && value[key].trim())
      || typeof value.description !== 'string') throw new Error(t('Discovery snapshot contains invalid metadata.'));
    const id = value.id.toLowerCase();
    if (ids.has(id)) throw new Error(t('Discovery snapshot contains duplicate IDs.'));
    ids.add(id);
    return { id, name: value.name, publisher: value.publisher, description: value.description, version: value.version,
      categories: readCategories(value.categories) };
  });
}

/** 严格读取自己的历史缓存；不存在可以初始化，损坏必须保留原值。 */
export function parseDiscoveryCache(value: unknown): DiscoveryCache {
  if (value === undefined) return emptyCache();
  const input = value as DiscoveryCache;
  if (!input || input.schemaVersion !== 1 || !input.records || typeof input.records !== 'object' || Array.isArray(input.records)) throw new Error(t('Discovery cache format is invalid.'));
  const records: DiscoveryCache['records'] = {};
  for (const [id, record] of Object.entries(input.records)) {
    if (!record || record.source !== 'public-local-host' || !isTimestamp(record.firstSeenAt) || !isTimestamp(record.lastSeenAt)
      || Date.parse(record.firstSeenAt) > Date.parse(record.lastSeenAt)) throw new Error(t('Discovery cache time or source is invalid.'));
    const metadata = validateObservations([record.lastSeenMetadata])[0];
    if (id !== metadata.id) throw new Error(t('Discovery cache ID does not match its metadata.'));
    records[id] = { source: 'public-local-host', firstSeenAt: record.firstSeenAt, lastSeenAt: record.lastSeenAt, lastSeenMetadata: metadata };
  }
  return { schemaVersion: 1, records };
}

/** 只有真实成功读取才能推进历史时间；函数不修改传入缓存。 */
export function observe(cache: DiscoveryCache, values: readonly Observation[], now: string): DiscoveryCache {
  if (!isTimestamp(now)) throw new Error(t('Discovery time must be a UTC ISO 8601 timestamp.'));
  const records = { ...cache.records };
  for (const metadata of validateObservations(values)) {
    const old = records[metadata.id];
    const lastSeenAt = old && Date.parse(old.lastSeenAt) > Date.parse(now) ? old.lastSeenAt : now;
    records[metadata.id] = { source: 'public-local-host', firstSeenAt: old?.firstSeenAt ?? now, lastSeenAt, lastSeenMetadata: metadata };
  }
  return { schemaVersion: 1, records };
}

/** 缺少本轮成功快照时只给 Unverified；不能从历史或组织数据推断启停。 */
export function projectDiscovery(organization: OrganizationState, cache: DiscoveryCache, visible?: ReadonlySet<string>): DemoState {
  const ids = new Set([...organization.extensionOrder, ...Object.keys(organization.assignments), ...Object.keys(organization.tags), ...Object.keys(cache.records)]);
  // 已保存的顺序优先；未保存项不依赖扫描或缓存对象的插入顺序。
  const savedIds = new Set(organization.extensionOrder);
  const unsortedIds = [...ids].filter(id => !savedIds.has(id));
  unsortedIds.sort((left, right) => {
    const leftName = cache.records[left]?.lastSeenMetadata.name ?? left;
    const rightName = cache.records[right]?.lastSeenMetadata.name ?? right;
    return leftName.localeCompare(rightName) || left.localeCompare(right);
  });
  const orderedIds = [...organization.extensionOrder, ...unsortedIds];
  return {
    schemaVersion: 1,
    groups: organization.groups.map(({ id, name, color }) => ({ id, name, color })),
    extensions: orderedIds.map(id => {
      const record = cache.records[id];
      const groupId = organization.assignments[id] ?? null;
      const metadata = record?.lastSeenMetadata ?? { id, name: id, publisher: id.split('.')[0], description: '', version: '—' };
      return { ...metadata, groupId, tags: [...(organization.tags[id] ?? [])],
        visibility: visible?.has(id) ? 'Visible' : visible && record ? 'NotVisible' : 'Unverified',
        lastSeenAt: record?.lastSeenAt, monogram: Array.from(metadata.name)[0] ?? '?',
        color: organization.groups.find(group => group.id === groupId)?.color ?? '#7C3AED' };
    }),
  };
}
