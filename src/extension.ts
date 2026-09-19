import { RefreshCoordinator } from './refreshCoordinator';
import { DiscoveryRepository } from "./discoveryRepository";
import { readBundledExtensionIds } from "./bundledExtensions";
import { WriterLease } from "./writerLease";
import * as vscode from "vscode";
import { showCapabilityProbe } from "./capabilityProbe";
import type { Action, DashboardState, Group } from "../webview/src/models";
import { reducer } from "../webview/src/state";
import { normalizeTags } from "../webview/src/tags";
import { setUiLanguage } from "../webview/src/uiI18n";
import { openNativeExtension } from "./nativeExtensions";
import { DashboardPanel, type DashboardFilter, type DashboardHostCallbacks } from "./dashboardPanel";
import { t } from "./i18n";
import {
  ExtensionNode,
  ExtensionGroupNode,
  ExtensionTreeProvider,
  isExtensionNode,
  isExtensionGroupNode,
} from "./extensionTree";


const VIEW_ID = "extensionNest.groups";

/** 扩展激活时创建扩展宿主、原生树和编辑器 Dashboard。 */
export function activate(context: vscode.ExtensionContext): { getSnapshot(): DashboardState } | undefined {
  setUiLanguage(vscode.env.language);
  const host = new ExtensionNestHost(context);
  host.start();
  context.subscriptions.push(host);
  return context.extensionMode === vscode.ExtensionMode.Development ? { getSnapshot: () => host.getSnapshot() } : undefined;
}

/** 扩展停用时由 VS Code 释放宿主注册的全部资源。 */
export function deactivate(): void {
  // 视图状态只在动作成功持久化后更新，这里不执行额外写入。
}

/** 连接状态层、TreeView、Dashboard 和组织命令的宿主服务。 */
class ExtensionNestHost implements vscode.Disposable {
  /** 只向开发宿主提供副本，供隔离集成测试核验真实视图快照。 */
  getSnapshot(): DashboardState { return structuredClone(this.state); }
  private state: DashboardState;
  private readonly tree: ExtensionTreeProvider;
  private readonly dashboard: DashboardPanel;
  private readonly treeView: vscode.TreeView<ExtensionGroupNode | ExtensionNode>;
  private readonly repository: DiscoveryRepository;
  private readonly lease: WriterLease;
  private disposed = false;
  private readonly refreshCoordinator: RefreshCoordinator;
  private actionQueue: Promise<void> = Promise.resolve();

  constructor(private readonly context: vscode.ExtensionContext) {
    this.repository = new DiscoveryRepository(context.globalState);
    this.refreshCoordinator = new RefreshCoordinator(work => this.enqueue(work), current => this.readSnapshot(current));
    this.lease = new WriterLease(context.globalStorageUri.toString());
    this.state = this.repository.state;
    this.tree = new ExtensionTreeProvider(this.state, (action) => this.dispatchAction(action));
    this.treeView = vscode.window.createTreeView(VIEW_ID, {
      treeDataProvider: this.tree,
      canSelectMany: true,
      showCollapseAll: true,
      dragAndDropController: this.tree,
    });

    const callbacks: DashboardHostCallbacks = {
      getState: () => this.state,
      onAction: (action) => this.dispatchAction(action),
      onShowGroups: () => this.focusGroupsView(),
      onOpenExtension: async (id) => {
        if (await openNativeExtension(id, this.state) === 'Failed') throw new Error(t("Native extension page navigation failed."));
      },
      onRefresh: () => this.refresh(),
      onRepairData: () => this.repairDamagedData(),
      onCleanupUnverified: () => this.cleanupUnverified(),
      onOpenExtensions: async () => { await vscode.commands.executeCommand("workbench.view.extensions"); },
    };
    this.dashboard = new DashboardPanel(context.extensionUri, callbacks);
  }

  /** 注册所有组织命令并把初始快照交给原生树。 */
  start(): void {
    this.tree.setState(this.state);
    this.registerCommands();
    this.context.subscriptions.push(vscode.extensions.onDidChange(() => this.scheduleRefresh()),
      vscode.workspace.onDidChangeConfiguration(event => { if (event.affectsConfiguration('extensionNest.showBuiltinExtensions')) this.scheduleRefresh(); }),
      vscode.window.onDidChangeWindowState(event => { if (event.focused) this.scheduleRefresh(); }));
    void this.lease.acquire().then(() => { if (!this.disposed) void this.refresh(); });
    if (this.context.extensionMode === vscode.ExtensionMode.Development) {
      void this.openDevelopmentPreview();
    }
  }

