import * as vscode from 'vscode';
import { Buffer } from 'node:buffer';
import { marketplaceIconUrl } from '../demo/src/extensionIconUrl';

const cache=new Map<string,Promise<string|undefined>>();
const mimeTypes:Record<string,string>={png:'image/png',svg:'image/svg+xml',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',webp:'image/webp'};
const limit=2*1024*1024;

/** 缓存当前宿主会话中的图标，以 data URI 传给 Webview，不扩大其文件或网络访问范围。 */
export function loadExtensionIcon(id:string):Promise<string|undefined>{
 if(!cache.has(id))cache.set(id,readIcon(id));
 return cache.get(id)!;
}

async function readIcon(id:string):Promise<string|undefined>{
 const url=marketplaceIconUrl(id);if(!url)return;
 const installed=vscode.extensions.getExtension(id);
 const icon:unknown=installed?.packageJSON.icon;
 if(installed&&typeof icon==='string'&&!icon.includes('\\')&&!icon.startsWith('/')&&!icon.split('/').includes('..')&&!icon.includes(':')){
  const mime=mimeTypes[icon.split('.').pop()?.toLowerCase()??''];
  if(mime)try{
   const uri=vscode.Uri.joinPath(installed.extensionUri,icon);
   if((await vscode.workspace.fs.stat(uri)).size<=limit){
    const bytes=await vscode.workspace.fs.readFile(uri);
    return `data:${mime};base64,${Buffer.from(bytes).toString('base64')}`;
   }
  }catch{/* 本机图标缺失时继续查询市场资源。 */}
 }
 try{
  const response=await fetch(url,{signal:AbortSignal.timeout(8000)});
  const mime=response.headers.get('content-type')?.split(';')[0];
  if(!response.ok||!mime||!Object.values(mimeTypes).includes(mime)||Number(response.headers.get('content-length'))>limit)return;
  const bytes=Buffer.from(await response.arrayBuffer());if(bytes.length>limit)return;
  return `data:${mime};base64,${bytes.toString('base64')}`;
 }catch{return undefined}
}
