import * as vscode from "vscode";
import type { Action, DemoState, Extension, Group } from "../demo/src/models";
import { groupColorToken } from "../demo/src/groupColors";

/** 将现有分类色板映射到可被 VS Code 主题覆盖的图标颜色。 */
function groupIconColor(color: string | undefined): vscode.ThemeColor {
  return new vscode.ThemeColor(groupColorToken(color) ?? "descriptionForeground");
}

/** 组树节点，Ungrouped 使用 null 作为组 ID。 */
export class DemoGroupNode {
  readonly kind = "group" as const;

  constructor(
    readonly groupId: string | null,
    readonly label: string,
    readonly color: string | undefined,
  ) {}
}

/** 演示扩展树节点，节点只代表状态中的演示记录。 */
export class DemoExtensionNode {
  readonly kind = "extension" as const;

  constructor(
    readonly extension: Extension,
    readonly groupId: string | null,
  ) {}
}

/** TreeView 使用的节点联合类型。 */
export type DemoTreeNode = DemoGroupNode | DemoExtensionNode;

/** 判断值是否为组节点。 */
export function isDemoGroupNode(value: unknown): value is DemoGroupNode {
  return value instanceof DemoGroupNode;
}

/** 判断值是否为扩展节点。 */
export function isDemoExtensionNode(value: unknown): value is DemoExtensionNode {
  return value instanceof DemoExtensionNode;
}