  /** 释放树视图、Dashboard 和宿主事件资源。 */
  dispose(): void {
    this.disposed = true;
    this.refreshCoordinator.dispose();
    void this.actionQueue.finally(() => this.lease.dispose());
    this.dashboard.dispose();
    this.tree.dispose();
    this.treeView.dispose();
  }

  /** 注册菜单使用的原生命令；所有管理动作只修改视图状态。 */
  private registerCommands(): void {
    const register = <T extends unknown[]>(
      command: string,
      callback: (...args: T) => unknown,
    ): void => {
      this.context.subscriptions.push(vscode.commands.registerCommand(command, callback));
    };

    register("extensionNest.openDashboard", (value?: unknown) => this.openDashboard(value));
    register("extensionNest.inspectCapabilities", () => showCapabilityProbe());
    register("extensionNest.refresh", () => this.refresh());
    register("extensionNest.repairData", () => this.repairDamagedData());
    register("extensionNest.cleanupUnverified", () => this.cleanupUnverified());
    register("extensionNest.openExtension", async (value?: unknown) => {
      const id = getExtensionId(value, this.state);
      if (id && await openNativeExtension(id, this.state) === "Failed") this.reportError(t("Native extension page navigation failed."));
    });
    register("extensionNest.copyId", async (value?: unknown) => {
      const id = getExtensionId(value, this.state);
      if (id) await vscode.env.clipboard.writeText(id);
    });
    register("extensionNest.showGroups", () => this.focusGroupsView());
    register("extensionNest.createGroup", () => this.createGroup());
    register("extensionNest.renameGroup", (value?: unknown) => this.renameGroup(value));
    register("extensionNest.deleteGroup", (value?: unknown) => this.deleteGroup(value));
    register("extensionNest.setTags", (value?: unknown) => this.setTags(value));
    register("extensionNest.groupUp", (value?:unknown)=>this.shiftGroup(value,-1));
    register("extensionNest.groupDown", (value?:unknown)=>this.shiftGroup(value,1));
    register("extensionNest.extensionUp", (value?:unknown)=>this.shiftExtension(value,-1));
    register("extensionNest.extensionDown", (value?:unknown)=>this.shiftExtension(value,1));
    register("extensionNest.sortExtensions", async(value?:unknown)=>{
      const groupId=isExtensionGroupNode(value)?value.groupId:undefined;if(groupId===undefined)return;
      const choices=[{label:t('Name A–Z'),field:'name',direction:1},{label:t('Name Z–A'),field:'name',direction:-1},{label:t('Publisher A–Z'),field:'publisher',direction:1},{label:t('Publisher Z–A'),field:'publisher',direction:-1}];
      const choice=await vscode.window.showQuickPick(choices,{placeHolder:t('Sort extensions in group')});
      if(choice)await this.dispatchAction({type:'sortExtensions',groupId,field:choice.field,direction:choice.direction});
    });
  }

  private async shiftGroup(value:unknown,direction:-1|1):Promise<void>{
    const id=getGroupId(value);if(id)await this.dispatchAction({type:'shiftGroup',id,direction});
  }

  private async repairDamagedData(): Promise<void> {
    if (this.disposed) return;
    if (!this.lease.owned) { this.reportError(t('Repair requires the writable window.')); return; }
    const candidates = this.repository.repairCandidates();
    if (!candidates.length) { void vscode.window.showInformationMessage(t('No damaged data found.')); return; }
    const choices = candidates.map(candidate => ({ label: t(candidate.target === 'organization' ? 'Organization data' : 'Discovery cache'), candidate }));
    const selected = choices.length === 1 ? choices[0] : await vscode.window.showQuickPick(choices, { placeHolder: t('Choose damaged data to reset') });
    if (!selected || this.disposed) return;
    const confirmed = await vscode.window.showWarningMessage(t('Reset damaged {target}?', { target: selected.label }), {
      modal: true, detail: t(selected.candidate.target === 'organization'
        ? 'Groups, assignments, manual tags and order will be lost. Discovery history will be kept. No backup is created. Extensions are not changed.'
        : 'Discovery history, automatic categories and scan times will be cleared. Organization data will be kept. Visible extensions can be scanned again. No backup is created.'),
    }, t('Reset permanently'));
    if (confirmed !== t('Reset permanently') || this.disposed) return;
    try {
      await this.enqueue(async () => {
        if (await this.repository.resetDamaged(selected.candidate, this.lease.owned, () => !this.disposed)) {
          this.state = this.repository.state; this.notifyStateChanged();
        }
      });
      await this.refresh();
    } catch (error) { this.reportError(getErrorMessage(error)); }
  }

