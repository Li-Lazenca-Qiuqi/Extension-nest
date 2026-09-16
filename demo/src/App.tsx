import { useEffect, useRef, useState } from 'react';
import { Plus, Columns2, ChevronDown, Check, Tag } from 'lucide-react';
import Modal from './Modal';
import GroupExpansionIcon from './GroupExpansionIcon';
import ExtensionCards from './ExtensionCards';
import TagEditor from './TagEditor';
import { availableTags, filterExtensions } from './filterExtensions';
import { useDemoStore } from './useDemoStore';

type DialogState={kind:'create'|'reset'|'tags';id?:string;ids?:string[]};
/** Dashboard 的组与标签筛选彼此独立，所有修改统一交给宿主。 */
export default function App(){
 const {state,ready,saved,hostError,nativeFilter,dispatch,openExtension,icons,isNative}=useDemoStore();
 const [collapsedGroups,setCollapsedGroups]=useState<Record<string,boolean>>({});
 const [twoColumns,setTwoColumns]=useState(false);
 const tagMenu=useRef<HTMLDetailsElement>(null);
 const [group,setGroup]=useState('all');const [status,setStatus]=useState('all');const [query,setQuery]=useState('');const [tagFilter,setTagFilter]=useState<string[]>([]);
 const [selected,setSelected]=useState<string[]>([]);const [menu,setMenu]=useState<string|null>(null);const [dialog,setDialog]=useState<DialogState|null>(null);
 const [name,setName]=useState('');const [error,setError]=useState('');const [notice,setNotice]=useState('');
 useEffect(()=>{setGroup(nativeFilter.group);setStatus('all');setSelected([])},[nativeFilter]);
 useEffect(()=>{
  setSelected(ids=>ids.filter(id=>state.extensions.some(e=>e.id===id)));
  setGroup(id=>id==='all'||id==='ungrouped'||state.groups.some(g=>g.id===id)?id:'all');
  setDialog(current=>current?.id&&!state.extensions.some(e=>e.id===current.id)?null:current);
 },[state]);
 useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),3000);return()=>clearTimeout(timer)},[notice]);
 useEffect(()=>{const close=(event:PointerEvent)=>{if(!(event.target instanceof Element)||!event.target.closest('.context-menu,.row-actions'))setMenu(null)};document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close)},[]);
 useEffect(()=>{const close=(event:PointerEvent)=>{if(event.target instanceof Node&&!tagMenu.current?.contains(event.target))tagMenu.current?.removeAttribute('open')};document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close)},[]);
 function open(value:DialogState){setDialog(value);setMenu(null);setName('');setError('')}
 function toggleTag(tag:string){setTagFilter(current=>current.some(t=>t.toLocaleLowerCase()===tag.toLocaleLowerCase())?current.filter(t=>t.toLocaleLowerCase()!==tag.toLocaleLowerCase()):[...current,tag])}
 function clear(){setGroup('all');setStatus('all');setQuery('');setTagFilter([]);setSelected([])}
 function submitName(event:React.FormEvent){event.preventDefault();const value=name.trim();if(!value||Array.from(value).length>50||value.toLowerCase()==='ungrouped'||state.groups.some(g=>g.name.toLowerCase()===value.toLowerCase())){setError('Use a unique name, 1–50 characters.');return}dispatch({type:'createGroup',name:value});clear();setCollapsedGroups({});setDialog(null)}
 async function copy(id:string){try{await navigator.clipboard.writeText(id);setNotice('ID copied')}catch{setNotice(id)}setMenu(null)}
 const rows=filterExtensions(state.extensions,{group,status,query,tags:tagFilter});
 const tags=availableTags(state.extensions);const options=[...tags,...tagFilter.filter(tag=>!tags.some(t=>t.toLocaleLowerCase()===tag.toLocaleLowerCase()))];
 const metrics=[['All',state.extensions.length,'all'],['Enabled',state.extensions.filter(e=>e.enabled).length,'enabled'],['Disabled',state.extensions.filter(e=>!e.enabled).length,'disabled'],['Updates',state.extensions.filter(e=>e.update).length,'updates'],['Ungrouped',state.extensions.filter(e=>!e.groupId).length,'ungrouped']] as const;
 const activeMetric=group==='ungrouped'?'ungrouped':status;
 const ids=dialog?.ids??(dialog?.id?[dialog.id]:[]);
 const initialTags=ids.length===1?state.extensions.find(e=>e.id===ids[0])?.tags??[]:[];
 return <div className="app" onKeyDown={e=>{if(e.key==='Escape'){setMenu(null);tagMenu.current?.removeAttribute('open')}}}><main>
  <header className="dashboard-toolbar"><h1>Extensions</h1>
  <section className="metrics" aria-label="Extension overview">{metrics.map(([label,count,key])=><button key={key} aria-pressed={activeMetric===key} className={`metric ${activeMetric===key?'metric-active':''}`} onClick={()=>{if(key==='all'){clear();return}setGroup(key==='ungrouped'?'ungrouped':'all');setStatus(key==='ungrouped'?'all':key);setSelected([])}}><span>{label}</span><strong>{count}</strong></button>)}</section>
  <div className="filters">
   <input id="search" aria-label="Search extensions and tags" placeholder="Search names or tags..." value={query} onChange={e=>setQuery(e.target.value)}/>
   <select aria-label="Filter group" value={group} onChange={e=>{setGroup(e.target.value);if(e.target.value==='ungrouped')setStatus('all');setSelected([])}}><option value="all">All groups</option>{state.groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}<option value="ungrouped">Ungrouped</option></select>
   <details ref={tagMenu} className="tag-filter"><summary><Tag size={13}/>Tags{tagFilter.length?` (${tagFilter.length})`:''}<ChevronDown size={12}/></summary><div className="tag-filter-options">{options.length?options.map(tag=><label key={tag}><input type="checkbox" checked={tagFilter.some(t=>t.toLocaleLowerCase()===tag.toLocaleLowerCase())} onChange={()=>toggleTag(tag)}/><span>{tag}</span></label>):<span>No tags</span>}</div></details>
  </div><div className="header-actions"><select className="sort-select" aria-label="Sort groups" value="" onChange={e=>dispatch({type:'sortGroups',direction:e.target.value==='asc'?1:-1})}><option value="" disabled>Sort groups</option><option value="asc">Name A–Z</option><option value="desc">Name Z–A</option></select><button aria-label="Expand all groups" title="Expand all groups" onClick={()=>setCollapsedGroups({})}><GroupExpansionIcon expand/></button><button aria-label="Collapse all groups" title="Collapse all groups" onClick={()=>setCollapsedGroups(Object.fromEntries([...state.groups.map(g=>g.id),'ungrouped'].map(id=>[id,true])))}><GroupExpansionIcon/></button><button aria-label="Two-column groups" title="Two-column groups" aria-pressed={twoColumns} className={twoColumns?'view-toggle active':'view-toggle'} onClick={()=>setTwoColumns(value=>!value)}><Columns2 size={15}/></button><button onClick={()=>open({kind:'create'})}><Plus size={15}/>Group</button></div></header>
  <section aria-label="Installed extensions">
  {(query||group!=='all'||status!=='all'||selected.length>0||tagFilter.length>0)&&<div className="selection-bar"><span>{selected.length?`${selected.length} selected`:'Filters'}</span>{tagFilter.map(tag=><button key={tag} className="tag-chip" aria-label={`Clear tag filter ${tag}`} onClick={()=>toggleTag(tag)}>{tag} ×</button>)}{selected.length>0&&<><button onClick={()=>open({kind:'tags',ids:[...selected]})}><Tag size={14}/>Edit tags</button></>}<button onClick={clear}>Clear</button></div>}
  <ExtensionCards onSortAction={dispatch} collapsedGroups={collapsedGroups} onToggleGroup={id=>setCollapsedGroups(current=>({...current,[id]:!current[id]}))} twoColumns={twoColumns} icons={icons} isNative={isNative} activeGroup={group} filtered={Boolean(query.trim()||status!=='all'||tagFilter.length)} rows={rows} groups={state.groups} selected={selected} onSelect={setSelected} onDropExtensions={(ids,groupId,beforeId)=>{dispatch({type:'move',ids,groupId,beforeId});setSelected([])}} menu={menu} onMenu={setMenu} onToggle={id=>{dispatch({type:'toggle',id});setMenu(null)}} onUpdate={id=>{dispatch({type:'update',id});setMenu(null)}} onOpenExtension={openExtension} onCopy={copy} onEditTags={id=>open({kind:'tags',id})} onFilterTag={toggleTag}/>
  </section></main>
  <footer><span>Demo · Sample data</span><div><button onClick={()=>open({kind:'reset'})}>Reset demo</button><span className={saved?'saved':'danger-text'}><Check size={14}/>{!ready?'Connecting…':saved?'Saved':'Save failed'}</span></div></footer>
  {(hostError||notice)&&<div className="toast" role="status">{hostError||notice}</div>}
  {dialog&&<Modal title={dialog.kind==='create'?'New group':dialog.kind==='reset'?'Reset demo?':'Edit tags'} onClose={()=>setDialog(null)}>
   {dialog.kind==='create'&&<form onSubmit={submitName}><label>Group name<input autoFocus value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Research"/></label>{error&&<p className="danger-text" role="alert">{error}</p>}<div className="modal-actions"><button type="button" onClick={()=>setDialog(null)}>Cancel</button><button className="primary">Create group</button></div></form>}
   {dialog.kind==='tags'&&<TagEditor initial={initialTags} suggestions={tags} count={ids.length} onCancel={()=>setDialog(null)} onSave={values=>{dispatch({type:'setTags',ids,tags:values});setDialog(null);setSelected([])}}/>}
   {dialog.kind==='reset'&&<><p>Restore sample data and groups.</p><div className="modal-actions"><button onClick={()=>setDialog(null)}>Cancel</button><button className="danger" onClick={()=>{dispatch({type:'reset'});setDialog(null);clear()}}>Reset demo</button></div></>}
  </Modal>}
 </div>
}