/** 负责把演示状态投影为 VS Code 原生分组树。 */
export class DemoTreeProvider
  implements vscode.TreeDataProvider<DemoTreeNode>, vscode.TreeDragAndDropController<DemoTreeNode>
{
  readonly dropMimeTypes = [
    "application/vnd.code.tree.extensionnest.groups",
    "application/vnd.extension-nest.demo-group",
    "application/vnd.extension-nest.demo-extension",
  ];

  readonly dragMimeTypes = [
    "application/vnd.extension-nest.demo-group",
    "application/vnd.extension-nest.demo-extension",
  ];

  private readonly changeEmitter = new vscode.EventEmitter<DemoTreeNode | undefined | null | void>();
  private state: DemoState;

  readonly onDidChangeTreeData = this.changeEmitter.event;

  constructor(
    initialState: DemoState,
    private readonly dispatch: (action: unknown) => Promise<void>,
  ) {
    this.state = initialState;
  }

  /** 更新树使用的状态快照并刷新所有可见节点。 */
  setState(state: DemoState): void {
    this.state = state;
    this.changeEmitter.fire(undefined);
  }

  /** 释放 TreeView 变化事件。 */
  dispose(): void {
    this.changeEmitter.dispose();
  }

  /** 返回节点的父节点，便于 VS Code 恢复展开状态。 */
  getParent(element: DemoTreeNode): DemoGroupNode | undefined {
    if (!isDemoExtensionNode(element)) {
      return undefined;
    }

    const group = this.state.groups.find((candidate) => candidate.id === element.groupId);
    if (group) {
      return this.createGroupNode(group);
    }

    return element.groupId === null ? this.createGroupNode(null) : undefined;
  }

  /** 返回顶层自定义组和固定的 Ungrouped 节点。 */
  getChildren(element?: DemoTreeNode): DemoTreeNode[] {
    if (!element) {
      return [
        ...this.state.groups.map((group) => this.createGroupNode(group)),
        this.createGroupNode(null),
      ];
    }

    if (!isDemoGroupNode(element)) {
      return [];
    }

    return this.state.extensions
      .filter((extension) => extension.groupId === element.groupId)
      .map((extension) => new DemoExtensionNode(extension, element.groupId));
  }

  /** 把组或扩展节点转换为带有状态提示的原生 TreeItem。 */
  getTreeItem(element: DemoTreeNode): vscode.TreeItem {
    if (isDemoGroupNode(element)) {
      const extensions = this.state.extensions.filter((extension) => extension.groupId === element.groupId);
      const treeItem = new vscode.TreeItem(
        element.label,
        vscode.TreeItemCollapsibleState.Expanded,
      );
      treeItem.id = `extension-nest-group:${element.groupId ?? "ungrouped"}`;
      treeItem.contextValue = element.groupId === null ? "extensionNest.ungrouped" : "extensionNest.group";
      treeItem.description = `${extensions.length}`;
      treeItem.tooltip = `${element.label} (${extensions.length} known extensions)`;
      treeItem.iconPath = new vscode.ThemeIcon(element.groupId === null ? "inbox" : "layers", groupIconColor(element.color));
      treeItem.command = {
        command: "extensionNest.openDashboard",
        title: "Open Extension Nest Dashboard",
        arguments: [element.groupId === null ? "ungrouped" : element.groupId],
      };
      return treeItem;
    }

    const extension = element.extension;
    const treeItem = new vscode.TreeItem(extension.name, vscode.TreeItemCollapsibleState.None);
    const status = extension.visibility === "Visible" ? "" : "Not found";
    treeItem.id = `extension-nest-extension:${extension.id}`;
    treeItem.contextValue = "extensionNest.extension";
    treeItem.description = `${extension.publisher} · v${extension.version}${status ? ` · ${status}` : ""}`;
    treeItem.tooltip = [
      `${extension.name} (${extension.id})`,
      extension.description,
      `Publisher: ${extension.publisher}`,
      `${extension.visibility === "Visible" ? "Version" : "Last seen version"}: ${extension.version}`,
      status ? `Status: ${status}` : undefined,
      status ? 'Not found in the latest discovery. This does not confirm disabling or removal.' : undefined,
      extension.lastSeenAt ? `Last seen: ${extension.lastSeenAt}` : undefined,
      `Tags: ${extension.tags.length > 0 ? extension.tags.join(", ") : "None"}`,
    ]
      .filter((line): line is string => Boolean(line))
      .join("\n");
    treeItem.iconPath = new vscode.ThemeIcon("extensions", groupIconColor(this.state.groups.find(group => group.id === element.groupId)?.color));
    treeItem.command = {
      command: "extensionNest.openDashboard",
      title: "Open Extension Nest Dashboard",
      arguments: [element.groupId === null ? "ungrouped" : element.groupId],
    };
    return treeItem;
  }

  /** 把被拖拽的组和扩展编码为受限的内部 MIME 数据。 */
  handleDrag(
    source: readonly DemoTreeNode[],
    dataTransfer: vscode.DataTransfer,
    _token: vscode.CancellationToken,
  ): void {
    const extensionIds = source
      .filter(isDemoExtensionNode)
      .map((node) => node.extension.id);
    if (extensionIds.length > 0) {
      dataTransfer.set(
        "application/vnd.extension-nest.demo-extension",
        new vscode.DataTransferItem(JSON.stringify({ ids: extensionIds })),
      );
    }

    const groupIds = source
      .filter(isDemoGroupNode)
      .map((node) => node.groupId)
      .filter((groupId): groupId is string => groupId !== null);
    if (groupIds.length > 0) {
      dataTransfer.set(
        "application/vnd.extension-nest.demo-group",
        new vscode.DataTransferItem(JSON.stringify({ ids: groupIds })),
      );
    }
  }

  /** 组标题与组内扩展均接收扩展移动；组排序仍以组标题为目标。 */
  async handleDrop(
    target: DemoTreeNode | undefined,
    dataTransfer: vscode.DataTransfer,
    _token: vscode.CancellationToken,
  ): Promise<void> {
    if (!target) {
      return;
    }

    const extensionPayload = await this.readPayload(dataTransfer, "application/vnd.extension-nest.demo-extension");
    if (extensionPayload) {
      // 使用最新归属，避免拖动期间目标条目移组后仍写入旧组。
      const groupId = isDemoGroupNode(target)
        ? target.groupId
        : this.state.extensions.find((extension) => extension.id === target.extension.id)?.groupId;
      if (groupId === undefined || (groupId !== null && !this.state.groups.some((group) => group.id === groupId))) {
        return;
      }
      const ids = extensionPayload.ids.filter((id) => this.state.extensions.some((extension) => extension.id === id));
      if (ids.length > 0) {
        await this.dispatch({ type: "move", ids, groupId });
      }
      return;
    }

    if (!isDemoGroupNode(target)) {
      return;
    }

    const groupPayload = await this.readPayload(dataTransfer, "application/vnd.extension-nest.demo-group");
    if (!groupPayload || target.groupId === null) {
      return;
    }

    const sourceId = groupPayload.ids.find(
      (id) => id !== target.groupId && this.state.groups.some((group) => group.id === id),
    );
    if (sourceId) {
      await this.dispatch({ type: "reorderGroup", id: sourceId, targetId: target.groupId });
    }
  }

  /** 从内部 MIME 数据读取可接受的 ID 数组。 */
  private async readPayload(dataTransfer: vscode.DataTransfer, mimeType: string): Promise<{ ids: string[] } | undefined> {
    const item = dataTransfer.get(mimeType);
    if (!item) {
      return undefined;
    }

    try {
      const value: unknown = JSON.parse(typeof item.value === "string" ? item.value : await item.asString());
      if (!isRecord(value) || !Array.isArray(value.ids)) {
        return undefined;
      }
      const ids = value.ids.filter((id): id is string => typeof id === "string" && id.length > 0);
      return ids.length === value.ids.length ? { ids: [...new Set(ids)] } : undefined;
    } catch {
      return undefined;
    }
  }

  /** 创建组节点并统一 Ungrouped 的显示属性。 */
  private createGroupNode(group: Group | null): DemoGroupNode {
    return group
      ? new DemoGroupNode(group.id, group.name, group.color)
      : new DemoGroupNode(null, "Ungrouped", undefined);
  }
}

/** 判断未知值是否为普通对象，用于拒绝外部拖放载荷。 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** 仅保留供调用方引用的 Action 类型，避免树直接绕过宿主校验。 */
export type DemoTreeAction = Action;
