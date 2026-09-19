/** 支持的界面语言；用户数据、扩展 ID 和组名不经过此转换。 */
export type UiLanguage = 'en' | 'zh';

type Message = { en: string; zh: string };
type MessageParams = Record<string, string | number>;

/**
 * Dashboard 自有文案字典。
 * 语言选择在 t 调用时读取，避免模块初始化时锁定语言。
 */
const messages = {
  'empty.historyOnly': { en: 'No extensions are currently visible. Retained records are available.', zh: '当前没有可见扩展，仍有保留的历史记录。' },
  'empty.viewHistory': { en: 'View retained records', zh: '查看历史记录' },
  'empty.retry': { en: 'Retry discovery', zh: '重新扫描' },
  'scan.never': { en: 'No successful scan yet', zh: '尚无成功扫描' },
  'scan.lastSuccess': { en: 'Last successful scan:', zh: '最近成功扫描：' },
  'extension.filterByCategory': { en: 'Automatic category: {tag} · Click to filter', zh: '自动类别：{tag} · 点击筛选' },
  'tags.automaticHint': { en: 'Edit manual tags here. Automatic category tags follow the extension and are kept separately.', zh: '此处仅编辑手动标签。自动类别标签随扩展更新，单独保留。' },
  'app.title': { en: 'Extensions', zh: '扩展' },
  'app.browserTitle': { en: 'Extension Nest — Interactive Demo', zh: 'Extension Nest — 交互式演示' },
  'app.extensionOverview': { en: 'Extension overview', zh: '扩展概览' },
  'app.searchAria': { en: 'Search extensions and tags', zh: '搜索扩展和标签' },
  'app.searchPlaceholder': { en: 'Search...', zh: '搜索...' },
  'app.organizedExtensions': { en: 'Organized extensions', zh: '已整理的扩展' },
  'app.localHost': { en: 'Local host', zh: '本地宿主' },
  'app.demoSample': { en: 'Demo · Sample data', zh: '演示 · 示例数据' },
  'app.openExtensions': { en: 'Open extensions', zh: '打开扩展' },
  'app.refresh': { en: 'Refresh', zh: '刷新' },
  'app.resetDemo': { en: 'Reset demo', zh: '重置演示' },
  'app.connecting': { en: 'Connecting…', zh: '连接中…' },
  'app.saved': { en: 'Saved', zh: '已保存' },
  'app.saveFailed': { en: 'Save failed', zh: '保存失败' },
  'app.attentionRequired': { en: 'Attention required', zh: '需要处理' },
  'app.sessionOnly': { en: 'Session only · Not saved', zh: '仅当前会话 · 未保存' },
  'app.staleDiscovery': { en: 'Stale discovery', zh: '发现结果已过期' },

  'metric.all': { en: 'All', zh: '全部' },
  'metric.visible': { en: 'Visible', zh: '可见' },
  'metric.notFound': { en: 'Not found', zh: '未发现' },
  'filter.allGroups': { en: 'All groups', zh: '全部分组' },
  'filter.ungrouped': { en: 'Ungrouped', zh: '未分组' },
  'filter.tags': { en: 'Tags', zh: '标签' },
  'filter.tagsCount': { en: 'Tags ({count})', zh: '标签（{count}）' },
  'filter.noTags': { en: 'No tags', zh: '没有标签' },
  'filter.groupAria': { en: 'Filter group', zh: '筛选分组' },
  'filter.clearTag': { en: 'Clear tag filter {tag}', zh: '清除标签筛选 {tag}' },
  'filter.filters': { en: 'Filters', zh: '筛选条件' },
  'filter.selected': { en: '{count} selected', zh: '已选择 {count} 项' },
  'filter.clearAll': { en: 'Clear filters', zh: '清除筛选条件' },
  'filter.clear': { en: 'Clear', zh: '清除' },
  'filter.editTags': { en: 'Edit tags', zh: '编辑标签' },

  'sort.button': { en: 'Sort', zh: '排序' },
  'sort.groups': { en: 'Sort groups', zh: '排序分组' },
  'sort.groupNameAsc': { en: 'Name A–Z', zh: '名称 A–Z' },
  'sort.groupNameDesc': { en: 'Name Z–A', zh: '名称 Z–A' },
  'sort.extensionNameAsc': { en: 'Name A–Z', zh: '名称 A–Z' },
  'sort.extensionNameDesc': { en: 'Name Z–A', zh: '名称 Z–A' },
  'sort.publisherAsc': { en: 'Publisher A–Z', zh: '发布者 A–Z' },
  'sort.publisherDesc': { en: 'Publisher Z–A', zh: '发布者 Z–A' },
  'sort.expandAll': { en: 'Expand all groups', zh: '展开全部分组' },
  'sort.collapseAll': { en: 'Collapse all groups', zh: '收起全部分组' },
  'sort.twoColumns': { en: 'Two-column groups', zh: '双列分组' },

  'cleanup.title': { en: 'Preview old records eligible for permanent cleanup. No backup is created.', zh: '预览符合永久清理条件的旧记录，不会创建备份。' },
  'cleanup.button': { en: 'Clear old records ({count})', zh: '清理旧记录（{count}）' },

  'empty.discovering': { en: 'Discovering extensions…', zh: '正在发现扩展…' },
  'empty.noMatch': { en: 'No matching extensions. Clear filters to see all records.', zh: '没有匹配的扩展。清除筛选条件以查看全部记录。' },
  'empty.discoveryFailed': { en: 'Discovery failed. Refresh to try again.', zh: '扩展发现失败。请刷新重试。' },
  'empty.discoveryStale': { en: 'Discovery is stale. Refresh to try again.', zh: '扩展发现结果已过期。请刷新重试。' },
  'empty.noVisible': { en: 'No extensions are visible to this local host yet.', zh: '此本地宿主暂未发现可见扩展。' },
  'empty.dropExtensions': { en: 'Drop extensions here', zh: '将扩展拖到这里' },
  'history.notice': { en: 'Only retained records are shown. These records do not confirm current installation or enablement.', zh: '当前显示的是保留记录。这些记录不能证明扩展当前已安装或已启用。' },

  'group.new': { en: 'New group', zh: '新建分组' },
  'group.button': { en: 'Group', zh: '分组' },
  'group.name': { en: 'Group name', zh: '分组名称' },
  'group.placeholder': { en: 'e.g. Research', zh: '例如 Research' },
  'group.uniqueNameError': { en: 'Use a unique name, 1–50 characters.', zh: '请输入唯一名称，长度为 1–50 个字符。' },
  'group.create': { en: 'Create group', zh: '创建分组' },

  'dialog.resetTitle': { en: 'Reset demo?', zh: '重置演示？' },
  'dialog.editTagsTitle': { en: 'Edit tags', zh: '编辑标签' },
  'dialog.restoreSample': { en: 'Restore sample data and groups.', zh: '恢复示例数据和分组。' },
  'dialog.cancel': { en: 'Cancel', zh: '取消' },
  'dialog.close': { en: 'Close dialog', zh: '关闭对话框' },

  'tags.replaceOn': { en: 'Replace tags on {count} extensions.', zh: '替换 {count} 个扩展的标签。' },
  'tags.remove': { en: 'Remove tag {tag}', zh: '移除标签 {tag}' },
  'tags.label': { en: 'Tag', zh: '标签' },
  'tags.placeholder': { en: 'e.g. Research', zh: '例如 Research' },
  'tags.add': { en: 'Add', zh: '添加' },
  'tags.save': { en: 'Save tags', zh: '保存标签' },
  'tags.invalid': { en: 'Invalid tags', zh: '标签无效' },
  'tags.mustBeArray': { en: 'Tags must be an array.', zh: '标签必须是数组。' },
  'tags.mustBeString': { en: 'Each tag must be a string.', zh: '每个标签必须是字符串。' },
  'tags.maxLength': { en: 'Each tag must be {count} characters or fewer.', zh: '每个标签最多 {count} 个字符。' },
  'tags.maxCount': { en: 'A maximum of {count} tags is allowed.', zh: '最多允许 {count} 个标签。' },

  'extension.reorder': { en: 'Reorder {name}', zh: '调整 {name} 顺序' },
  'extension.reorderTitle': { en: 'Drag to reorder · Arrow keys to move', zh: '拖动排序 · 使用方向键移动' },
  'extension.sort': { en: 'Sort {name}', zh: '排序 {name}' },
  'extension.open': { en: 'Open {name} in VS Code', zh: '在 VS Code 中打开 {name}' },
  'extension.openTitle': { en: 'Open in VS Code', zh: '在 VS Code 中打开' },
  'extension.manage': { en: 'Manage {name}', zh: '管理 {name}' },
  'extension.actions': { en: '{name} actions', zh: '{name} 操作' },
  'extension.moveUp': { en: 'Move up', zh: '上移' },
  'extension.moveDown': { en: 'Move down', zh: '下移' },
  'extension.copyId': { en: 'Copy ID', zh: '复制 ID' },
  'extension.idCopied': { en: 'ID copied', zh: '已复制 ID' },
  'extension.notFoundTitle': { en: 'Not found in the latest discovery. This does not confirm disabling or removal.', zh: '本次扫描未发现此扩展，不能据此判断它已禁用或卸载。' },
  'extension.filterByTag': { en: 'Filter by {tag}', zh: '按 {tag} 筛选' },
  'extension.observedVersion': { en: 'Observed version', zh: '观测到的版本' },
  'extension.lastSeenVersionTitle': { en: 'Last seen version · {time}', zh: '上次发现版本 · {time}' },
  'extension.lastSeenVersion': { en: 'Last seen version: {version}', zh: '上次发现版本：{version}' },
  'extension.versionUnknown': { en: 'Version unknown', zh: '版本未知' },

  'status.loading': { en: 'Loading', zh: '加载中' },
  'status.ready': { en: 'Ready', zh: '就绪' },
  'status.stale': { en: 'Stale', zh: '已过期' },
  'status.error': { en: 'Error', zh: '错误' },
  'status.readOnly': { en: 'Read-only', zh: '只读' },
  'errors.readOnly': { en: 'Read-only: organization data cannot be changed. Discovery changes are available only in this session and are not saved.', zh: '只读：无法修改组织数据。发现结果仅在当前会话可用，不会保存。' },
  'errors.openInVsCode': { en: 'Open this dashboard in VS Code to view the extension page.', zh: '请在 VS Code 中打开此 Dashboard 以查看扩展页面。' },
} as const satisfies Record<string, Message>;

