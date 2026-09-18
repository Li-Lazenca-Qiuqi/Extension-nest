// @vitest-environment jsdom
import { expect,it } from 'vitest';
import { findCardInsertion } from './useCardDrag';
import { seedState } from './seed';
import { migrateState,reducer } from './state';
import { groupExtensions } from './groupExtensions';
import { DemoTreeProvider,DemoExtensionNode,DemoGroupNode } from '../../src/demoTree';

it('moves groups in both directions and ignores the first/last boundaries',()=>{
 const first=seedState.groups[0].id,last=seedState.groups.at(-1)!.id;
 expect(reducer(seedState,{type:'shiftGroup',id:first,direction:-1})).toBe(seedState);
 expect(reducer(seedState,{type:'shiftGroup',id:last,direction:1})).toBe(seedState);
 const moved=reducer(seedState,{type:'shiftGroup',id:first,direction:1});
 expect(moved.groups[1].id).toBe(first);
 expect(reducer(moved,{type:'shiftGroup',id:first,direction:-1})).toEqual(seedState);
});
it.each(['name','publisher'] as const)('sorts %s within one group and preserves saved order in both views',field=>{
 const sorted=reducer(seedState,{type:'sortExtensions',groupId:'python-data',field,direction:-1});
 const expected=seedState.extensions.filter(e=>e.groupId==='python-data').sort((a,b)=>b[field].localeCompare(a[field])||b.id.localeCompare(a.id));
 const restored=migrateState(JSON.parse(JSON.stringify(sorted)))!;
 expect(restored.extensions.filter(e=>e.groupId==='python-data')).toEqual(expected);
 expect(restored.extensions.filter(e=>e.groupId!=='python-data')).toEqual(seedState.extensions.filter(e=>e.groupId!=='python-data'));
 const tree=new DemoTreeProvider(restored,async()=>{});
 const treeIds=tree.getChildren(new DemoGroupNode('python-data','Python & Data',undefined)).map(n=>(n as DemoExtensionNode).extension.id);
 expect(treeIds).toEqual(groupExtensions(restored.groups,restored.extensions).find(g=>g.id==='python-data')!.extensions.map(e=>e.id));
});
it('moves extensions only between their peers and preserves tags and membership',()=>{
 const peers=seedState.extensions.filter(e=>e.groupId==='python-data');
 expect(reducer(seedState,{type:'shiftExtension',id:peers[0].id,direction:-1})).toBe(seedState);
 expect(reducer(seedState,{type:'shiftExtension',id:peers.at(-1)!.id,direction:1})).toBe(seedState);
 const moved=reducer(seedState,{type:'shiftExtension',id:peers[0].id,direction:1});
 expect(moved.extensions.filter(e=>e.groupId==='python-data')[1]).toEqual(peers[0]);
 expect(reducer(moved,{type:'shiftExtension',id:peers[0].id,direction:-1})).toEqual(seedState);
});

it('inserts a dragged selection before a peer, preserves its order and tags, and appends at the end',()=>{
 const ids=seedState.extensions.slice(0,2).map(e=>e.id);
 const target=seedState.extensions.find(e=>!ids.includes(e.id))!;
 const moved=reducer(seedState,{type:'move',ids:[...ids].reverse(),groupId:target.groupId,beforeId:target.id});
 const peers=moved.extensions.filter(e=>e.groupId===target.groupId);
 const index=peers.findIndex(e=>e.id===target.id);
 expect(peers.slice(index-2,index).map(e=>e.id)).toEqual(ids);
 expect(moved.extensions.find(e=>e.id===ids[0])!.tags).toEqual(seedState.extensions[0].tags);
 const appended=reducer(moved,{type:'move',ids,groupId:target.groupId,beforeId:null});
 expect(appended.extensions.filter(e=>e.groupId===target.groupId).slice(-2).map(e=>e.id)).toEqual(ids);
 expect(migrateState(JSON.parse(JSON.stringify(appended)))).toEqual(appended);
 expect(reducer(moved,{type:'move',ids,groupId:target.groupId,beforeId:ids[0]})).toBe(moved);
});
it('drops a group after the last group',()=>{
 const first=seedState.groups[0].id,last=seedState.groups.at(-1)!.id;
 expect(reducer(seedState,{type:'reorderGroup',id:first,targetId:last,after:true}).groups.at(-1)?.id).toBe(first);
});

it('locates insertion across grid rows, skips dragged cards and appends below the final row',()=>{
 const section=document.createElement('div');
 for(let i=0;i<4;i++){
  const card=document.createElement('article');card.dataset.extension=String(i);
  const left=(i%2)*110,top=Math.floor(i/2)*70+40;
  card.getBoundingClientRect=()=>({left,top,right:left+100,bottom:top+60,width:100,height:60} as DOMRect);
  section.append(card);
 }
 expect(findCardInsertion(section,[],400,10)).toBe('0');
 expect(findCardInsertion(section,[],80,50)).toBe('1');
 expect(findCardInsertion(section,['1'],80,50)).toBe('2');
 expect(findCardInsertion(section,[],10,120)).toBe('2');
 expect(findCardInsertion(section,[],400,200)).toBeNull();
});
it('sorts custom groups without changing extension assignments or order',()=>{
 const state={...seedState,groups:[{id:'z',name:'Zulu',color:'#123456'},{id:'b',name:'Alpha',color:'#123456'},{id:'a',name:'Alpha',color:'#123456'}]};
 const ascending=reducer(state,{type:'sortGroups',direction:1});
 expect(ascending.groups.map(g=>g.id)).toEqual(['a','b','z']);
 expect(reducer(state,{type:'sortGroups',direction:-1}).groups.map(g=>g.id)).toEqual(['z','b','a']);
 expect(ascending.extensions).toBe(state.extensions);
 expect(groupExtensions(ascending.groups,ascending.extensions).at(-1)?.id).toBe('ungrouped');
});
