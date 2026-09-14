import { useEffect, useState } from 'react';
import { loadState, reducer, saveState, validateState } from './state';
import { seedState } from './seed';
import type { Action, DemoState } from './models';
type HostApi={postMessage:(message:unknown)=>void};
declare global { interface Window { acquireVsCodeApi?:()=>HostApi } }
const host=window.acquireVsCodeApi?.();
/** 消费宿主快照；仅在组件预览环境使用本地存储，正式运行以宿主为准。 */
export function useDemoStore(){
 const [state,setState]=useState<DemoState>(()=>host?structuredClone(seedState):loadState());
 const [ready,setReady]=useState(!host);const [saved,setSaved]=useState(true);
 const [hostError,setHostError]=useState('');const [nativeFilter,setNativeFilter]=useState<{group:string;nonce:number}>({group:'all',nonce:0});
 useEffect(()=>{if(!host)return;const listener=(event:MessageEvent)=>{
  const message=event.data;if(!message||typeof message!=='object')return;
  if(message.type==='state'&&validateState(message.state)){setState(message.state);setReady(true);setSaved(true);setHostError('')}
  else if(message.type==='filter'&&typeof message.groupId==='string')setNativeFilter(previous=>({group:message.groupId,nonce:previous.nonce+1}));
  else if(message.type==='error'){setHostError(String(message.message));setSaved(false)}
 };window.addEventListener('message',listener);host.postMessage({type:'ready'});return()=>window.removeEventListener('message',listener)},[]);
 useEffect(()=>{if(!host)setSaved(saveState(state))},[state]);
 function dispatch(action:Action){if(host)host.postMessage({type:'action',action});else setState(current=>reducer(current,action))}
 return {state,ready,saved,hostError,nativeFilter,dispatch};
}
