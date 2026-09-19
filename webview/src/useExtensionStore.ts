import { useEffect, useState } from 'react';
import { validateState } from './state';
import type { Action, DashboardState } from './models';
import { t } from './uiI18n';
type HostApi={postMessage:(message:unknown)=>void};
declare global { interface Window { acquireVsCodeApi?:()=>HostApi } }
const host=window.acquireVsCodeApi?.();
/** 消费宿主快照；未连接宿主时保持只读空状态，不生成示例数据。 */
export function useExtensionStore(){
 const [state,setState]=useState<DashboardState>(()=>({schemaVersion:1,groups:[],extensions:[],freshness:host?'Loading':'Error',readOnly:!host,error:host?undefined:t('errors.openInVsCode')}));
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
 function dispatch(action:Action){if(state.readOnly){setHostError(t('errors.readOnly'));return}if(host)host.postMessage({type:'action',action});else setHostError(t('errors.openInVsCode'))}
 function openExtension(id:string){
  if(host)host.postMessage({type:'openExtension',id});
  else setHostError(t('errors.openInVsCode'));
 }
 function cleanupUnverified(){
  if(!host||!ready||state.readOnly||state.freshness!=='Ready'||!state.extensions.some(extension=>extension.visibility==='Unverified'))return;
  host.postMessage({type:'cleanupUnverified'});
 }
 function refresh(){if(host)host.postMessage({type:'refresh'})}
 function repairData(){if(host&&state.canRepair)host.postMessage({type:'repairData'})}
 function openExtensions(){if(host)host.postMessage({type:'openExtensions'})}
 return {repairData,cleanupUnverified,refresh,openExtensions,state,ready,saved,hostError,nativeFilter,dispatch,openExtension,icons,isNative:Boolean(host)};
}
