import * as vscode from "vscode";
import { showCapabilityProbe } from "./capabilityProbe";
import type { Action, DemoState, Extension, Group } from "../demo/src/models";
import { seedState } from "../demo/src/seed";
import { migrateState, reducer } from "../demo/src/state";
import { normalizeTags } from "../demo/src/tags";
import { openNativeExtension } from "./nativeExtensions";
import { DashboardPanel, type DashboardFilter, type DashboardHostCallbacks } from "./dashboardPanel";
import {
  DemoExtensionNode,
  DemoGroupNode,
  DemoTreeProvider,
  isDemoExtensionNode,
  isDemoGroupNode,
} from "./demoTree";

const STATE_KEY = "extensionNest.demo.state";
const VIEW_ID = "extensionNest.groups";

/** 扩展激活时创建演示宿主、原生树和编辑器 Dashboard。 */
export function activate(context: vscode.ExtensionContext): void {
  const host = new ExtensionNestHost(context);
  host.start();
  context.subscriptions.push(host);
}

/** 扩展停用时由 VS Code 释放宿主注册的全部资源。 */
export function deactivate(): void {
  // 演示状态只在动作成功持久化后更新，这里不执行额外写入。
}

/** 连接状态层、TreeView、Dashboard 和演示命令的宿主服务。 */
class ExtensionNestHost implements vscode.Disposable {
  private state: DemoState;
  private readonly tree: DemoTreeProvider;
  private readonly dashboard: DashboardPanel;
  private readonly treeView: vscode.TreeView<DemoGroupNode | DemoExtensionNode>;
  private actionQueue: Promise<void> = Promise.resolve();

