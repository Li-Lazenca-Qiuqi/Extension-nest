import { describe,it,expect } from 'vitest';
import * as vscode from '../test/vscodeMock';
import { DemoTreeProvider,DemoExtensionNode,DemoGroupNode } from '../../src/demoTree';
import { seedState } from './seed';
import { reducer } from './state';
/** 验证拖放控制器到唯一归属服务的完整处理路径，替身仅替代 VS Code API 容器。 */
describe('native tree drag controller',()=>{
 it('moves a dragged extension to exactly one group',async()=>{
  let state=structuredClone(seedState);
  const tree=new DemoTreeProvider(state,async action=>{state=reducer(state,action as Parameters<typeof reducer>[1])});
  const ext=state.extensions.find(e=>e.name==='Jupyter')!;
  const transfer=new vscode.DataTransfer();
  tree.handleDrag([new DemoExtensionNode(ext,ext.groupId)],transfer as never,{} as never);
  await tree.handleDrop(new DemoGroupNode('writing','Writing',undefined),transfer as never,{} as never);
  expect(state.extensions.find(e=>e.id===ext.id)?.groupId).toBe('writing');
  expect(state.extensions.filter(e=>e.groupId==='python-data')).toHaveLength(3);
  expect(state.extensions.filter(e=>e.groupId==='writing')).toHaveLength(3);
 });
 it('drops into Ungrouped and rejects external payloads',async()=>{
  let state=structuredClone(seedState);const tree=new DemoTreeProvider(state,async action=>{state=reducer(state,action as Parameters<typeof reducer>[1])});
  const original=state;await tree.handleDrop(new DemoGroupNode('writing','Writing',undefined),new vscode.DataTransfer() as never,{} as never);expect(state).toBe(original);
  const ext=state.extensions[0];const transfer=new vscode.DataTransfer();tree.handleDrag([new DemoExtensionNode(ext,ext.groupId)],transfer as never,{} as never);
  await tree.handleDrop(new DemoGroupNode(null,'Ungrouped',undefined),transfer as never,{} as never);
  expect(state.extensions.find(e=>e.id===ext.id)?.groupId).toBeNull();
 });
 it('reorders native group nodes without changing membership',async()=>{
  let state=structuredClone(seedState);const tree=new DemoTreeProvider(state,async action=>{state=reducer(state,action as Parameters<typeof reducer>[1])});
  const transfer=new vscode.DataTransfer();tree.handleDrag([new DemoGroupNode('writing','Writing',undefined)],transfer as never,{} as never);
  await tree.handleDrop(new DemoGroupNode('ai-coding','AI Coding',undefined),transfer as never,{} as never);
  expect(state.groups[0].id).toBe('writing');expect(state.extensions).toEqual(seedState.extensions);
 });
});
