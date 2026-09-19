import type { DemoState } from '../demo/src/models';
import { migrateDemoOrganization, parseOrganizationState, type OrganizationState } from './organizationState';
import { emptyCache, emptyOrganization, observe, parseDiscoveryCache, projectDiscovery, validateObservations, type DiscoveryCache, type Observation } from './discoveryState';
import { t } from './i18n';

export interface StateStorage { get<T>(key: string): T | undefined; update(key: string, value: unknown): Thenable<void> | Promise<void> }
export const ORGANIZATION_KEY = 'extensionNest.state';
export const DISCOVERY_KEY = 'extensionNest.discovery';

/** 由宿主队列和进程级单写者保护；先持久化再发布，失败保留上次有效快照。 */
export class DiscoveryRepository {
  state: DemoState = { schemaVersion: 1, groups: [], extensions: [], freshness: 'Loading', readOnly: true };
  private organization: OrganizationState = emptyOrganization();
  private cache: DiscoveryCache = emptyCache();
  private visible?: Set<string>;
  private loaded = false;
  private hiddenIds: ReadonlySet<string> = new Set();
  constructor(private readonly storage: StateStorage) {}

  async refresh(read: () => readonly Observation[], writable: boolean, current: () => boolean = () => true,
    hiddenIds: ReadonlySet<string> = new Set()): Promise<void> {
    const project = (organization: OrganizationState, cache: DiscoveryCache, visible?: ReadonlySet<string>) => {
      const state = projectDiscovery(organization, cache, visible);
      return { ...state, extensions: state.extensions.filter(extension => !hiddenIds.has(extension.id)) };
    };
    try {
      const rawOrganization = this.storage.get<unknown>(ORGANIZATION_KEY);
      const legacy = this.storage.get<unknown>('extensionNest.demo.state');
      const organization = rawOrganization === undefined
        ? legacy === undefined ? emptyOrganization() : migrateDemoOrganization(legacy)
        : parseOrganizationState(rawOrganization);
      let storedCache: DiscoveryCache;
      try { storedCache = parseDiscoveryCache(this.storage.get<unknown>(DISCOVERY_KEY)); }
      catch (error) {
        if (!this.loaded) this.state = { ...project(organization, emptyCache()), freshness: 'Loading', readOnly: true };
        throw error;
      }
      // 只读窗口本轮内的历史仍保留，但不能写回或冒充跨重启已保存。
      const cache = writable ? storedCache : { schemaVersion: 1 as const, records: { ...this.cache.records, ...storedCache.records } };
      if (!this.loaded) {
        this.organization = organization; this.cache = cache; this.loaded = true;
        this.state = { ...project(organization, cache), freshness: 'Loading', readOnly: !writable };
      }
      const values = validateObservations(read());
      const now = new Date().toISOString();
      const nextCache = observe(cache, values, now);
      if (!current()) return;
      if (writable) {
        if (rawOrganization === undefined) await this.storage.update(ORGANIZATION_KEY, organization);
        if (!current()) return;
        await this.storage.update(DISCOVERY_KEY, nextCache);
      }
      if (!current()) return;
      this.organization = organization; this.cache = nextCache;
      this.visible = new Set(values.map(value => value.id));
      this.hiddenIds = hiddenIds;
      const projection = projectDiscovery(organization, nextCache, this.visible);
      this.state = { ...projection, extensions: projection.extensions.filter(extension => !hiddenIds.has(extension.id)),
        freshness: 'Ready', lastSuccessfulAt: now, readOnly: !writable };
    } catch (error) {
      if (current()) this.fail(error, true);
    }
  }

  async save(next: DemoState, current: () => boolean = () => true): Promise<void> {
    if (this.state.readOnly) throw new Error(t('This window is read-only. Close other Extension Nest windows and reload this window.'));
    const organization = migrateDemoOrganization(next);
    // 视图过滤不能隐式删除内置项的组织关系；删除分组时仍解除该组的所有归属。
    const groups = new Set(organization.groups.map(group => group.id));
    for (const id of this.hiddenIds) {
      const group = this.organization.assignments[id];
      if (group && groups.has(group)) organization.assignments[id] = group;
      if (this.organization.tags[id]) organization.tags[id] = [...this.organization.tags[id]];
    }
    const visibleOrder = organization.extensionOrder;
    let index = 0;
    organization.extensionOrder = this.organization.extensionOrder
      .map(id => this.hiddenIds.has(id) ? id : visibleOrder[index++])
      .filter((id): id is string => id !== undefined);
    organization.extensionOrder.push(...visibleOrder.slice(index));
    await this.storage.update(ORGANIZATION_KEY, organization);
    if (!current()) return;
    this.organization = organization;
    this.state = { ...next, error: undefined };
  }

  /** 只有成功发现后仍没有真实历史的组织占位可清理；NotVisible 不属于残留判定。 */
  cleanupCandidates(): DemoState['extensions'] {
    if (this.state.readOnly || this.state.freshness !== 'Ready') return [];
    return this.state.extensions.filter(extension => extension.visibility === 'Unverified'
      && !this.cache.records[extension.id]);
  }

  /** 用户确认后直接删除组织记录，不创建备份；任何候选变化都撤销整批清理。 */
  async cleanupUnverified(ids: readonly string[], current: () => boolean = () => true): Promise<number> {
    const candidates = new Set(this.cleanupCandidates().map(extension => extension.id));
    const selected = new Set(ids);
    if (!selected.size || [...selected].some(id => !candidates.has(id))) throw new Error(t('The cleanup list changed or this window is not writable. Refresh and preview it again.'));
    const after = parseOrganizationState(this.organization);
    for (const id of selected) { delete after.assignments[id]; delete after.tags[id]; }
    after.extensionOrder = after.extensionOrder.filter(id => !selected.has(id));
    if (!current()) return 0;
    await this.storage.update(ORGANIZATION_KEY, after);
    if (!current()) return 0;
    this.organization = after;
    this.publishOrganization();
    return selected.size;
  }

  private publishOrganization(): void {
    const projection = projectDiscovery(this.organization, this.cache, this.visible);
    this.state = { ...this.state, ...projection,
      extensions: projection.extensions.filter(extension => !this.hiddenIds.has(extension.id)), error: undefined };
  }

  fail(error: unknown, readOnly = this.state.readOnly): void {
    this.state = { ...this.state, freshness: this.state.lastSuccessfulAt ? 'Stale' : 'Error', readOnly,
      error: error instanceof Error ? error.message : String(error) };
  }
}