  /** 原生多选列表预览精确 ID 与受影响元数据，确认前不写入或删除。 */
  private async cleanupUnverified(): Promise<void> {
    await this.refresh();
    if (this.disposed) return;
    if (this.state.readOnly || this.state.freshness !== 'Ready') {
      this.reportError(t('Current window cannot clean up records. Resolve the read error first or use a writable window.')); return;
    }
    const candidates = this.repository.cleanupCandidates();
    if (!candidates.length) {
      void vscode.window.showInformationMessage(t('No old records can be cleaned up. Previously discovered records that are not currently visible are kept.'));
      return;
    }
    const selected = await vscode.window.showQuickPick(candidates.map(extension => ({
      label: extension.id,
      description: t('Not found'),
      detail: t('Group: {group} · Tags: {tags}', {
        group: this.state.groups.find(group => group.id === extension.groupId)?.name ?? t('Ungrouped'),
        tags: extension.tags.join(', ') || t('None'),
      }),
      extension,
    })), { canPickMany: true, ignoreFocusOut: true, title: t('Clean up old records'),
      placeHolder: t("Select old records you no longer need. Not found in this scan does not mean uninstalled. Only this extension's records will be removed; extensions will not be uninstalled.") });
    if (!selected?.length) return;
    const ids = selected.map(item => item.extension.id);
    const confirmed = await vscode.window.showWarningMessage(t('Clean up these {count} old records?', { count: ids.length }), {
      modal: true,
      detail: `${ids.join('\n')}\n\n${t('The group assignments, tags, and order records for these IDs will be removed. Groups and real discovery history will be kept. This is permanent, no backup is created, and this extension cannot restore the records.')}`,
    }, t('Delete permanently'));
    if (confirmed !== t('Delete permanently')) return;
    await this.enqueue(async () => {
      if (this.disposed) return;
      try {
        // 对话框期间事件和其他组织动作仍可运行，必须复查用户实际确认的元数据。
        for (const item of selected) {
          const latest = this.state.extensions.find(extension => extension.id === item.extension.id);
          if (!latest || latest.groupId !== item.extension.groupId || JSON.stringify(latest.tags) !== JSON.stringify(item.extension.tags)) {
            throw new Error(t('Previewed records changed. Review the cleanup list again.'));
          }
        }
        const count = await this.repository.cleanupUnverified(ids, () => !this.disposed);
        this.state = this.repository.state; this.notifyStateChanged();
        if (!this.disposed) void vscode.window.showInformationMessage(t('Permanently deleted {count} old records.', { count }));
      } catch (error) { this.reportError(getErrorMessage(error)); }
    });
  }

  private async shiftExtension(value:unknown,direction:-1|1):Promise<void>{
    const id=getExtensionId(value,this.state);if(id)await this.dispatchAction({type:'shiftExtension',id,direction});
  }

  /** 打开编辑器 Dashboard，并在原生组点击时传递对应筛选。 */
  private async openDashboard(value?: unknown): Promise<void> {
    const filter = this.resolveDashboardFilter(value);
    await this.dashboard.open(filter);
    await this.dashboard.postState(this.state);
  }

  /** 开发扩展宿主启动时打开 Dashboard，并把焦点留在原生分组视图。 */
  private async openDevelopmentPreview(): Promise<void> {
    await this.dashboard.open("all");
    await this.dashboard.postState(this.state);
    await this.focusGroupsView();
  }

  /** 聚焦 Extension Nest 独立侧边栏中的原生分组视图。 */
  private async focusGroupsView(): Promise<void> {
    await vscode.commands.executeCommand(`${VIEW_ID}.focus`);
  }

  /** 提示用户创建一个分组并通过宿主动作管线提交。 */
  private async createGroup(): Promise<void> {
    const name = await vscode.window.showInputBox({
      prompt: t("Create an extension group"),
      placeHolder: t("Group name"),
      ignoreFocusOut: true,
      validateInput: (value) => validateGroupNameInput(value, this.state.groups),
    });
    if (name !== undefined) {
      await this.dispatchAction({ type: "createGroup", name });
    }
  }

