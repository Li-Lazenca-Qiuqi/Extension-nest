import { describe,it,expect } from 'vitest';
import { seedState } from '../test/extensionFixture';
import { groupExtensions } from './groupExtensions';
import { reducer } from './state';
describe('default grouped dashboard',()=>{
 it('shows every group in saved order with Ungrouped last and each extension once',()=>{
  const sections=groupExtensions(seedState.groups,seedState.extensions);
  expect(sections.map(s=>s.name)).toEqual([...seedState.groups.map(g=>g.name),'Ungrouped']);
  expect(sections.map(s=>s.extensions.length)).toEqual([3,4,3,2,2]);
  const ids=sections.flatMap(s=>s.extensions.map(e=>e.id));expect(ids).toHaveLength(14);expect(new Set(ids).size).toBe(14);
 });
 it('keeps new empty groups visible by default and omits empty search results',()=>{
  const groups=[...seedState.groups,{id:'empty',name:'Research',color:'#fff'}];
  expect(groupExtensions(groups,seedState.extensions).find(s=>s.id==='empty')?.extensions).toEqual([]);
  expect(groupExtensions(groups,[seedState.extensions[0]],'all',true)).toHaveLength(1);
 });
 it('moves a card to its new section without changing tags',()=>{
  const next=reducer(seedState,{type:'move',ids:['ms-python.python'],groupId:'writing'});
  const sections=groupExtensions(next.groups,next.extensions);
  expect(sections.find(s=>s.id==='python-data')?.extensions.some(e=>e.id==='ms-python.python')).toBe(false);
  expect(sections.find(s=>s.id==='writing')?.extensions.find(e=>e.id==='ms-python.python')?.tags).toEqual(seedState.extensions.find(e=>e.id==='ms-python.python')?.tags);
 });
});
it('keeps empty sections only for All, an explicit group, or a matching group name',()=>{
 const groups=[{id:'empty',name:'Research Lab',color:'#123456'},{id:'other',name:'Other',color:'#123456'}];
 expect(groupExtensions(groups,[],'all',false).map(g=>g.id)).toEqual(['empty','other','ungrouped']);
 expect(groupExtensions(groups,[],'all',true)).toEqual([]);
 expect(groupExtensions(groups,[],'empty',true).map(g=>g.id)).toEqual(['empty']);
 expect(groupExtensions(groups,[],'all',true,' research ').map(g=>g.id)).toEqual(['empty']);
 expect(groupExtensions(groups,[],'all',true,'unmatched')).toEqual([]);
 expect(groupExtensions(groups,[],'other',true,'research').map(g=>g.id)).toEqual(['other']);
 expect(groupExtensions(groups,[],'ungrouped',true).map(g=>g.id)).toEqual(['ungrouped']);
});
