import type { DemoState } from './models';
import { getUiLanguage, t } from './uiI18n';

interface Props {
  state: DemoState;
  ready: boolean;
  empty: boolean;
  hasGroupSections: boolean;
  defaultVisible: boolean;
  native: boolean;
  onClear: () => void;
  onHistory: () => void;
  onRefresh: () => void;
  onRepair: () => void;
}

/** 读取失败优先于筛选结果；显式选中的空组继续保留拖放入口。 */
export function DiscoveryStatus(p: Props) {
  const freshness = p.state.freshness;
  if (!p.ready || freshness === 'Loading') return <div className="discovery-empty" role="status">{t('empty.discovering')}</div>;
  if (freshness === 'Error' || freshness === 'Stale') return <div className="discovery-empty" role="status">
    <span>{t(freshness === 'Error' ? 'empty.discoveryFailed' : 'empty.discoveryStale')}</span>
    {!!p.state.damagedData?.length && <span>{t('repair.detected', { targets: p.state.damagedData.map(target => t(target === 'organization' ? 'repair.organization' : 'repair.discovery')).join(' / ') })}</span>}
    {p.native && !!p.state.damagedData?.length && <button disabled={!p.state.canRepair} onClick={p.onRepair}>{t('repair.button')}</button>}
    {p.native && <button onClick={p.onRefresh}>{t('empty.retry')}</button>}
  </div>;
  if (!p.empty || p.hasGroupSections) return null;
  const historyOnly = p.defaultVisible && p.state.extensions.length > 0 && p.state.extensions.every(e => e.visibility !== 'Visible');
  const firstEmpty = p.state.extensions.length === 0;
  return <div className="discovery-empty" role="status">
    <span>{t(historyOnly ? 'empty.historyOnly' : firstEmpty ? 'empty.noVisible' : 'empty.noMatch')}</span>
    {historyOnly ? <button onClick={p.onHistory}>{t('empty.viewHistory')}</button>
      : firstEmpty ? p.native && <button onClick={p.onRefresh}>{t('app.refresh')}</button>
      : <button onClick={p.onClear}>{t('filter.clearAll')}</button>}
  </div>;
}

/** 使用绝对时间，避免相对时间定时刷新；UTC 原值供悬停核对。 */
export function LastScan({ value }: { value?: string }) {
  if (!value || !Number.isFinite(Date.parse(value))) return <span className="last-scan">{t('scan.never')}</span>;
  const time = new Intl.DateTimeFormat(getUiLanguage() === 'zh' ? 'zh-CN' : 'en', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(new Date(value));
  return <span className="last-scan">{t('scan.lastSuccess')} <time dateTime={value} title={value}>{time}</time></span>;
}
