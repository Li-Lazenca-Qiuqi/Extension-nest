// @vitest-environment jsdom
import { expect,it } from 'vitest';
import { findGroupDropTarget } from './groupDropTarget';
function fixture(twoColumns=false){
 const root=document.createElement('div');
 for(let i=0;i<4;i++){
  const e=document.createElement('details');e.dataset.groupSection=i===3?'ungrouped':String(i);
  const left=twoColumns?(i%2)*320:0,top=twoColumns?Math.floor(i/2)*220:i*220;
  e.getBoundingClientRect=()=>({left,right:left+300,top,bottom:top+200} as DOMRect);root.append(e);
 }
 return root;
}
it('uses the entire target group for one destination in either direction',()=>{
 const root=fixture();
 for(const y of [220,225,320,415,420])expect(findGroupDropTarget(root,'0',100,y)).toEqual({id:'1',after:true});
 for(const y of [0,5,100,195,200])expect(findGroupDropTarget(root,'2',100,y)).toEqual({id:'0',after:false});
 expect(findGroupDropTarget(root,'0',100,100)).toBeNull();
});
it('accepts whitespace and keeps Ungrouped fixed',()=>{
 const root=fixture();
 expect(findGroupDropTarget(root,'0',100,435)).toEqual({id:'2',after:true});
 expect(findGroupDropTarget(root,'0',100,700)).toEqual({id:'2',after:true});
 expect(findGroupDropTarget(root,'missing',100,300)).toBeNull();
});
it('uses horizontal position in two columns',()=>{
 const root=fixture(true);
 expect(findGroupDropTarget(root,'0',500,5)).toEqual({id:'1',after:true});
 expect(findGroupDropTarget(root,'0',500,195)).toEqual({id:'1',after:true});
 expect(findGroupDropTarget(root,'2',315,100)).toEqual({id:'1',after:false});
});
