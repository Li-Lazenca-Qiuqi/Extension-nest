import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
interface DragSession {
 source:HTMLElement; root:Element; ids:string[]; pointerId:number;
 startX:number; startY:number; x:number; y:number; offsetX:number; offsetY:number;
 preview:HTMLElement|null; cursor:string;
}
/** 在 Webview 内绘制真实尺寸的卡片预览，避免操作系统原生拖影附加透明度或遮罩。 */
export function useCardDrag(onDrop:(ids:string[],groupId:string|null)=>void,onStart:()=>void){
 const [activeIds,setActiveIds]=useState<string[]>([]);
 const [targetGroup,setTargetGroup]=useState<string|undefined>();
 const targetGroupRef=useRef<string|undefined>(undefined);
 const session=useRef<DragSession|null>(null);const frame=useRef<number|null>(null);
 const suppressClick=useRef(false);
 const callbacks=useRef({onDrop,onStart});callbacks.current={onDrop,onStart};
 /** 清理预览与鼠标捕获；取消时不提交归属修改。 */
 function finish(){
  const current=session.current;session.current=null;
  if(frame.current!==null){cancelAnimationFrame(frame.current);frame.current=null}
  if(current){current.preview?.remove();document.body.style.cursor=current.cursor;
   if(current.source.hasPointerCapture?.(current.pointerId))current.source.releasePointerCapture(current.pointerId);
  }
  setActiveIds([]);
  updateTarget(undefined);
 }
 /** 仅在跨越分组边界时更新界面，避免每个鼠标帧重绘全部卡片。 */
 function updateTarget(groupId:string|undefined){
  if(targetGroupRef.current===groupId)return;
  targetGroupRef.current=groupId;setTargetGroup(groupId);
 }
 /** 使用视口坐标定位当前卡片网格内的目标组，不接受外部元素。 */
 function targetAt(current:DragSession){
  const target=document.elementFromPoint(current.x,current.y)?.closest<HTMLElement>('[data-group-section]');
  return target&&current.root.contains(target)?target.dataset.groupSection:undefined;
 }
 /** 预览位置保留起拖点相对卡片的偏移，不缩放、不旋转。 */
 function position(current:DragSession){
  if(current.preview){current.preview.style.left=`${current.x-current.offsetX}px`;current.preview.style.top=`${current.y-current.offsetY}px`}
 }
 /** 靠近编辑器上下边缘时持续滚动，预览仍固定跟随鼠标。 */
 function scrollFrame(){
  const current=session.current;if(!current?.preview)return;
  const distance=current.y<40?-12:current.y>window.innerHeight-40?12:0;
  if(distance)window.scrollBy(0,distance);
  updateTarget(targetAt(current));
  frame.current=requestAnimationFrame(scrollFrame);
 }
 useEffect(()=>{
  function move(event:PointerEvent){
   const current=session.current;if(!current||event.pointerId!==current.pointerId)return;
   current.x=event.clientX;current.y=event.clientY;
   if(!current.preview&&Math.hypot(current.x-current.startX,current.y-current.startY)<6)return;
   event.preventDefault();
   if(!current.preview){
    suppressClick.current=true;
    const rect=current.source.getBoundingClientRect();const preview=current.source.cloneNode(true) as HTMLElement;
    preview.removeAttribute('data-extension');preview.removeAttribute('aria-label');preview.setAttribute('aria-hidden','true');preview.setAttribute('draggable','false');
    preview.querySelectorAll('[id]').forEach(element=>element.removeAttribute('id'));preview.querySelector('.context-menu')?.remove();
    preview.classList.remove('is-dragging','menu-open');preview.classList.add('card-drag-preview');
    Object.assign(preview.style,{position:'fixed',left:'0px',top:'0px',width:`${rect.width}px`,height:`${rect.height}px`,margin:'0',opacity:'0.82',pointerEvents:'none',zIndex:'10000',transition:'none',transform:'none',filter:'none',boxShadow:'none',boxSizing:'border-box'});
    current.preview=preview;document.body.append(preview);document.body.style.cursor='grabbing';setActiveIds(current.ids);callbacks.current.onStart();
    frame.current=requestAnimationFrame(scrollFrame);
   }
   position(current);
   updateTarget(targetAt(current));
  }
  function up(event:PointerEvent){
   const current=session.current;if(!current||event.pointerId!==current.pointerId)return;
   current.x=event.clientX;current.y=event.clientY;
   const target=current.preview?targetAt(current):undefined;const ids=current.ids;finish();
   if(target!==undefined)callbacks.current.onDrop(ids,target==='ungrouped'?null:target);
  }
  function cancel(){finish()}
  function key(event:KeyboardEvent){if(event.key==='Escape'&&session.current){event.preventDefault();finish()}}
  document.addEventListener('pointermove',move,{passive:false});document.addEventListener('pointerup',up);document.addEventListener('pointercancel',cancel);document.addEventListener('keydown',key);window.addEventListener('blur',cancel);
  return()=>{document.removeEventListener('pointermove',move);document.removeEventListener('pointerup',up);document.removeEventListener('pointercancel',cancel);document.removeEventListener('keydown',key);window.removeEventListener('blur',cancel);finish()};
 },[]);
 /** 仅鼠标左键从卡片非功能区域起拖，按钮与标签保持正常点击。 */
 function begin(event:ReactPointerEvent<HTMLElement>,ids:string[]){
  if(event.button!==0||event.pointerType==='touch'||session.current)return;
  suppressClick.current=false;
  if(event.target instanceof Element&&event.target.closest('button,input,select,a,[role="menuitem"]'))return;
  const rect=event.currentTarget.getBoundingClientRect();const root=event.currentTarget.closest('.cards-region');if(!root)return;
  event.preventDefault();event.currentTarget.setPointerCapture?.(event.pointerId);
  session.current={source:event.currentTarget,root,ids:[...ids],pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,x:event.clientX,y:event.clientY,offsetX:event.clientX-rect.left,offsetY:event.clientY-rect.top,preview:null,cursor:document.body.style.cursor};
 }
 /** 拖动结束生成的 click 不能把刚移动的多选集合重新变为单选。 */
 function consumeClick(){const suppressed=suppressClick.current;suppressClick.current=false;return suppressed}
 return {activeIds,targetGroup,begin,consumeClick};
}
