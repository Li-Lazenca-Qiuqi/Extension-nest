// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it } from 'vitest';
import { useExtensionStore } from './useExtensionStore';
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
it('未连接宿主时不读取旧演示数据、不生成插件且禁止编辑',()=>{
 localStorage.setItem('extension-nest-demo-v1',JSON.stringify({schemaVersion:1,groups:[{id:'old'}],extensions:[{id:'old.example'}]}));
 const before=localStorage.getItem('extension-nest-demo-v1');
 let store:ReturnType<typeof useExtensionStore>;
 function Probe(){store=useExtensionStore();return null}
 const node=document.createElement('div');document.body.append(node);const root=createRoot(node);
 try {
  act(()=>root.render(createElement(Probe)));
  expect(store!.state.groups).toEqual([]);expect(store!.state.extensions).toEqual([]);
  expect(store!.state.readOnly).toBe(true);expect(store!.state.freshness).toBe('Error');
  act(()=>store!.dispatch({type:'createGroup',name:'Blocked'}));
  expect(store!.state.groups).toEqual([]);expect(localStorage.getItem('extension-nest-demo-v1')).toBe(before);
 } finally {act(()=>root.unmount());node.remove();localStorage.clear()}
});