  /** 提示用户重命名分组并保留原有组 ID。 */
  private async renameGroup(value?: unknown): Promise<void> {
    const groupId = getGroupId(value);
    const group = groupId ? this.state.groups.find((candidate) => candidate.id === groupId) : undefined;
    if (!group) {
      return;
    }

    const name = await vscode.window.showInputBox({
      prompt: t("Rename group “{name}”", { name: group.name }),
      value: group.name,
      ignoreFocusOut: true,
      validateInput: (input) => validateGroupNameInput(input, this.state.groups, group.id),
    });
    if (name !== undefined) {
      await this.dispatchAction({ type: "renameGroup", id: group.id, name });
    }
  }

  /** 在明确说明只删除组织元数据后确认组删除。 */
  private async deleteGroup(value?: unknown): Promise<void> {
    const groupId = getGroupId(value);
    const group = groupId ? this.state.groups.find((candidate) => candidate.id === groupId) : undefined;
    if (!group) {
      return;
    }

    const choice = await vscode.window.showWarningMessage(
      t("Delete the group “{name}”? Its known extensions will become Ungrouped; no real extension will be affected.", { name: group.name }),
      { modal: true },
      t("Delete Group"),
      t("Cancel"),
    );
    if (choice === t("Delete Group")) {
      await this.dispatchAction({ type: "deleteGroup", id: group.id });
    }
  }

  /** 通过逗号分隔的输入编辑一个或多个已知扩展的独立标签。 */
  private async setTags(value?: unknown): Promise<void> {
    const ids = getExtensionIds(value, this.state);
    if (ids.length === 0) {
      return;
    }

    const firstExtension = this.state.extensions.find((extension) => extension.id === ids[0]);
    const target = ids.length === 1
      ? firstExtension?.name ?? t("extension")
      : t("{count} extensions", { count: ids.length });
    const input = await vscode.window.showInputBox({
      prompt: t("Edit manual tags for {target}; automatic categories are kept separately.", { target }),
      value: firstExtension?.tags.join(", ") ?? "",
      placeHolder: t("tag1, tag2, tag3"),
      ignoreFocusOut: true,
      validateInput: (raw) => validateTagsInput(raw),
    });
    if (input === undefined) {
      return;
    }

    const tags = parseTagsInput(input);
    if (tags) {
      await this.dispatchAction({ type: "setTags", ids, tags });
    }
  }

  /** 在动作队列中校验消息、运行 reducer，并在持久化成功后同步两个界面。 */
  private dispatchAction(input: unknown): Promise<void> {
    return this.enqueue(async () => {
      if (this.disposed || this.state.readOnly) {
        this.reportError(t("This window is read-only. Close other Extension Nest windows and reload this window, or resolve the read error and refresh."));
        return;
      }
      const action = parseAction(input, this.state);
      if (!action) {
        return;
      }
      const next = reducer(this.state, action);
      if (next === this.state) {
        return;
      }
      if (!(await this.persist(next))) {
        return;
      }
      this.state = this.repository.state;
      this.notifyStateChanged();
    });
  }

  /** 串行化来自树、Dashboard 和命令菜单的写操作，避免并发覆盖。 */
  private enqueue(operation: () => Promise<void>): Promise<void> {
    const next = this.actionQueue.then(operation);
    this.actionQueue = next.catch(() => undefined);
    return next;
  }

  /** 保存状态快照，失败时保留当前有效状态并报告原因。 */
  private async persist(state: DashboardState): Promise<boolean> {
    try {
      await this.repository.save(state, () => !this.disposed);
      return !this.disposed;
    } catch (error) {
      if (this.disposed) return false;
      this.repository.fail(error);
      this.state = this.repository.state;
      this.notifyStateChanged();
      this.reportError(t("Could not save Extension Nest state: {error}", { error: getErrorMessage(error) }));
      return false;
    }
  }

  /** 同时在原生通知和 Dashboard 状态区报告错误。 */
  private reportError(message: string): void {
    if (this.disposed) return;
    void vscode.window.showErrorMessage(message);
    void this.dashboard.postError(message);
  }

  /** 把状态更新广播给原生树和已打开的 Dashboard。 */
  private notifyStateChanged(): void {
    if (this.disposed) return;
    this.treeView.message = this.state.error ?? (this.state.readOnly
      ? t("Read-only · Close other Extension Nest windows and reload to edit.")
      : t("Local host · {status}", { status: translateFreshness(this.state.freshness) }));
    this.tree.setState(this.state);
    void this.dashboard.postState(this.state);
  }

