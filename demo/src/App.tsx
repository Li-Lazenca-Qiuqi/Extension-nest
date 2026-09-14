import { useEffect, useState } from 'react';
import { Plus, RefreshCw, Check, FolderInput, Tag } from 'lucide-react';
import Modal from './Modal';
import ExtensionCards from './ExtensionCards';
import TagEditor from './TagEditor';
import { availableTags, filterExtensions } from './filterExtensions';
import { useDemoStore } from './useDemoStore';

type DialogState={kind:'create'|'reset'|'move'|'details'|'tags';id?:string;ids?:string[]};
/** Dashboard 的组与标签筛选彼此独立，所有修改统一交给宿主。 */
export default function App(){
 const {state,ready,saved,hostError,nativeFilter,dispatch}=useDemoStore();
 const [group,setGroup]=useState('all');const [status,setStatus]=useState('all');const [query,setQuery]=useState('');const [tagFilter,setTagFilter]=useState<string[]>([]);
 const [selected,setSelected]=useState<string[]>([]);const [menu,setMenu]=useState<string|null>(null);const [dialog,setDialog]=useState<DialogState|null>(null);
 const [name,setName]=useState('');const [error,setError]=useState('');const [notice,setNotice]=useState('');
 useEffect(()=>{setGroup(nativeFilter.group);setSelected([])},[nativeFilter]);
 useEffect(()=>{
  setSelected(ids=>ids.filter(id=>state.extensions.some(e=>e.id===id)));
  setGroup(id=>id==='all'||id==='ungrouped'||state.groups.some(g=>g.id===id)?id:'all');
  setDialog(current=>current?.id&&!state.extensions.some(e=>e.id===current.id)?null:current);
 },[state]);
 useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),3000);return()=>clearTimeout(timer)},[notice]);
 useEffect(()=>{const close=(event:PointerEvent)=>{if(!(event.target instanceof Element)||!event.target.closest('.context-menu,.row-actions'))setMenu(null)};document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close)},[]);
 function open(value:DialogState){setDialog(value);setMenu(null);setName('');setError('')}
 function toggleTag(tag:string){setTagFilter(current=>current.some(t=>t.toLocaleLowerCase()===tag.toLocaleLowerCase())?current.filter(t=>t.toLocaleLowerCase()!==tag.toLocaleLowerCase()):[...current,tag])}
 function clear(){setGroup('all');setStatus('all');setQuery('');setTagFilter([]);setSelected([])}
 function submitName(event:React.FormEvent){event.preventDefault();const value=name.trim();if(!value||Array.from(value).length>50||value.toLowerCase()==='ungrouped'||state.groups.some(g=>g.name.toLowerCase()===value.toLowerCase())){setError('Use a unique name, 1–50 characters.');return}dispatch({type:'createGroup',name:value});setDialog(null)}
 async function copy(id:string){try{await navigator.clipboard.writeText(id);setNotice('ID copied')}catch{setNotice(id)}setMenu(null)}
 const rows=filterExtensions(state.extensions,{group,status,query,tags:tagFilter});
 const tags=availableTags(state.extensions);const options=[...tags,...tagFilter.filter(tag=>!tags.some(t=>t.toLocaleLowerCase()===tag.toLocaleLowerCase()))];
 const metrics=[['Installed',state.extensions.length,'all'],['Enabled',state.extensions.filter(e=>e.enabled).length,'enabled'],['Disabled',state.extensions.filter(e=>!e.enabled).length,'disabled'],['Updates',state.extensions.filter(e=>e.update).length,'updates'],['Ungrouped',state.extensions.filter(e=>!e.groupId).length,'ungrouped']] as const;
 const ext=state.extensions.find(e=>e.id===dialog?.id);const ids=dialog?.ids??(dialog?.id?[dialog.id]:[]);
 const initialTags=ids.length===1?state.extensions.find(e=>e.id===ids[0])?.tags??[]:[];
 return <div className="app" onKeyDown={e=>{if(e.key==='Escape')setMenu(null)}}><main>
  <header className="compact-header"><h1>Extensions</h1><div className="header-actions"><button onClick={()=>setNotice(`${state.extensions.filter(e=>e.update).length} demo updates`)}><RefreshCw size={14}/>Check updates</button><button onClick={()=>open({kind:'create'})}><Plus size={15}/>Group</button></div></header>
  <section className="metrics" aria-label="Extension overview">{metrics.map(([label,count,key])=><button key={key} className={`metric ${(status===key&&key!=='all')||(group==='ungrouped'&&key==='ungrouped')?'metric-active':''}`} onClick={()=>{if(key==='ungrouped')setGroup('ungrouped');else setStatus(key);setSelected([])}}><span>{label}</span><strong>{count}</strong></button>)}</section>
  <section aria-label="Installed extensions"><div className="list-toolbar"><h2>{state.groups.find(g=>g.id===group)?.name??(group==='ungrouped'?'Ungrouped':'All groups')}<small>{rows.length} extensions</small></h2><div className="filters">
   <input id="search" aria-label="Search extensions and tags" placeholder="Search names or tags..." value={query} onChange={e=>setQuery(e.target.value)}/>
   <select aria-label="Filter group" value={group} onChange={e=>{setGroup(e.target.value);setSelected([])}}><option value="all">All groups</option>{state.groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}<option value="ungrouped">Ungrouped</option></select>
   <select aria-label="Filter status" value={status} onChange={e=>setStatus(e.target.value)}><option value="all">All status</option><option value="enabled">Enabled</option><option value="disabled">Disabled</option><option value="updates">Updates</option></select>
   <details className="tag-filter"><summary>Tags{tagFilter.length?` (${tagFilter.length})`:''}</summary><div className="tag-filter-options">{options.length?options.map(tag=><label key={tag}><input type="checkbox" checked={tagFilter.some(t=>t.toLocaleLowerCase()===tag.toLocaleLowerCase())} onChange={()=>toggleTag(tag)}/>{tag}</label>):<span>No tags</span>}</div></details>
  </div></div>
  {(query||group!=='all'||status!=='all'||selected.length>0||tagFilter.length>0)&&<div className="selection-bar"><span>{selected.length?`${selected.length} selected`:'Filters'}</span>{tagFilter.map(tag=><button key={tag} className="tag-chip" aria-label={`Clear tag filter ${tag}`} onClick={()=>toggleTag(tag)}>{tag} ×</button>)}{selected.length>0&&<><button onClick={()=>open({kind:'move',ids:[...selected]})}><FolderInput size={14}/>Move</button><button onClick={()=>open({kind:'tags',ids:[...selected]})}><Tag size={14}/>Edit tags</button></>}<button onClick={clear}>Clear</button></div>}
  <ExtensionCards activeGroup={group} filtered={Boolean(query.trim()||status!=='all'||tagFilter.length)} rows={rows} groups={state.groups} selected={selected} onSelect={setSelected} onDropExtensions={(ids,groupId)=>{dispatch({type:'move',ids,groupId});setSelected([])}} menu={menu} onMenu={setMenu} onToggle={id=>{dispatch({type:'toggle',id});setMenu(null)}} onUpdate={id=>{dispatch({type:'update',id});setMenu(null)}} onMove={id=>open({kind:'move',id})} onDetail={id=>open({kind:'details',id})} onCopy={copy} onEditTags={id=>open({kind:'tags',id})} onFilterTag={toggleTag}/>
  </section></main>
  <footer><span>Demo · Sample data</span><div><button onClick={()=>open({kind:'reset'})}>Reset demo</button><span className={saved?'saved':'danger-text'}><Check size={14}/>{!ready?'Connecting…':saved?'Saved':'Save failed'}</span></div></footer>
  {(hostError||notice)&&<div className="toast" role="status">{hostError||notice}</div>}
  {dialog&&<Modal title={dialog.kind==='create'?'New group':dialog.kind==='reset'?'Reset demo?':dialog.kind==='move'?'Move to group':dialog.kind==='tags'?'Edit tags':ext?.name??'Details'} onClose={()=>setDialog(null)}>
   {dialog.kind==='create'&&<form onSubmit={submitName}><label>Group name<input autoFocus value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Research"/></label>{error&&<p className="danger-text" role="alert">{error}</p>}<div className="modal-actions"><button type="button" onClick={()=>setDialog(null)}>Cancel</button><button className="primary">Create group</button></div></form>}
   {dialog.kind==='move'&&<div className="choices">{[...state.groups,{id:'ungrouped',name:'Ungrouped'}].map(g=><button key={g.id} onClick={()=>{dispatch({type:'move',ids,groupId:g.id==='ungrouped'?null:g.id});setSelected([]);setDialog(null)}}><FolderInput size={15}/>{g.name}</button>)}</div>}
   {dialog.kind==='tags'&&<TagEditor initial={initialTags} suggestions={tags} count={ids.length} onCancel={()=>setDialog(null)} onSave={values=>{dispatch({type:'setTags',ids,tags:values});setDialog(null);setSelected([])}}/>}
   {dialog.kind==='reset'&&<><p>Restore sample data and groups.</p><div className="modal-actions"><button onClick={()=>setDialog(null)}>Cancel</button><button className="danger" onClick={()=>{dispatch({type:'reset'});setDialog(null);clear()}}>Reset demo</button></div></>}
   {dialog.kind==='details'&&ext&&<><p>{ext.description}</p><dl><dt>ID</dt><dd>{ext.id}</dd><dt>Version</dt><dd>{ext.version}{ext.update?` → ${ext.update}`:''}</dd><dt>Group</dt><dd>{state.groups.find(g=>g.id===ext.groupId)?.name??'Ungrouped'}</dd><dt>Tags</dt><dd>{ext.tags.join(', ')||'None'}</dd><dt>Status</dt><dd>{ext.enabled?'Enabled':'Disabled'}</dd></dl><div className="modal-actions"><button onClick={()=>copy(ext.id)}>Copy ID</button><button onClick={()=>open({kind:'tags',id:ext.id})}>Edit tags</button></div></>}
  </Modal>}
 </div>
}
