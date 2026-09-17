import { useEffect, useState } from 'react';
import { loadState, reducer, saveState, validateState } from './state';
import type { Action, DemoState } from './models';
type HostApi={postMessage:(message:unknown)=>void};
declare global { interface Window { acquireVsCodeApi?:()=>HostApi } }
const host=window.acquireVsCodeApi?.();
/** 消费宿主快照；仅在组件预览环境使用本地存储，正式运行以宿主为准。 */
export function useDemoStore(){
 const [state,setState]=useState<DemoState>(()=>host?{schemaVersion:1,groups:[],extensions:[],freshness:'Loading'}:loadState());
 const [ready,setReady]=useState(!host);const [saved,setSaved]=useState(true);
 const [icons,setIcons]=useState<Record<string,string>>({});
 const [hostError,setHostError]=useState('');const [nativeFilter,setNativeFilter]=useState<{group:string;nonce:number}>({group:'all',nonce:0});
 useEffect(()=>{if(!host)return;const listener=(event:MessageEvent)=>{
  const message=event.data;if(!message||typeof message!=='object')return;
  if(message.type==='state'&&validateState(message.state)){setState(message.state);setReady(true);setSaved(true);setHostError('')}
  else if(message.type==='filter'&&typeof message.groupId==='string')setNativeFilter(previous=>({group:message.groupId,nonce:previous.nonce+1}));
  else if(message.type==='error'){setHostError(String(message.message));setSaved(false)}
  else if(message.type==='icons'&&message.icons&&typeof message.icons==='object')setIcons(message.icons);
 };window.addEventListener('message',listener);host.postMessage({type:'ready'});return()=>window.removeEventListener('message',listener)},[]);
 useEffect(()=>{if(!host)setSaved(saveState(state))},[state]);
 function dispatch(action:Action){if(state.readOnly){setHostError('Read-only: organization data cannot be changed. Discovery changes are available only in this session and are not saved.');return}if(host)host.postMessage({type:'action',action});else setState(current=>reducer(current,action))}
 function openExtension(id:string){
  if(host)host.postMessage({type:'openExtension',id});
  else setHostError('Open this dashboard in VS Code to view the extension page.');
 }
 function cleanupUnverified(){
  if(!host||!ready||state.readOnly||state.freshness!=='Ready'||!state.extensions.some(extension=>extension.visibility==='Unverified'))return;
  host.postMessage({type:'cleanupUnverified'});
 }
 function refresh(){if(host)host.postMessage({type:'refresh'})}
 function openExtensions(){if(host)host.postMessage({type:'openExtensions'})}
 return {cleanupUnverified,refresh,openExtensions,state,ready,saved,hostError,nativeFilter,dispatch,openExtension,icons,isNative:Boolean(host)};
}
