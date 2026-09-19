import { describe,it,expect } from 'vitest';
import * as vscode from '../test/vscodeMock';
import { ExtensionTreeProvider,ExtensionNode,ExtensionGroupNode } from '../../src/extensionTree';
import { seedState } from '../test/extensionFixture';
import { reducer } from './state';
/** 验证拖放控制器到唯一归属服务的完整处理路径，替身仅替代 VS Code API 容器。 */
describe('native tree drag controller',()=>{
 it('moves a dragged extension to exactly one group',async()=>{
  let state=structuredClone(seedState);
  const tree=new ExtensionTreeProvider(state,async action=>{state=reducer(state,action as Parameters<typeof reducer>[1])});
  const ext=state.extensions.find(e=>e.name==='Jupyter')!;
  const transfer=new vscode.DataTransfer();
  tree.handleDrag([new ExtensionNode(ext,ext.groupId)],transfer as never,{} as never);
  await tree.handleDrop(new ExtensionGroupNode('writing','Writing',undefined),transfer as never,{} as never);
  expect(state.extensions.find(e=>e.id===ext.id)?.groupId).toBe('writing');
  expect(state.extensions.filter(e=>e.groupId==='python-data')).toHaveLength(3);
  expect(state.extensions.filter(e=>e.groupId==='writing')).toHaveLength(3);
 });
 it('drops into Ungrouped and rejects external payloads',async()=>{
  let state=structuredClone(seedState);const tree=new ExtensionTreeProvider(state,async action=>{state=reducer(state,action as Parameters<typeof reducer>[1])});
  const original=state;await tree.handleDrop(new ExtensionGroupNode('writing','Writing',undefined),new vscode.DataTransfer() as never,{} as never);expect(state).toBe(original);
  const ext=state.extensions[0];const transfer=new vscode.DataTransfer();tree.handleDrag([new ExtensionNode(ext,ext.groupId)],transfer as never,{} as never);
  await tree.handleDrop(new ExtensionGroupNode(null,'Ungrouped',undefined),transfer as never,{} as never);
  expect(state.extensions.find(e=>e.id===ext.id)?.groupId).toBeNull();
 });
 it('reorders native group nodes without changing membership',async()=>{
  let state=structuredClone(seedState);const tree=new ExtensionTreeProvider(state,async action=>{state=reducer(state,action as Parameters<typeof reducer>[1])});
  const transfer=new vscode.DataTransfer();tree.handleDrag([new ExtensionGroupNode('writing','Writing',undefined)],transfer as never,{} as never);
  await tree.handleDrop(new ExtensionGroupNode('ai-coding','AI Coding',undefined),transfer as never,{} as never);
  expect(state.groups[0].id).toBe('writing');expect(state.extensions).toEqual(seedState.extensions);
 });
});

it.each(['writing', null])('moves multiple extensions onto a member of %s exactly as onto its heading', async groupId => {
 const initial = structuredClone(seedState);
 const sources = initial.extensions.filter(extension => extension.groupId === 'python-data').slice(0, 2);
 sources[0].tags = ['Research'];
 const member = initial.extensions.find(extension => extension.groupId === groupId)!;
 const run = async (ontoMember: boolean) => {
  let state = structuredClone(initial);
  const tree = new ExtensionTreeProvider(state, async action => { state = reducer(state, action as Parameters<typeof reducer>[1]); tree.setState(state); });
  const transfer = new vscode.DataTransfer();
  tree.handleDrag(sources.map(extension => new ExtensionNode(extension, extension.groupId)), transfer as never, {} as never);
  const target = ontoMember ? new ExtensionNode(member, member.groupId) : new ExtensionGroupNode(groupId, 'Target', undefined);
  await tree.handleDrop(target, transfer as never, {} as never);
  const moved = structuredClone(state);
  await tree.handleDrop(target, transfer as never, {} as never);
  expect(state).toEqual(moved);
  expect(state.extensions.filter(extension => sources.some(source => source.id === extension.id)).map(extension => extension.groupId)).toEqual([groupId, groupId]);
  expect(state.extensions.find(extension => extension.id === sources[0].id)?.tags).toEqual(['Research']);
  return state;
 };
 expect(await run(true)).toEqual(await run(false));
});

it('uses current target membership and ignores removed targets and root space', async () => {
 let state = structuredClone(seedState);
 const member = state.extensions.find(extension => extension.groupId === 'writing')!;
 const target = new ExtensionNode(member, member.groupId);
 const source = state.extensions.find(extension => extension.groupId === 'python-data')!;
 const tree = new ExtensionTreeProvider(state, async action => { state = reducer(state, action as Parameters<typeof reducer>[1]); tree.setState(state); });
 const transfer = new vscode.DataTransfer();
 tree.handleDrag([new ExtensionNode(source, source.groupId)], transfer as never, {} as never);
 state = reducer(state, { type: 'move', ids: [member.id], groupId: 'ai-coding' });
 tree.setState(state);
 await tree.handleDrop(target, transfer as never, {} as never);
 expect(state.extensions.find(extension => extension.id === source.id)?.groupId).toBe('ai-coding');
 state = { ...state, extensions: state.extensions.filter(extension => extension.id !== member.id) };
 tree.setState(state);
 const before = state;
 await tree.handleDrop(target, transfer as never, {} as never);
 await tree.handleDrop(undefined, transfer as never, {} as never);
 expect(state).toBe(before);
});

it('ignores group drags and external payloads dropped onto an extension', async () => {
 let state = structuredClone(seedState);
 const tree = new ExtensionTreeProvider(state, async action => { state = reducer(state, action as Parameters<typeof reducer>[1]); });
 const member = state.extensions[0];
 const target = new ExtensionNode(member, member.groupId);
 const before = state;
 const transfer = new vscode.DataTransfer();
 tree.handleDrag([new ExtensionGroupNode('writing', 'Writing', undefined)], transfer as never, {} as never);
 await tree.handleDrop(target, transfer as never, {} as never);
 await tree.handleDrop(target, new vscode.DataTransfer() as never, {} as never);
 expect(state).toBe(before);
});

it('reads asynchronous native drag data when value is unavailable',async()=>{
 let state=structuredClone(seedState);const tree=new ExtensionTreeProvider(state,async action=>{state=reducer(state,action as Parameters<typeof reducer>[1])});
 const transfer=new vscode.DataTransfer();transfer.set('application/vnd.extension-nest.extension',{value:undefined,asString:async()=>JSON.stringify({ids:['ms-toolsai.jupyter']})});
 await tree.handleDrop(new ExtensionGroupNode('writing','Writing',undefined),transfer as never,{} as never);
 expect(state.extensions.find(e=>e.id==='ms-toolsai.jupyter')?.groupId).toBe('writing');
});
