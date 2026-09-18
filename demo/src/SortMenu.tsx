import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { ChevronDown } from 'lucide-react';
interface Props { label:string; options:readonly {value:string;label:string}[]; onSelect:(value:string)=>void; className?:string }
/** 排序菜单使用主题浮层，独立测量宽度并预留滚动条，不触发父组折叠。 */
export default function SortMenu({label,options,onSelect,className=''}:Props){
 const root=useRef<HTMLDivElement>(null),measureRef=useRef<HTMLSpanElement>(null),trigger=useRef<HTMLButtonElement>(null);
 const [open,setOpen]=useState(false),[width,setWidth]=useState(120);
 useLayoutEffect(()=>{const element=measureRef.current;if(!element)return;const measure=()=>setWidth(Math.min(180,Math.max(80,Math.ceil(element.getBoundingClientRect().width)+40)));measure();if(typeof ResizeObserver==='undefined')return;const observer=new ResizeObserver(measure);observer.observe(element);return()=>observer.disconnect()},[options]);
 useEffect(()=>{if(!open)return;const close=(event:PointerEvent)=>{if(event.target instanceof Node&&!root.current?.contains(event.target))setOpen(false)};document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close)},[open]);
 return <div ref={root} className={`sort-menu ${className}`} style={{width} as CSSProperties} onClick={e=>e.stopPropagation()} onKeyDown={e=>{e.stopPropagation();if(e.key==='Escape'){setOpen(false);trigger.current?.focus()}}}>
  <span ref={measureRef} className="filter-width-measure" aria-hidden="true">{options.map(option=><span key={option.value}>{option.label}</span>)}</span>
  <button ref={trigger} className="sort-trigger" aria-label={label} aria-expanded={open} onClick={()=>setOpen(value=>!value)}>Sort<ChevronDown size={12}/></button>
  {open&&<div className="tag-filter-options group-filter-options sort-options">{options.map(option=><button key={option.value} onClick={()=>{onSelect(option.value);setOpen(false);trigger.current?.focus()}}>{option.label}</button>)}</div>}
 </div>
}
export const groupSortOptions=[{value:'asc',label:'Name A–Z'},{value:'desc',label:'Name Z–A'}] as const;
export const extensionSortOptions=(['name','publisher'] as const).flatMap(field=>[{value:`${field}:asc`,label:`${field==='name'?'Name':'Publisher'} A–Z`},{value:`${field}:desc`,label:`${field==='name'?'Name':'Publisher'} Z–A`}]);
