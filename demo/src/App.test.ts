// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeAll, afterEach, expect, it, vi } from 'vitest';
import { seedState } from './seed';
import { setUiLanguage } from './uiI18n';
import type AppType from './App';
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT=true;
let App:typeof AppType;
let cleanup=()=>{};
const postMessage=vi.fn();
beforeAll(async()=>{window.acquireVsCodeApi=()=>({postMessage});App=(await import('./App')).default});
afterEach(()=>{cleanup();document.body.innerHTML='';postMessage.mockClear();setUiLanguage(undefined)});
it('keeps visibility independent from Ungrouped and places cleanup last',()=>{
 const node=document.createElement('div');document.body.append(node);const root=createRoot(node);
 act(()=>root.render(createElement(App)));cleanup=()=>act(()=>root.unmount());
 const extensions=seedState.extensions.slice(0,3).map((e,i)=>({...e,groupId:i===2?seedState.groups[0].id:null,visibility:i===0?'Visible' as const:'Unverified' as const}));
 act(()=>window.dispatchEvent(new MessageEvent('message',{data:{type:'state',state:{...seedState,extensions,freshness:'Ready'}}})));
 act(()=>node.querySelector<HTMLButtonElement>('[aria-label="Sort groups"]')!.click());
 act(()=>Array.from(node.querySelectorAll<HTMLButtonElement>('.header-actions .sort-options button')).find(b=>b.textContent==='Name Z–A')!.click());
 expect(postMessage).toHaveBeenCalledWith({type:'action',action:{type:'sortGroups',direction:-1}});
 expect(node.querySelector('.header-actions .sort-options')).toBeNull();
 const metrics=Array.from(node.querySelectorAll<HTMLButtonElement>('.metrics button'));
 expect(metrics.map(b=>b.querySelector('span')?.textContent)).toEqual(['All','Visible','Not found']);
 const group=node.querySelector<HTMLElement>('[aria-label="Filter group"]')!;
 act(()=>Array.from(node.querySelectorAll<HTMLButtonElement>('.group-filter-options button')).find(b=>b.textContent==='Ungrouped')!.click());
 expect(metrics[1].getAttribute('aria-pressed')).toBe('true');
 expect(node.querySelectorAll('article')).toHaveLength(1);
 act(()=>metrics[2].click());
 expect(group.querySelector('.filter-button-content')?.textContent).toBe('Ungrouped');
 expect(node.querySelector('article')?.getAttribute('data-extension')).toBe(extensions[1].id);
 expect(node.querySelector('.header-actions')?.lastElementChild?.className).toBe('cleanup-unverified');
 act(()=>node.querySelector<HTMLButtonElement>('.cleanup-unverified')!.click());
 expect(postMessage).toHaveBeenCalledWith({type:'cleanupUnverified'});
 act(()=>metrics[0].click());expect(group.querySelector('.filter-button-content')?.textContent).toBe('All groups');expect(node.querySelectorAll('article')).toHaveLength(3);
});
it('shows an empty group when selected or found by name without a no-results notice',()=>{
 const node=document.createElement('div');document.body.append(node);const root=createRoot(node);
 act(()=>root.render(createElement(App)));cleanup=()=>act(()=>root.unmount());
 act(()=>window.dispatchEvent(new MessageEvent('message',{data:{type:'state',state:{...seedState,groups:[{id:'empty',name:'Research Lab',color:'#123456'}],extensions:[],freshness:'Ready'}}})));
 expect(node.querySelector('[data-group-section="empty"]')).toBeNull();
 const search=node.querySelector<HTMLInputElement>('#search')!;
 act(()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(search,'research');search.dispatchEvent(new Event('input',{bubbles:true}))});
 expect(node.querySelector('[data-group-section="empty"]')).not.toBeNull();
 expect(node.querySelector('.discovery-empty')).toBeNull();
 act(()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(search,'');search.dispatchEvent(new Event('input',{bubbles:true}))});
 act(()=>Array.from(node.querySelectorAll<HTMLButtonElement>('.group-filter-options button')).find(b=>b.textContent==='Research Lab')!.click());
 expect(node.querySelector('[data-group-section="empty"]')).not.toBeNull();
 expect(node.querySelector('.discovery-empty')).toBeNull();
});

it.each([
 {language:'zh-cn',labels:['全部','可见','未发现'],sort:'排序分组',descending:'名称 Z–A'},
 {language:'en',labels:['All','Visible','Not found'],sort:'Sort groups',descending:'Name Z–A'},
])('renders $language without translating user data or action values',({language,labels,sort,descending})=>{
 setUiLanguage(language);
 const node=document.createElement('div');document.body.append(node);const root=createRoot(node);
 act(()=>root.render(createElement(App)));cleanup=()=>act(()=>root.unmount());
 const state={...seedState,freshness:'Ready' as const};
 act(()=>window.dispatchEvent(new MessageEvent('message',{data:{type:'state',state}})));
 expect([...node.querySelectorAll('.metrics button>span')].map(element=>element.textContent)).toEqual(labels);
 expect(node.textContent).toContain('AI Coding');
 expect(node.querySelector('[data-extension="openai.codex"]')).not.toBeNull();
 const clearButton=node.querySelector<HTMLButtonElement>('.clear-filters')!;
 expect(node.querySelector('.filters')?.firstElementChild).toBe(clearButton);
 expect(clearButton.getAttribute('aria-label')).toBe(language==='zh-cn'?'清除筛选条件':'Clear filters');
 expect(node.querySelector('.selection-bar')).toBeNull();
 act(()=>node.querySelector<HTMLButtonElement>(`[aria-label="${sort}"]`)!.click());
 act(()=>[...node.querySelectorAll<HTMLButtonElement>('.header-actions .sort-options button')].find(button=>button.textContent===descending)!.click());
 expect(postMessage).toHaveBeenCalledWith({type:'action',action:{type:'sortGroups',direction:-1}});
 act(()=>[...node.querySelectorAll<HTMLButtonElement>('.group-filter-options button')].find(button=>button.textContent==='AI Coding')!.click());
 act(()=>node.querySelector<HTMLButtonElement>('.card-tags button')!.click());
 const search=node.querySelector<HTMLInputElement>('#search')!;
 act(()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(search,'Codex');search.dispatchEvent(new Event('input',{bubbles:true}))});
 expect(node.querySelectorAll('article')).toHaveLength(1);
 act(()=>clearButton.click());
 expect(search.value).toBe('');
 expect(node.querySelectorAll('article')).toHaveLength(state.extensions.length);
 expect(node.querySelector('.selection-bar')).toBeNull();
 expect(node.querySelector('.metrics button')?.getAttribute('aria-pressed')).toBe('true');
 expect(state).toEqual({...seedState,freshness:'Ready'});
});