  /** 把命令参数解析为合法的 Dashboard 筛选值。 */
  private resolveDashboardFilter(value: unknown): DashboardFilter {
    if (isExtensionGroupNode(value)) {
      return value.groupId === null ? "ungrouped" : value.groupId;
    }
    if (isExtensionNode(value)) {
      return value.groupId === null ? "ungrouped" : value.groupId;
    }
    if (value === "ungrouped") {
      return "ungrouped";
    }
    if (typeof value === "string" && this.state.groups.some((group) => group.id === value)) {
      return value;
    }
    return "all";
  }

  /** 安装、焦点、可见性和手动入口统一合并，事件风暴只保留一次补读。 */
  private scheduleRefresh(): void {
    void this.refreshCoordinator.request(150).catch(error => this.reportError(getErrorMessage(error)));
  }

  private refresh(): Promise<void> { return this.refreshCoordinator.request(); }

  private async readSnapshot(current: () => boolean): Promise<void> {
    if (!current()) return;
    let hiddenIds: ReadonlySet<string>;
    try {
      hiddenIds = vscode.workspace.getConfiguration('extensionNest').get<boolean>('showBuiltinExtensions', false)
        ? new Set() : readBundledExtensionIds(vscode.env.appRoot);
    } catch (error) {
      this.repository.fail(error, true);
      this.state = this.repository.state;
      this.notifyStateChanged();
      return;
    }
    await this.repository.refresh(() => {
      if (vscode.env.uiKind !== vscode.UIKind.Desktop || this.context.extension.extensionKind !== vscode.ExtensionKind.UI
        || this.context.extensionUri.scheme !== 'file') throw new Error(t('Desktop VS Code with a local UI extension host is required.'));
      return vscode.extensions.all.map(extension => {
        const manifest = extension.packageJSON;
        return { id: extension.id, name: manifest.displayName || manifest.name || extension.id,
          publisher: manifest.publisher || extension.id.split('.')[0], description: manifest.description || '',
          version: manifest.version || '—', categories: manifest.categories };
      });
    }, this.lease.owned, current, hiddenIds);
    if (!current()) return;
    this.state = this.repository.state;
    this.notifyStateChanged();
  }

  /** 返回组当前包含的已知扩展数量。 */
  private countExtensions(groupId: string): number {
    return this.state.extensions.filter((extension) => extension.groupId === groupId).length;
  }
}

/** 校验来自 Webview 或命令的动作，确保只允许当前状态中的 ID。 */
function parseAction(value: unknown, state: DashboardState): Action | undefined {
  if (!isRecord(value) || typeof value.type !== "string") {
    return undefined;
  }

  const extensionIds = new Set(state.extensions.map((extension) => extension.id));
  const groupIds = new Set(state.groups.map((group) => group.id));
  switch (value.type) {
    case "move": {
      if (!Array.isArray(value.ids) || !value.ids.every(isNonEmptyString)) {
        return undefined;
      }
      const ids = [...new Set(value.ids)];
      if (ids.some((id) => !extensionIds.has(id))) {
        return undefined;
      }
      const groupId = value.groupId;
      if (groupId !== null && (typeof groupId !== "string" || !groupIds.has(groupId))) {
        return undefined;
      }
      const beforeId = value.beforeId;
      if (beforeId !== undefined && beforeId !== null && (typeof beforeId !== "string" || ids.includes(beforeId) || !state.extensions.some(e => e.id === beforeId && e.groupId === groupId))) return undefined;
      return { type: "move", ids, groupId, beforeId };
    }
    case "setTags": {
      if (!Array.isArray(value.ids) || !value.ids.every(isNonEmptyString)) {
        return undefined;
      }
      const ids = [...new Set(value.ids)];
      if (ids.length === 0 || ids.some((id) => !extensionIds.has(id))) {
        return undefined;
      }
      if (!Array.isArray(value.tags) || !value.tags.every((tag) => typeof tag === "string")) {
        return undefined;
      }
      try {
        return { type: "setTags", ids, tags: normalizeTags(value.tags) };
      } catch {
        return undefined;
      }
    }
    case "createGroup":
      return typeof value.name === "string" ? { type: "createGroup", name: value.name } : undefined;
    case "renameGroup":
      return isNonEmptyString(value.id) && groupIds.has(value.id) && typeof value.name === "string"
        ? { type: "renameGroup", id: value.id, name: value.name }
        : undefined;
    case "deleteGroup":
      return isNonEmptyString(value.id) && groupIds.has(value.id)
        ? { type: "deleteGroup", id: value.id }
        : undefined;
    case "reorderGroup":
      return isNonEmptyString(value.id) && isNonEmptyString(value.targetId)
        && groupIds.has(value.id) && groupIds.has(value.targetId) && value.id !== value.targetId && (value.after === undefined || typeof value.after === "boolean")
        ? { type: "reorderGroup", id: value.id, targetId: value.targetId, after: value.after as boolean | undefined }
        : undefined;
    case "sortGroups":
      return value.direction===1||value.direction===-1 ? {type:"sortGroups",direction:value.direction}:undefined;
    case "shiftGroup":
      return typeof value.id==='string'&&groupIds.has(value.id)&&(value.direction===1||value.direction===-1)
        ? {type:'shiftGroup',id:value.id,direction:value.direction}:undefined;
    case "shiftExtension":
      return typeof value.id==='string'&&extensionIds.has(value.id)&&(value.direction===1||value.direction===-1)
        ? {type:'shiftExtension',id:value.id,direction:value.direction}:undefined;
    case "sortExtensions":
      return (value.groupId===null||typeof value.groupId==='string'&&groupIds.has(value.groupId))
        &&(value.field==='name'||value.field==='publisher')&&(value.direction===1||value.direction===-1)
        ? {type:'sortExtensions',groupId:value.groupId,field:value.field,direction:value.direction}:undefined;
    default:
      return undefined;
  }
}