  constructor(private readonly context: vscode.ExtensionContext) {
    this.state = readPersistedState(context);
    this.tree = new DemoTreeProvider(this.state, (action) => this.dispatchAction(action));
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
      onOpenExtension: (id) => openNativeExtension(id, this.state),
    };
    this.dashboard = new DashboardPanel(context.extensionUri, callbacks);
  }

  /** 注册所有演示命令并把初始快照交给原生树。 */
  start(): void {
    this.tree.setState(this.state);
    this.registerCommands();
    if (this.context.extensionMode === vscode.ExtensionMode.Development) {
      void this.openDevelopmentPreview();
    }
  }

  /** 释放树视图、Dashboard 和宿主事件资源。 */
  dispose(): void {
    this.dashboard.dispose();
    this.tree.dispose();
    this.treeView.dispose();
  }

  /** 注册菜单使用的原生命令；所有管理动作只修改演示状态。 */
  private registerCommands(): void {
    const register = <T extends unknown[]>(
      command: string,
      callback: (...args: T) => unknown,
    ): void => {
      this.context.subscriptions.push(vscode.commands.registerCommand(command, callback));
    };

    register("extensionNest.openDashboard", (value?: unknown) => this.openDashboard(value));
    register("extensionNest.inspectCapabilities", () => showCapabilityProbe());
    register("extensionNest.showGroups", () => this.focusGroupsView());
    register("extensionNest.createGroup", () => this.createGroup());
    register("extensionNest.renameGroup", (value?: unknown) => this.renameGroup(value));
    register("extensionNest.deleteGroup", (value?: unknown) => this.deleteGroup(value));
    register("extensionNest.toggle", (value?: unknown) => this.toggleExtension(value));
    register("extensionNest.update", (value?: unknown) => this.updateExtension(value));
    register("extensionNest.setTags", (value?: unknown) => this.setTags(value));
    register("extensionNest.groupUp", (value?:unknown)=>this.shiftGroup(value,-1));
    register("extensionNest.groupDown", (value?:unknown)=>this.shiftGroup(value,1));
    register("extensionNest.extensionUp", (value?:unknown)=>this.shiftExtension(value,-1));
    register("extensionNest.extensionDown", (value?:unknown)=>this.shiftExtension(value,1));
    register("extensionNest.sortGroups", async()=>{
      const choice=await vscode.window.showQuickPick(['Name A–Z','Name Z–A'],{placeHolder:'Sort groups'});
      if(choice)await this.dispatchAction({type:'sortGroups',direction:choice==='Name A–Z'?1:-1});
    });
    register("extensionNest.sortExtensions", async(value?:unknown)=>{
      const groupId=isDemoGroupNode(value)?value.groupId:undefined;if(groupId===undefined)return;
      const choices=[{label:'Name A–Z',field:'name',direction:1},{label:'Name Z–A',field:'name',direction:-1},{label:'Publisher A–Z',field:'publisher',direction:1},{label:'Publisher Z–A',field:'publisher',direction:-1},{label:'ID A–Z',field:'id',direction:1},{label:'ID Z–A',field:'id',direction:-1}];
      const choice=await vscode.window.showQuickPick(choices,{placeHolder:'Sort extensions in group'});
      if(choice)await this.dispatchAction({type:'sortExtensions',groupId,field:choice.field,direction:choice.direction});
    });
    register("extensionNest.resetDemo", () => this.resetDemo());
  }

  private async shiftGroup(value:unknown,direction:-1|1):Promise<void>{
    const id=getGroupId(value);if(id)await this.dispatchAction({type:'shiftGroup',id,direction});
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

  /** 提示用户创建一个演示组并通过宿主动作管线提交。 */
  private async createGroup(): Promise<void> {
    const name = await vscode.window.showInputBox({
      prompt: "Create a demo extension group",
      placeHolder: "Group name",
      ignoreFocusOut: true,
      validateInput: (value) => validateGroupNameInput(value, this.state.groups),
    });
    if (name !== undefined) {
      await this.dispatchAction({ type: "createGroup", name });
    }
  }

  /** 提示用户重命名演示组并保留原有组 ID。 */
  private async renameGroup(value?: unknown): Promise<void> {
    const groupId = getGroupId(value);
    const group = groupId ? this.state.groups.find((candidate) => candidate.id === groupId) : undefined;
    if (!group) {
      return;
    }

    const name = await vscode.window.showInputBox({
      prompt: `Rename demo group “${group.name}”`,
      value: group.name,
      ignoreFocusOut: true,
      validateInput: (input) => validateGroupNameInput(input, this.state.groups, group.id),
    });
    if (name !== undefined) {
      await this.dispatchAction({ type: "renameGroup", id: group.id, name });
    }
  }

  /** 在明确说明只删除演示元数据后确认组删除。 */
  private async deleteGroup(value?: unknown): Promise<void> {
    const groupId = getGroupId(value);
    const group = groupId ? this.state.groups.find((candidate) => candidate.id === groupId) : undefined;
    if (!group) {
      return;
    }

    const choice = await vscode.window.showWarningMessage(
      `Delete the demo group “${group.name}”? Its demo extensions will become Ungrouped; no real extension will be affected.`,
      { modal: true },
      "Delete Demo Group",
      "Cancel",
    );
    if (choice === "Delete Demo Group") {
      await this.dispatchAction({ type: "deleteGroup", id: group.id });
    }
  }

  /** 翻转单个演示扩展的状态，不触碰 VS Code 真实扩展。 */
  private async toggleExtension(value?: unknown): Promise<void> {
    const id = getExtensionId(value, this.state);
    if (id) {
      await this.dispatchAction({ type: "toggle", id });
    }
  }

  /** 应用单个演示扩展的可用更新版本。 */
  private async updateExtension(value?: unknown): Promise<void> {
    const id = getExtensionId(value, this.state);
    if (id) {
      await this.dispatchAction({ type: "update", id });
    }
  }

  /** 通过逗号分隔的输入编辑一个或多个演示扩展的独立标签。 */
  private async setTags(value?: unknown): Promise<void> {
    const ids = getExtensionIds(value, this.state);
    if (ids.length === 0) {
      return;
    }

    const firstExtension = this.state.extensions.find((extension) => extension.id === ids[0]);
    const input = await vscode.window.showInputBox({
      prompt: `Edit demo tags for ${ids.length === 1 ? firstExtension?.name ?? "extension" : `${ids.length} extensions`}`,
      value: firstExtension?.tags.join(", ") ?? "",
      placeHolder: "tag1, tag2, tag3",
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

  /** 在明确说明只恢复演示数据后重置整个演示状态。 */
  private async resetDemo(): Promise<void> {
    const choice = await vscode.window.showWarningMessage(
      "Reset Extension Nest Demo data to its sample state? This changes only demo metadata and does not manage real extensions.",
      { modal: true },
      "Reset Demo",
      "Cancel",
    );
    if (choice === "Reset Demo") {
      await this.dispatchAction({ type: "reset" });
    }
  }

  /** 在动作队列中校验消息、运行 reducer，并在持久化成功后同步两个界面。 */
  private dispatchAction(input: unknown): Promise<void> {
    return this.enqueue(async () => {
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
      this.state = next;
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
  private async persist(state: DemoState): Promise<boolean> {
    try {
      await this.context.globalState.update(STATE_KEY, state);
      return true;
    } catch (error) {
      this.reportError(`Could not save Extension Nest demo state: ${getErrorMessage(error)}`);
      return false;
    }
  }

  /** 同时在原生通知和 Dashboard 状态区报告错误。 */
  private reportError(message: string): void {
    void vscode.window.showErrorMessage(message);
    void this.dashboard.postError(message);
  }

  /** 把状态更新广播给原生树和已打开的 Dashboard。 */
  private notifyStateChanged(): void {
    this.tree.setState(this.state);
    void this.dashboard.postState(this.state);
  }

  /** 把命令参数解析为合法的 Dashboard 筛选值。 */
  private resolveDashboardFilter(value: unknown): DashboardFilter {
    if (isDemoGroupNode(value)) {
      return value.groupId === null ? "ungrouped" : value.groupId;
    }
    if (isDemoExtensionNode(value)) {
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

  /** 返回某一演示组当前包含的扩展数量。 */
  private countExtensions(groupId: string): number {
    return this.state.extensions.filter((extension) => extension.groupId === groupId).length;
  }
}

/** 读取有效的 globalState；没有有效快照时使用 seed 副本而不覆盖原值。 */
function readPersistedState(context: vscode.ExtensionContext): DemoState {
  const stored: unknown = context.globalState.get<unknown>(STATE_KEY);
  return migrateState(stored) ?? cloneState(seedState);
}

/** 深复制状态，避免把 globalState 或 seedState 的对象直接交给 reducer。 */
function cloneState(state: DemoState): DemoState {
  return {
    schemaVersion: 1,
    groups: state.groups.map((group) => ({ ...group })),
    extensions: state.extensions.map((extension) => ({ ...extension, tags: [...extension.tags] })),
  };
}

/** 校验来自 Webview 或命令的动作，确保只允许当前状态中的 ID。 */
function parseAction(value: unknown, state: DemoState): Action | undefined {
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
    case "toggle":
      return isNonEmptyString(value.id) && extensionIds.has(value.id)
        ? { type: "toggle", id: value.id }
        : undefined;
    case "update":
      return isNonEmptyString(value.id) && extensionIds.has(value.id)
        ? { type: "update", id: value.id }
        : undefined;
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
    case "shiftGroup":
      return typeof value.id==='string'&&groupIds.has(value.id)&&(value.direction===1||value.direction===-1)
        ? {type:'shiftGroup',id:value.id,direction:value.direction}:undefined;
    case "sortGroups":
      return value.direction===1||value.direction===-1?{type:'sortGroups',direction:value.direction}:undefined;
    case "shiftExtension":
      return typeof value.id==='string'&&extensionIds.has(value.id)&&(value.direction===1||value.direction===-1)
        ? {type:'shiftExtension',id:value.id,direction:value.direction}:undefined;
    case "sortExtensions":
      return (value.groupId===null||typeof value.groupId==='string'&&groupIds.has(value.groupId))
        &&(value.field==='name'||value.field==='publisher'||value.field==='id')&&(value.direction===1||value.direction===-1)
        ? {type:'sortExtensions',groupId:value.groupId,field:value.field,direction:value.direction}:undefined;
    case "reset":
      return { type: "reset" };
    default:
      return undefined;
  }
}

/** 校验组名输入并为输入框提供可读错误信息。 */
function validateGroupNameInput(value: string, groups: readonly Group[], currentId?: string): string | undefined {
  const name = value.trim();
  if (name.length === 0) {
    return "Group name cannot be empty.";
  }
  if (name.toLowerCase() === "ungrouped") { return "Ungrouped is reserved for unassigned extensions."; }
  if (Array.from(name).length > 50) {
    return "Group name must be 50 characters or fewer.";
  }
  const duplicate = groups.some(
    (group) => group.id !== currentId && group.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase(),
  );
  return duplicate ? "A demo group with this name already exists." : undefined;
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
  return isDemoGroupNode(value) && value.groupId !== null ? value.groupId : undefined;
}

/** 从原生命令参数中安全提取扩展 ID。 */
function getExtensionId(value: unknown, state: DemoState): string | undefined {
  if (isDemoExtensionNode(value)) {
    return value.extension.id;
  }
  if (typeof value === "string" && state.extensions.some((extension) => extension.id === value)) {
    return value;
  }
  return undefined;
}

/** 支持树节点或节点数组的扩展命令参数，并去除未知 ID。 */
function getExtensionIds(value: unknown, state: DemoState): string[] {
  const values = Array.isArray(value) ? value : [value];
  const ids = values.flatMap((item) => {
    if (isDemoExtensionNode(item)) {
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

/** 把未知异常转换为用户可读的错误文本。 */
function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
