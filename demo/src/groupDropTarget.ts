/** 整个组和组间空白都是落点；移动方向决定插入前后，避免同一组分成两个目标。 */
export function findGroupDropTarget(root:Element,sourceId:string,x:number,y:number):{id:string;after:boolean}|null {
 const groups=Array.from(root.querySelectorAll<HTMLElement>('[data-group-section]')).filter(e=>e.dataset.groupSection!=='ungrouped');
 const source=groups.findIndex(e=>e.dataset.groupSection===sourceId);
 if(source<0)return null;
 let nearest=-1,distance=Infinity;
 groups.forEach((element,index)=>{
  const rect=element.getBoundingClientRect();
  const dx=Math.max(rect.left-x,0,x-rect.right),dy=Math.max(rect.top-y,0,y-rect.bottom);
  const value=dx*dx+dy*dy;
  if(value<distance){distance=value;nearest=index}
 });
 if(nearest<0||nearest===source)return null;
 return {id:groups[nearest].dataset.groupSection!,after:nearest>source};
}
