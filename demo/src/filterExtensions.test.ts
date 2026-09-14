import { describe,it,expect } from 'vitest';
import { seedState } from './seed';
import { filterExtensions, availableTags } from './filterExtensions';
/** 筛选只读取标签和归属，不得改变分组数据。 */
describe('independent tag filtering',()=>{
 const extensions=seedState.extensions.slice(0,3).map((e,index)=>({...e,groupId:index===2?'writing':'python-data',enabled:index!==1,tags:index===0?['Research','Data']:index===1?['research']:['Data']}));
 it('searches tags without changing groups',()=>{
  const before=structuredClone(extensions);
  const result=filterExtensions(extensions,{group:'all',status:'all',query:'RESEARCH',tags:[]});
  expect(result).toHaveLength(2);expect(extensions).toEqual(before);
 });
 it('combines tags with AND and group/status/search with intersection',()=>{
  expect(filterExtensions(extensions,{group:'python-data',status:'enabled',query:'',tags:['research','DATA']})).toEqual([extensions[0]]);
  expect(filterExtensions(extensions,{group:'writing',status:'all',query:'',tags:['research']})).toEqual([]);
 });
 it('deduplicates choices case-insensitively and clears tag constraints',()=>{
  expect(availableTags(extensions)).toEqual(['Data','Research']);
  expect(filterExtensions(extensions,{group:'all',status:'all',query:'',tags:[]})).toHaveLength(3);
 });
});
