import * as vscode from "vscode";
import { randomBytes } from "node:crypto";
import type { DemoState } from "../demo/src/models";

/** Dashboard 可以请求宿主执行的回调集合。 */
export interface DashboardHostCallbacks {
  getState(): DemoState;
  onAction(action: unknown): Promise<void>;
  onImport(state: unknown): Promise<void>;
  onImportFile(): Promise<void>;
  onExport(): Promise<void>;
  onShowGroups(): Promise<void>;
}

/** Dashboard 的筛选值；all 表示完整演示清单。 */
export type DashboardFilter = "all" | "ungrouped" | string;

/** 负责在编辑器区域承载生产构建的 React Dashboard。 */
export class DashboardPanel {
  private panel: vscode.WebviewPanel | undefined;
  private filter: DashboardFilter = "all";
  private ready = false;
  private pendingError: string | undefined;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly callbacks: DashboardHostCallbacks,
  ) {}

  /** 打开或聚焦唯一的 Dashboard 实例，并应用原生树传入的筛选。 */
  async open(filter: DashboardFilter = "all"): Promise<void> {
    this.filter = filter;
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.One);
      await this.postFilter();
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "extensionNest.dashboard",
      "Extension Nest Dashboard",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, "demo", "dist")],
      },
    );
    this.panel = panel;
    this.ready = false;

    panel.onDidDispose(
      () => {
        if (this.panel === panel) {
          this.panel = undefined;
          this.ready = false;
        }
      },
      undefined,
    );
    panel.webview.onDidReceiveMessage(
      (message: unknown) => this.handleMessage(message),
      undefined,
    );
    panel.webview.html = await this.renderHtml(panel.webview);
  }

  /** 向已打开的 Dashboard 发送最新状态。 */
  async postState(state: DemoState): Promise<void> {
    if (!this.panel || !this.ready) {
      return;
    }
    await this.panel.webview.postMessage({ type: "state", state });
  }

  /** 向 Dashboard 报告宿主错误，面板尚未 ready 时延迟到首次握手后发送。 */
  async postError(message: string): Promise<void> {
    if (!this.panel || !this.ready) {
      this.pendingError = message;
      return;
    }
    await this.panel.webview.postMessage({ type: "error", message });
  }

  /** 释放面板和消息监听器。 */
  dispose(): void {
    this.panel?.dispose();
    this.panel = undefined;
    this.ready = false;
  }

  /** 处理 Webview 到宿主的有限消息协议。 */
  private async handleMessage(message: unknown): Promise<void> {
    if (!isRecord(message) || typeof message.type !== "string") {
      return;
    }

    switch (message.type) {
      case "ready":
        this.ready = true;
        await this.postState(this.callbacks.getState());
        await this.postFilter();
        if (this.pendingError) {
          const error = this.pendingError;
          this.pendingError = undefined;
          await this.panel?.webview.postMessage({ type: "error", message: error });
        }
        return;
      case "action":
        await this.callbacks.onAction(message.action);
        return;
      case "import":
        await this.callbacks.onImport(message.state);
        return;
      case "importFile":
        await this.callbacks.onImportFile();
        return;
      case "export":
        await this.callbacks.onExport();
        return;
      case "showGroups":
        await this.callbacks.onShowGroups();
        return;
      default:
        return;
    }
  }

  /** 向 Webview 发送当前筛选，统一把 null 语义编码为 ungrouped。 */
  private async postFilter(): Promise<void> {
    if (!this.panel || !this.ready) {
      return;
    }
    await this.panel.webview.postMessage({ type: "filter", groupId: this.filter });
  }

  /** 读取并改写 Vite 产物，使其只加载扩展允许的本地 Webview 资源。 */
  private async renderHtml(webview: vscode.Webview): Promise<string> {
    const distUri = vscode.Uri.joinPath(this.extensionUri, "demo", "dist");
    const indexUri = vscode.Uri.joinPath(distUri, "index.html");

    try {
      const bytes = await vscode.workspace.fs.readFile(indexUri);
      const source = new TextDecoder("utf-8").decode(bytes);
      const nonce = createNonce();
      let html = source.replace(/\b(src|href)=(['"])([^'"]+)\2/gi, (_match, attribute, quote, rawPath) => {
        const transformed = this.toWebviewResource(webview, distUri, rawPath);
        return `${attribute}=${quote}${transformed}${quote}`;
      });
      html = html.replace(/<script\b(?![^>]*\bnonce=)/gi, `<script nonce="${nonce}"`);
      const csp = [
        "default-src 'none'",
        `img-src ${webview.cspSource} data:`,
        `style-src ${webview.cspSource} 'unsafe-inline'`,
        `script-src 'nonce-${nonce}'`,
        "connect-src 'none'",
        "font-src data:",
      ].join("; ");
      const cspMeta = `<meta http-equiv="Content-Security-Policy" content="${csp}">`;
      html = html.replace(/<head>/i, `<head>\n${cspMeta}`);
      return html;
    } catch {
      return this.renderMissingBuildHtml(webview);
    }
  }

  /** 把构建产物中的相对资源地址转换为 asWebviewUri。 */
  private toWebviewResource(webview: vscode.Webview, distUri: vscode.Uri, rawPath: string): string {
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#|data:)/i.test(rawPath)) {
      return rawPath;
    }

    const [pathPart, suffix = ""] = rawPath.split(/([?#].*)/, 2);
    const relativePath = pathPart.replace(/^\/+/, "");
    const segments = relativePath.split("/").filter((segment) => segment.length > 0);
    if (segments.includes("..")) {
      return rawPath;
    }

    const resourceUri = vscode.Uri.joinPath(distUri, ...segments);
    return `${webview.asWebviewUri(resourceUri).toString()}${suffix}`;
  }

  /** 在尚未执行前端构建时给出可读的编辑器面板提示。 */
  private renderMissingBuildHtml(webview: vscode.Webview): string {
    const nonce = createNonce();
    const csp = [
      "default-src 'none'",
      `style-src ${webview.cspSource} 'unsafe-inline'`,
      `script-src 'nonce-${nonce}'`,
    ].join("; ");
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="${csp}">
    <title>Extension Nest Dashboard</title>
  </head>
  <body>
    <h1>Extension Nest Dashboard</h1>
    <p>Run the extension build to create the dashboard bundle.</p>
  </body>
</html>`;
  }
}

/** 生成只用于 CSP script-src 的随机 nonce。 */
function createNonce(): string {
  return randomBytes(16).toString("base64");
}

/** 判断消息是否为普通对象，避免执行 Webview 传入的原型对象。 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
