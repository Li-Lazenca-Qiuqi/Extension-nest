import * as vscode from "vscode";

/** 宿主侧文案；扩展名、ID、标签和外部错误等动态内容由调用方原样传入。 */
export const HOST_MESSAGES = {
  'Repair requires the writable window.': { en: 'Repair requires the writable window.', zh: '请在具有写入权限的窗口中修复。' },
  'Damaged data changed. Inspect it again before resetting.': { en: 'Damaged data changed. Inspect it again before resetting.', zh: '待修复数据已变化，请重新检查后确认。' },
  'No damaged data found.': { en: 'No damaged data found.', zh: '没有检测到损坏的数据。' },
  'Choose damaged data to reset': { en: 'Choose damaged data to reset', zh: '选择要重置的损坏数据' },
  'Organization data': { en: 'Organization data', zh: '组织配置' },
  'Discovery cache': { en: 'Discovery cache', zh: '发现缓存' },
  'Reset damaged {target}?': { en: 'Reset damaged {target}?', zh: '重置损坏的{target}？' },
  'Groups, assignments, manual tags and order will be lost. Discovery history will be kept. No backup is created. Extensions are not changed.': { en: 'Groups, assignments, manual tags and order will be lost. Discovery history will be kept. No backup is created. Extensions are not changed.', zh: '将删除分组、归属、手动标签和排序，保留发现历史。不创建备份，不改动插件本身。' },
  'Discovery history, automatic categories and scan times will be cleared. Organization data will be kept. Visible extensions can be scanned again. No backup is created.': { en: 'Discovery history, automatic categories and scan times will be cleared. Organization data will be kept. Visible extensions can be scanned again. No backup is created.', zh: '将清除发现历史、自动类别和扫描时间，保留组织配置。当前可见插件可重新扫描。不创建备份。' },
  'Reset permanently': { en: 'Reset permanently', zh: '永久重置' },
  "Edit manual tags for {target}; automatic categories are kept separately.": {
    en: "Edit manual tags for {target}; automatic categories are kept separately.",
    zh: "编辑 {target} 的手动标签；自动类别单独保留。",
  },
  "Extension Nest Dashboard": {
    en: "Extension Nest Dashboard",
    zh: "Extension Nest Dashboard",
  },
  "Run the extension build to create the dashboard bundle.": {
    en: "Run the extension build to create the dashboard bundle.",
    zh: "请运行扩展构建以生成仪表盘资源。",
  },
  "Unable to open extension: {error}": {
    en: "Unable to open extension: {error}",
    zh: "无法打开扩展：{error}",
  },
  "Open Extension Nest Dashboard": {
    en: "Open Extension Nest Dashboard",
    zh: "打开 Extension Nest Dashboard",
  },
  Ungrouped: {
    en: "Ungrouped",
    zh: "未分组",
  },
  "{count} known extensions": {
    en: "{count} known extensions",
    zh: "{count} 个已知扩展",
  },
  "Not found": {
    en: "Not found",
    zh: "未发现",
  },
  "Publisher: {publisher}": {
    en: "Publisher: {publisher}",
    zh: "发布者：{publisher}",
  },
  "Version: {version}": {
    en: "Version: {version}",
    zh: "版本：{version}",
  },
  "Last seen version: {version}": {
    en: "Last seen version: {version}",
    zh: "最近发现版本：{version}",
  },
  "Status: {status}": {
    en: "Status: {status}",
    zh: "状态：{status}",
  },
  "Not found in the latest discovery. This does not confirm disabling or removal.": {
    en: "This extension was not found in the latest scan; this does not confirm that it is disabled or uninstalled.",
    zh: "本次扫描未发现此扩展，不能据此判断它已禁用或卸载。",
  },
  "Last seen: {timestamp}": {
    en: "Last seen: {timestamp}",
    zh: "上次发现：{timestamp}",
  },
  "Tags: {tags}": {
    en: "Tags: {tags}",
    zh: "标签：{tags}",
  },
  None: {
    en: "None",
    zh: "无",
  },
  "Invalid extension ID.": {
    en: "Invalid extension ID.",
    zh: "扩展 ID 无效。",
  },
  "Find in VS Code": {
    en: "Find in VS Code",
    zh: "在 VS Code 中查找",
  },
  "Unable to open extension {id}'s native page. Find it in the VS Code Extensions view.": {
    en: "Unable to open extension {id}'s native page. Find it in the VS Code Extensions view.",
    zh: "无法打开扩展 {id} 的原生页面。请在 VS Code 扩展视图中查找。",
  },
  "Native extension page navigation failed.": {
    en: "Native extension page navigation failed.",
    zh: "原生扩展页面导航失败。",
  },
  "Name A–Z": {
    en: "Name A–Z",
    zh: "名称 A–Z",
  },
  "Name Z–A": {
    en: "Name Z–A",
    zh: "名称 Z–A",
  },
  "Publisher A–Z": {
    en: "Publisher A–Z",
    zh: "发布者 A–Z",
  },
  "Publisher Z–A": {
    en: "Publisher Z–A",
    zh: "发布者 Z–A",
  },
  "Sort extensions in group": {
    en: "Sort extensions in group",
    zh: "在分组中排序扩展",
  },
  "Current window cannot clean up records. Resolve the read error first or use a writable window.": {
    en: "Current window cannot clean up records. Resolve the read error first or use a writable window.",
    zh: "当前窗口无法清理记录。请先解决读取错误，或在可写窗口中操作。",
  },
  "No old records can be cleaned up. Previously discovered records that are not currently visible are kept.": {
    en: "No old records can be cleaned up. Previously discovered records that are not currently visible are kept.",
    zh: "没有可清理的旧记录。已发现但当前不可见的记录会被保留。",
  },
  "Group: {group} · Tags: {tags}": {
    en: "Group: {group} · Tags: {tags}",
    zh: "分组：{group} · 标签：{tags}",
  },
  "Clean up old records": {
    en: "Clean up old records",
    zh: "清理旧记录",
  },
  "Select old records you no longer need. Not found in this scan does not mean uninstalled. Only this extension's records will be removed; extensions will not be uninstalled.": {
    en: "Select old records you no longer need. Not found in this scan does not mean uninstalled. Only this extension's records will be removed; extensions will not be uninstalled.",
    zh: "选择确认不需要的旧记录。本次未发现不等于已卸载。仅清理本插件记录，不会卸载扩展。",
  },
  "Clean up these {count} old records?": {
    en: "Clean up these {count} old records?",
    zh: "要清理这 {count} 条旧记录吗？",
  },
  "The group assignments, tags, and order records for these IDs will be removed. Groups and real discovery history will be kept. This is permanent, no backup is created, and this extension cannot restore the records.": {
    en: "The group assignments, tags, and order records for these IDs will be removed. Groups and real discovery history will be kept. This is permanent, no backup is created, and this extension cannot restore the records.",
    zh: "这些 ID 的分组归属、标签和顺序记录将被移除。分组本身及真实发现历史会被保留。此操作永久生效，不会创建备份，且本插件无法恢复这些记录。",
  },
  "Delete permanently": {
    en: "Delete permanently",
    zh: "永久删除",
  },
  "Previewed records changed. Review the cleanup list again.": {
    en: "Previewed records changed. Review the cleanup list again.",
    zh: "预览后的记录已变化，请重新预览清理列表。",
  },
  "Permanently deleted {count} old records.": {
    en: "Permanently deleted {count} old records.",
    zh: "已永久删除 {count} 条旧记录。",
  },
  "Create an extension group": {
    en: "Create an extension group",
    zh: "创建扩展分组",
  },
  "Group name": {
    en: "Group name",
    zh: "分组名称",
  },
  "Rename group “{name}”": {
    en: "Rename group “{name}”",
    zh: "重命名分组“{name}”",
  },
  "Delete the group “{name}”? Its known extensions will become Ungrouped; no real extension will be affected.": {
    en: "Delete the group “{name}”? Its known extensions will become Ungrouped; no real extension will be affected.",
    zh: "要删除分组“{name}”吗？其中的已知扩展会变为未分组；不会影响任何真实扩展。",
  },
  "Delete Group": {
    en: "Delete Group",
    zh: "删除分组",
  },
  Cancel: {
    en: "Cancel",
    zh: "取消",
  },
  "Edit tags for {target}": {
    en: "Edit tags for {target}",
    zh: "编辑 {target} 的标签",
  },
  "{count} extensions": {
    en: "{count} extensions",
    zh: "{count} 个扩展",
  },
  extension: {
    en: "extension",
    zh: "扩展",
  },
  "tag1, tag2, tag3": {
    en: "tag1, tag2, tag3",
    zh: "标签1，标签2，标签3",
  },
  "This window is read-only. Close other Extension Nest windows and reload this window, or resolve the read error and refresh.": {
    en: "This window is read-only. Close other Extension Nest windows and reload this window, or resolve the read error and refresh.",
    zh: "当前窗口只读。请关闭其他 Extension Nest 窗口后重新加载此窗口，或解决读取错误后刷新。",
  },
  "Could not save Extension Nest state: {error}": {
    en: "Could not save Extension Nest state: {error}",
    zh: "无法保存 Extension Nest 状态：{error}",
  },
  "Read-only · Close other Extension Nest windows and reload to edit.": {
    en: "Read-only · Close other Extension Nest windows and reload to edit.",
    zh: "只读 · 请关闭其他 Extension Nest 窗口并重新加载后编辑。",
  },
  "Local host · {status}": {
    en: "Local host · {status}",
    zh: "本地宿主 · {status}",
  },
  Loading: {
    en: "Loading",
    zh: "加载中",
  },
  Ready: {
    en: "Ready",
    zh: "就绪",
  },
  Stale: {
    en: "Stale",
    zh: "过期",
  },
  Error: {
    en: "Error",
    zh: "错误",
  },
  "Desktop VS Code with a local UI extension host is required.": {
    en: "Desktop VS Code with a local UI extension host is required.",
    zh: "需要桌面版 VS Code 的本地 UI 扩展宿主。",
  },
  "Group name cannot be empty.": {
    en: "Group name cannot be empty.",
    zh: "分组名称不能为空。",
  },
  "Ungrouped is reserved for unassigned extensions.": {
    en: "Ungrouped is reserved for unassigned extensions.",
    zh: "Ungrouped 是未分配扩展的保留名称。",
  },
  "Group name must be 50 characters or fewer.": {
    en: "Group name must be 50 characters or fewer.",
    zh: "分组名称不能超过 50 个字符。",
  },
  "A group with this name already exists.": {
    en: "A group with this name already exists.",
    zh: "已存在同名分组。",
  },
  "Organization configuration must be a plain object.": {
    en: "Organization configuration must be a plain object.",
    zh: "组织配置必须为普通对象。",
  },
  "Organization configuration contains an invalid Extension ID.": {
    en: "Organization configuration contains an invalid Extension ID.",
    zh: "组织配置包含非法 Extension ID。",
  },
  "groups must be an array.": {
    en: "groups must be an array.",
    zh: "groups 必须为数组。",
  },
  "Organization configuration contains an invalid or duplicate group.": {
    en: "Organization configuration contains an invalid or duplicate group.",
    zh: "组织配置包含非法或重复分组。",
  },
  "Unsupported organization configuration version.": {
    en: "Unsupported organization configuration version.",
    zh: "不支持的组织配置版本。",
  },
  "An assignment is duplicated or references a missing group.": {
    en: "An assignment is duplicated or references a missing group.",
    zh: "归属重复或引用了不存在的分组。",
  },
  "Tags contain a duplicate Extension ID.": {
    en: "Tags contain a duplicate Extension ID.",
    zh: "标签包含重复 Extension ID。",
  },
  "extensionOrder must be an array.": {
    en: "extensionOrder must be an array.",
    zh: "extensionOrder 必须为数组。",
  },
  "Extension order contains duplicate IDs.": {
    en: "Extension order contains duplicate IDs.",
    zh: "扩展顺序包含重复 ID。",
  },
  "Unable to migrate the Demo organization configuration.": {
    en: "Unable to migrate the Demo organization configuration.",
    zh: "无法迁移 Demo 组织配置。",
  },
  "Demo contains a duplicate Extension ID.": {
    en: "Demo contains a duplicate Extension ID.",
    zh: "Demo 包含重复 Extension ID。",
  },
  "Demo assignment is invalid.": {
    en: "Demo assignment is invalid.",
    zh: "Demo 归属非法。",
  },
  "Discovery snapshot contains invalid metadata.": {
    en: "Discovery snapshot contains invalid metadata.",
    zh: "发现快照包含非法元数据。",
  },
  "Discovery snapshot contains duplicate IDs.": {
    en: "Discovery snapshot contains duplicate IDs.",
    zh: "发现快照包含重复 ID。",
  },
  "Discovery cache format is invalid.": {
    en: "Discovery cache format is invalid.",
    zh: "发现缓存格式无效。",
  },
  "Discovery cache time or source is invalid.": {
    en: "Discovery cache time or source is invalid.",
    zh: "发现缓存时间或来源无效。",
  },
  "Discovery cache ID does not match its metadata.": {
    en: "Discovery cache ID does not match its metadata.",
    zh: "发现缓存 ID 与元数据不一致。",
  },
  "Discovery time must be a UTC ISO 8601 timestamp.": {
    en: "Discovery time must be a UTC ISO 8601 timestamp.",
    zh: "发现时间必须为 UTC ISO 8601 时间戳。",
  },
  "This window is read-only. Close other Extension Nest windows and reload this window.": {
    en: "This window is read-only. Close other Extension Nest windows and reload this window.",
    zh: "当前窗口只读。请关闭其他 Extension Nest 窗口后重新加载此窗口。",
  },
  "The cleanup list changed or this window is not writable. Refresh and preview it again.": {
    en: "The cleanup list changed or this window is not writable. Refresh and preview it again.",
    zh: "清理列表已变化或窗口不可写，请刷新后重新预览。",
  },
  "Unable to identify a bundled extension directory. Retry or enable Show Builtin Extensions.": {
    en: "Unable to identify a bundled extension directory. Retry or enable Show Builtin Extensions.",
    zh: "无法识别应用内置扩展目录，请重试或开启 Show Builtin Extensions。",
  },
  Unverified: {
    en: "Unverified",
    zh: "未核验",
  },
  "The visible API inventory was not compared with the native installation inventory by ID, so it is not a complete local inventory.": {
    en: "The visible API inventory was not compared with the native installation inventory by ID, so it is not a complete local inventory.",
    zh: "API 可见清单未与原生安装清单逐个 ID 对照，因此不能作为完整本地清单。",
  },
  "isActive only indicates activation; enabled scope, restriction reasons, restart requirements, and update results were not verified.": {
    en: "isActive only indicates activation; enabled scope, restriction reasons, restart requirements, and update results were not verified.",
    zh: "isActive 仅表示已激活；启用范围、限制原因、待重启与更新结果均未核验。",
  },
  "Checking command registration does not prove management success; this diagnostic does not start, stop, update, or install extensions.": {
    en: "Checking command registration does not prove management success; this diagnostic does not start, stop, update, or install extensions.",
    zh: "命令注册检查不证明管理操作成功；本诊断不会启停、更新或安装扩展。",
  },
  "User paths, workspace contents, complete manifests, and private databases were not collected.": {
    en: "User paths, workspace contents, complete manifests, and private databases were not collected.",
    zh: "未采集用户路径、工作区内容、完整 manifest 或私有数据库。",
  },
} as const;

export type HostMessageKey = keyof typeof HOST_MESSAGES;
export type HostLocale = "en" | "zh";
export type TranslationParams = Record<string, string | number>;

/** 按 VS Code 语言标识选择宿主文案；所有 zh 前缀均按简体中文处理。 */
export function getLocale(language: string = getLanguage()): HostLocale {
  return language.toLocaleLowerCase().startsWith("zh") ? "zh" : "en";
}

/** 读取当前 VS Code 语言；测试替身缺失语言属性时安全回退英文。 */
function getLanguage(): string {
  return typeof vscode.env?.language === "string" ? vscode.env.language : "en";
}

/** 翻译宿主文案并替换显式参数；缺失参数保留占位符，避免吞掉诊断信息。 */
export function t(
  key: HostMessageKey,
  params: TranslationParams = {},
  language: string = getLanguage(),
): string {
  const template = HOST_MESSAGES[key][getLocale(language)];
  return template.replace(/\{([A-Za-z0-9_]+)\}/g, (placeholder, name: string) => (
    Object.hasOwn(params, name) ? String(params[name]) : placeholder
  ));
}

/** 将语言标识、标题和降级 HTML 文本安全地放入 HTML。 */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}