/** 校验组名输入并为输入框提供可读错误信息。 */
function validateGroupNameInput(value: string, groups: readonly Group[], currentId?: string): string | undefined {
  const name = value.trim();
  if (name.length === 0) {
    return t("Group name cannot be empty.");
  }
  if (name.toLowerCase() === "ungrouped") { return t("Ungrouped is reserved for unassigned extensions."); }
  if (Array.from(name).length > 50) {
    return t("Group name must be 50 characters or fewer.");
  }
  const duplicate = groups.some(
    (group) => group.id !== currentId && group.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase(),
  );
  return duplicate ? t("A group with this name already exists.") : undefined;
}

/** 把输入框中的逗号分隔文本转换为规范化标签，空值表示清空标签。 */
function parseTagsInput(value: string): string[] | undefined {
  try {
    return normalizeTags(value.split(","));
  } catch {
    return undefined;
  }
}

/** 为标签输入框提供规范化失败原因。 */
function validateTagsInput(value: string): string | undefined {
  try {
    normalizeTags(value.split(","));
    return undefined;
  } catch (error) {
    return getErrorMessage(error);
  }
}

/** 从原生命令参数中安全提取组 ID。 */
function getGroupId(value: unknown): string | undefined {
  return isExtensionGroupNode(value) && value.groupId !== null ? value.groupId : undefined;
}

/** 从原生命令参数中安全提取扩展 ID。 */
function getExtensionId(value: unknown, state: DashboardState): string | undefined {
  if (isExtensionNode(value)) {
    return value.extension.id;
  }
  if (typeof value === "string" && state.extensions.some((extension) => extension.id === value)) {
    return value;
  }
  return undefined;
}

/** 支持树节点或节点数组的扩展命令参数，并去除未知 ID。 */
function getExtensionIds(value: unknown, state: DashboardState): string[] {
  const values = Array.isArray(value) ? value : [value];
  const ids = values.flatMap((item) => {
    if (isExtensionNode(item)) {
      return [item.extension.id];
    }
    return typeof item === "string" ? [item] : [];
  });
  return [...new Set(ids)].filter((id) => state.extensions.some((extension) => extension.id === id));
}

/** 判断未知值是否为普通对象，并收窄为安全读取的记录。 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** 判断值是否为非空字符串。 */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** 将状态机值转换为当前语言的树视图状态文案。 */
function translateFreshness(value: DashboardState['freshness']): string {
  switch (value) {
    case 'Ready': return t('Ready');
    case 'Stale': return t('Stale');
    case 'Error': return t('Error');
    case 'Loading':
    case undefined:
    default: return t('Loading');
  }
}

/** 把未知异常转换为用户可读的错误文本。 */
function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
