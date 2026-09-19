// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeAll, expect, it, vi } from 'vitest';
import type { useExtensionStore as StoreHook } from './useExtensionStore';
import type { DashboardState } from './models';
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const postMessage=vi.fn();
let useExtensionStore:typeof StoreHook;
let store:ReturnType<typeof StoreHook>;
let cleanup=()=>{};
beforeAll(async()=>{
 window.acquireVsCodeApi=()=>({postMessage});
 ({useExtensionStore}=await import('./useExtensionStore'));
});
afterEach(()=>{cleanup();postMessage.mockClear();document.body.innerHTML=''});
function setup(){
 const node=document.createElement('div');document.body.append(node);const root=createRoot(node);
 function Probe(){store=useExtensionStore();return null}
 act(()=>root.render(createElement(Probe)));cleanup=()=>act(()=>root.unmount());
}
function snapshot(overrides:Partial<DashboardState>={}){
 act(()=>window.dispatchEvent(new MessageEvent('message',{data:{type:'state',state:{schemaVersion:1,groups:[],extensions:[],freshness:'Ready',...overrides}}})));
}
it('starts the native host with no seed records and requests a snapshot',()=>{
 setup();expect(store.state.extensions).toEqual([]);expect(store.state.groups).toEqual([]);
 expect(store.state.freshness).toBe('Loading');expect(store.ready).toBe(false);
 expect(postMessage).toHaveBeenCalledWith({type:'ready'});
 snapshot();expect(store.ready).toBe(true);
});
it('blocks organization writes in a read-only snapshot but keeps navigation and refresh',()=>{
 setup();snapshot({readOnly:true});postMessage.mockClear();
 act(()=>store.dispatch({type:'createGroup',name:'Research'}));
 expect(postMessage).not.toHaveBeenCalled();expect(store.hostError).toContain('Read-only');
 act(()=>{store.refresh();store.openExtensions();store.openExtension('publisher.example')});
 expect(postMessage.mock.calls.map(([message])=>message)).toEqual([{type:'refresh'},{type:'openExtensions'},{type:'openExtension',id:'publisher.example'}]);
});
it('sends edits to the host without manufacturing a local successful result',()=>{
 setup();snapshot();postMessage.mockClear();
 act(()=>store.dispatch({type:'createGroup',name:'Research'}));
 expect(postMessage).toHaveBeenCalledWith({type:'action',action:{type:'createGroup',name:'Research'}});
 expect(store.state.groups).toEqual([]);
});

const unverified={id:'test.legacy',name:'Legacy',publisher:'Test',description:'',version:'1.0.0',groupId:null,visibility:'Unverified' as const,monogram:'L',color:'#336699',tags:[]};
it('delegates cleanup without deleting the local snapshot optimistically',()=>{
 setup();snapshot({extensions:[unverified]});postMessage.mockClear();
 act(()=>store.cleanupUnverified());
 expect(postMessage).toHaveBeenCalledExactlyOnceWith({type:'cleanupUnverified'});
 expect(store.state.extensions).toEqual([unverified]);
});
it.each([{readOnly:true},{freshness:'Loading' as const},{freshness:'Stale' as const},{freshness:'Error' as const},{extensions:[]}])('does not request cleanup when unavailable: %j',overrides=>{
 setup();snapshot({extensions:[unverified],...overrides});postMessage.mockClear();
 act(()=>store.cleanupUnverified());expect(postMessage).not.toHaveBeenCalled();
});
