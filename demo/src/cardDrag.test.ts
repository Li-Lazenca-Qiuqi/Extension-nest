// @vitest-environment jsdom
import { act,createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach,beforeEach,expect,it,vi } from 'vitest';
import ExtensionCards from './ExtensionCards';
import { seedState } from './seed';
import { reducer } from './state';
(globalThis as typeof globalThis & {IS_REACT_ACT_ENVIRONMENT:boolean}).IS_REACT_ACT_ENVIRONMENT=true;
let cleanup=()=>{};let target:Element|null=null;
beforeEach(()=>{vi.stubGlobal('requestAnimationFrame',vi.fn(()=>1));vi.stubGlobal('cancelAnimationFrame',vi.fn());Object.defineProperty(document,'elementFromPoint',{configurable:true,value:()=>target})});
afterEach(()=>{cleanup();document.body.innerHTML='';vi.unstubAllGlobals();target=null});
/** 真实 React 事件与 reducer 联动，测试不依赖系统拖影。 */
function setup(selected:string[]=[]){
 let state=structuredClone(seedState);const element=document.createElement('div');document.body.append(element);const root=createRoot(element);const openExtension=vi.fn();
 const move=vi.fn((ids:string[],groupId:string|null)=>{state=reducer(state,{type:'move',ids,groupId});render()});
 function render(){root.render(createElement(ExtensionCards,{activeGroup:'all',filtered:false,rows:state.extensions,groups:state.groups,selected,menu:null,onSelect:ids=>{selected=ids;render()},onMenu:()=>{},onEditTags:()=>{},onFilterTag:()=>{},onOpenExtension:openExtension,onCopy:()=>{},onDropExtensions:move}))}
 act(render);cleanup=()=>act(()=>root.unmount());
 const card=element.querySelector<HTMLElement>('[data-extension="ms-python.python"]')!;
 card.getBoundingClientRect=()=>({x:100,y:200,left:100,top:200,right:400,bottom:340,width:300,height:140,toJSON:()=>({})});
 return {element,move,openExtension,card,state:()=>state};
}
/** 保留事件冒泡与点击隔离，模拟同一鼠标指针。 */
function pointer(node:Element|Document,type:string,x=120,y=220){const event=new Event(type,{bubbles:true,cancelable:true});Object.defineProperties(event,{button:{value:0},pointerId:{value:1},pointerType:{value:'mouse'},clientX:{value:x},clientY:{value:y}});act(()=>node.dispatchEvent(event));return event}
it('uses a same-size 82% preview at the original cursor offset and restores on drop',()=>{
 const app=setup();target=app.element.querySelector('[data-group-section="writing"]');pointer(app.card,'pointerdown');pointer(document,'pointermove',200,300);
 const preview=document.querySelector<HTMLElement>('.card-drag-preview')!;
 expect(preview.style.width).toBe('300px');expect(preview.style.height).toBe('140px');expect(preview.style.opacity).toBe('0.82');expect(preview.style.left).toBe('180px');expect(preview.style.top).toBe('280px');expect(preview.style.pointerEvents).toBe('none');expect(app.card.draggable).toBe(false);
 pointer(document,'pointermove',240,310);expect(preview.style.left).toBe('220px');expect(preview.style.top).toBe('290px');
 pointer(document,'pointerup',240,310);expect(app.move).toHaveBeenCalledWith(['ms-python.python'],'writing',null);expect(document.querySelector('.card-drag-preview')).toBeNull();
 expect(app.state().extensions.find(e=>e.id==='ms-python.python')?.tags).toEqual(seedState.extensions.find(e=>e.id==='ms-python.python')?.tags);
});
it('moves a selection to Ungrouped from a nested target',()=>{
 const app=setup(['ms-python.python','ms-toolsai.jupyter']);target=app.element.querySelector('[data-group-section="ungrouped"] summary span');pointer(app.card,'pointerdown');pointer(document,'pointermove',250,300);pointer(document,'pointerup',250,300);expect(app.move).toHaveBeenCalledWith(['ms-python.python','ms-toolsai.jupyter'],null,null);
});
it('highlights one whole group across its heading, cards and gaps, then clears outside and on drop',()=>{
 const app=setup();const writing=app.element.querySelector('[data-group-section="writing"]')!;
 target=writing.querySelector('summary span');pointer(app.card,'pointerdown');
 expect(app.element.querySelector('.is-drop-target')).toBeNull();
 for(const hit of [target,writing.querySelector('.extension-card strong'),writing.querySelector('.extension-grid')]){
  target=hit;pointer(document,'pointermove',240,310);
  expect(app.element.querySelectorAll('.is-drop-target')).toHaveLength(1);expect(writing.classList.contains('is-drop-target')).toBe(true);
 }
 target=app.element.querySelector('[data-group-section="ungrouped"] summary');pointer(document,'pointermove',250,320);
 expect(writing.classList.contains('is-drop-target')).toBe(false);
 expect(app.element.querySelector('.is-drop-target')?.getAttribute('data-group-section')).toBe('ungrouped');
 target=document.body;pointer(document,'pointermove',260,330);expect(app.element.querySelector('.is-drop-target')).toBeNull();
 target=writing;pointer(document,'pointermove',240,310);pointer(document,'pointerup',240,310);
 expect(app.element.querySelector('.is-drop-target')).toBeNull();expect(app.move).toHaveBeenCalledWith(['ms-python.python'],'writing',null);
});
it.each(['pointercancel','Escape','blur'])('clears the target highlight on %s without moving',reason=>{
 const app=setup();target=app.element.querySelector('[data-group-section="writing"]');pointer(app.card,'pointerdown');pointer(document,'pointermove',240,310);
 expect(app.element.querySelector('.is-drop-target')).not.toBeNull();
 if(reason==='pointercancel')pointer(document,'pointercancel');
 else if(reason==='Escape')act(()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})));
 else act(()=>window.dispatchEvent(new Event('blur')));
 expect(app.element.querySelector('.is-drop-target')).toBeNull();expect(app.move).not.toHaveBeenCalled();
});
it('keeps buttons clickable and never starts native or custom dragging from controls',()=>{
 const app=setup();for(const control of app.card.querySelectorAll('button,input')){pointer(control,'pointerdown');pointer(document,'pointermove',300,400);pointer(document,'pointerup',300,400);expect(document.querySelector('.card-drag-preview')).toBeNull()}
 act(()=>app.card.querySelector<HTMLButtonElement>('.extension-name')!.click());expect(app.openExtension).toHaveBeenCalledWith('ms-python.python');
 const native=new Event('dragstart',{bubbles:true,cancelable:true});act(()=>app.card.dispatchEvent(native));expect(native.defaultPrevented).toBe(true);expect(app.move).not.toHaveBeenCalled();
});
it('does not move after a click, cancellation or outside drop',()=>{
 const app=setup();pointer(app.card,'pointerdown');pointer(document,'pointerup');expect(app.move).not.toHaveBeenCalled();pointer(app.card,'pointerdown');pointer(document,'pointermove',300,400);pointer(document,'pointercancel');expect(document.querySelector('.card-drag-preview')).toBeNull();
 pointer(app.card,'pointerdown');pointer(document,'pointermove',300,400);target=document.body;pointer(document,'pointerup',300,400);expect(app.move).not.toHaveBeenCalled();
});
it('cleans up the preview on Escape and window blur',()=>{
 const app=setup();pointer(app.card,'pointerdown');pointer(document,'pointermove',300,400);act(()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})));expect(document.querySelector('.card-drag-preview')).toBeNull();expect(app.card.classList.contains('is-dragging')).toBe(false);
 pointer(app.card,'pointerdown');pointer(document,'pointermove',300,400);act(()=>window.dispatchEvent(new Event('blur')));expect(document.querySelector('.card-drag-preview')).toBeNull();expect(app.move).not.toHaveBeenCalled();
});

