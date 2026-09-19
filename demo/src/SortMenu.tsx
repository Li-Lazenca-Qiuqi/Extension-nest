import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
interface Props { label:string; options:readonly {value:string;label:string}[]; onSelect:(value:string)=>void; className?:string }
/** 排序菜单使用主题浮层，由 CSS 内容宽度定宽并预留滚动条，不触发父组折叠。 */
export default function SortMenu({label,options,onSelect,className=''}:Props){
 const root=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null);
 const [open,setOpen]=useState(false);
 useEffect(()=>{if(!open)return;const close=(event:PointerEvent)=>{if(event.target instanceof Node&&!root.current?.contains(event.target))setOpen(false)};document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close)},[open]);
 return <div ref={root} className={`sort-menu ${className}`} onClick={e=>e.stopPropagation()} onKeyDown={e=>{e.stopPropagation();if(e.key==='Escape'){setOpen(false);trigger.current?.focus()}}}>
  <span className="menu-width-sizer" aria-hidden="true">{options.map(option=><span key={option.value}>{option.label}</span>)}</span>
  <button ref={trigger} className="sort-trigger" aria-label={label} aria-expanded={open} onClick={()=>setOpen(value=>!value)}>Sort<ChevronDown size={12}/></button>
  {open&&<div className="tag-filter-options group-filter-options sort-options">{options.map(option=><button key={option.value} onClick={()=>{onSelect(option.value);setOpen(false);trigger.current?.focus()}}>{option.label}</button>)}</div>}
 </div>
}

export const groupSortOptions=[{value:'asc',label:'Name A–Z'},{value:'desc',label:'Name Z–A'}] as const;
export const extensionSortOptions=(['name','publisher'] as const).flatMap(field=>[{value:`${field}:asc`,label:`${field==='name'?'Name':'Publisher'} A–Z`},{value:`${field}:desc`,label:`${field==='name'?'Name':'Publisher'} Z–A`}]);