export type UiMessageKey = keyof typeof messages;

let languageOverride: string | undefined;

/** 读取宿主或浏览器提供的语言；Node 环境没有 DOM 时返回英文。 */
function readLanguageSource(): string {
  if (languageOverride) {
    return languageOverride;
  }
  if (typeof document !== 'undefined') {
    const documentLanguage = document.documentElement?.lang?.trim();
    if (documentLanguage) {
      return documentLanguage;
    }
  }
  if (typeof navigator !== 'undefined' && typeof navigator.language === 'string' && navigator.language.trim()) {
    return navigator.language;
  }
  return 'en';
}

/** 把语言标签归一到字典支持的语言。只有 zh 开头的标签使用简体中文。 */
export function getUiLanguage(): UiLanguage {
  return /^zh(?:-|$)/i.test(readLanguageSource()) ? 'zh' : 'en';
}

/** 设置宿主显式语言；传入空值会恢复 document/navigator 自动选择。 */
export function setUiLanguage(language?: string | null): void {
  languageOverride = typeof language === 'string' && language.trim() ? language.trim() : undefined;
}

const statusKeys = {
  Loading: 'status.loading',
  Ready: 'status.ready',
  Stale: 'status.stale',
  Error: 'status.error',
} as const satisfies Record<'Loading' | 'Ready' | 'Stale' | 'Error', UiMessageKey>;

/** 把状态协议值转成当前语言文案；状态协议本身仍然使用英文枚举。 */
export function statusText(status?: keyof typeof statusKeys): string {
  return t(status ? statusKeys[status] : 'status.loading');
}

/** 读取并替换当前语言文案；参数值会原样保留，便于错误详情可追踪。 */
export function t(key: UiMessageKey, params: MessageParams = {}): string {
  const message = messages[key];
  const template = message?.[getUiLanguage()] ?? key;
  return template.replace(/\{([A-Za-z0-9_]+)\}/g, (placeholder, name: string) => {
    const value = params[name];
    return value === undefined ? placeholder : String(value);
  });
}