it('selects one card, toggles with Ctrl and keeps native title navigation separate',()=>{
 const app=setup();const second=app.element.querySelector<HTMLElement>('[data-extension="ms-toolsai.jupyter"]')!;
 const click=(element:Element,ctrlKey=false)=>act(()=>element.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,ctrlKey})));
 const chosen=()=>Array.from(app.element.querySelectorAll('.selected')).map(element=>element.getAttribute('data-extension'));
 expect(app.element.querySelectorAll('input[type="checkbox"]')).toHaveLength(0);
 click(app.card);expect(chosen()).toEqual(['ms-python.python']);
 click(second,true);expect(new Set(chosen())).toEqual(new Set(['ms-python.python','ms-toolsai.jupyter']));
 click(app.card,true);expect(chosen()).toEqual(['ms-toolsai.jupyter']);
 click(app.card.querySelector('.extension-name')!,true);expect(chosen()).toHaveLength(2);expect(app.openExtension).not.toHaveBeenCalled();
 click(app.card.querySelector('.extension-name')!);expect(chosen()).toEqual(['ms-python.python']);expect(app.openExtension).toHaveBeenCalledWith('ms-python.python');
});
it('does not turn a completed multi-card drag into a single selection',()=>{
 const app=setup(['ms-python.python','ms-toolsai.jupyter']);target=app.element.querySelector('[data-group-section="writing"]');
 pointer(app.card,'pointerdown');pointer(document,'pointermove',240,310);pointer(document,'pointerup',240,310);
 const moved=app.element.querySelector('[data-extension="ms-python.python"]')!;
 act(()=>moved.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true})));
 expect(app.move).toHaveBeenCalledWith(['ms-python.python','ms-toolsai.jupyter'],'writing',null);
 expect(app.element.querySelectorAll('.selected')).toHaveLength(2);
});
