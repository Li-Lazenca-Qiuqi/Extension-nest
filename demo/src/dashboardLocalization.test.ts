import { beforeEach, expect, it, vi } from 'vitest';
import type { DashboardHostCallbacks } from '../../src/dashboardPanel';

const mock=vi.hoisted(()=>({
 language:'zh-cn', failRead:false,
 webview:{html:'',cspSource:'https://webview.test',onDidReceiveMessage:vi.fn(),asWebviewUri:(uri:unknown)=>String(uri)},
 createWebviewPanel:vi.fn(),
}));
vi.mock('vscode',()=>({
 env:{get language(){return mock.language}},
 Uri:{joinPath:(base:unknown,...parts:string[])=>[String(base),...parts].join('/')},
 ViewColumn:{One:1},
 window:{createWebviewPanel:mock.createWebviewPanel},
 workspace:{fs:{readFile:async()=>{
  if(mock.failRead)throw new Error('missing build');
  return new TextEncoder().encode('<!doctype html><html lang="en"><head><title>Extension Nest</title></head><body><script type="module" src="/assets/main.js"></script></body></html>');
 }}},
}));
import { DashboardPanel } from '../../src/dashboardPanel';

beforeEach(()=>{
 mock.language='zh-cn';mock.failRead=false;mock.webview.html='';
 mock.createWebviewPanel.mockReturnValue({webview:mock.webview,onDidDispose:vi.fn(),onDidChangeViewState:vi.fn()});
});

it.each(['zh-cn','en','de'])('passes VS Code display language %s to the Webview without removing CSP',async language=>{
 mock.language=language;
 const dashboard=new DashboardPanel('extension-root' as never,{} as DashboardHostCallbacks);
 await dashboard.open();
 expect(mock.webview.html).toContain(`lang="${language}"`);
 expect(mock.webview.html.match(/<html\b/g)).toHaveLength(1);
 expect(mock.webview.html).toContain('Content-Security-Policy');
 expect(mock.webview.html).toMatch(/<script nonce="[^"]+"/);
 expect(mock.webview.html).toContain('extension-root/demo/dist/assets/main.js');
});

it('localizes the missing-build fallback before React can load',async()=>{
 mock.failRead=true;
 await new DashboardPanel('extension-root' as never,{} as DashboardHostCallbacks).open();
 expect(mock.webview.html).toContain('lang="zh-cn"');
 expect(mock.webview.html).toMatch(/[\u3400-\u9fff]/);
 expect(mock.webview.html).toContain('Content-Security-Policy');
});

it('escapes a language value before placing it in an HTML attribute',async()=>{
 mock.language='en" data-injected="yes';
 await new DashboardPanel('extension-root' as never,{} as DashboardHostCallbacks).open();
 expect(mock.webview.html).not.toContain('lang="en" data-injected=');
 expect(mock.webview.html).toContain('&quot;');
});
