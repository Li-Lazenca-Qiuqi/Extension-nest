import { DiscoveryStatus, LastScan } from './DiscoveryStatus';
import { groupExtensions } from './groupExtensions';
import SortMenu, { groupSortOptions } from './SortMenu';
import { useEffect, useRef, useState } from 'react';
import { Plus, Columns2, ChevronDown, Check, Tag } from 'lucide-react';
import Modal from './Modal';
import GroupExpansionIcon from './GroupExpansionIcon';
import ExtensionCards from './ExtensionCards';
import TagEditor from './TagEditor';
import { availableTags, filterExtensions } from './filterExtensions';
import { useDemoStore } from './useDemoStore';
import { statusText, t } from './uiI18n';

type DialogState={kind:'create'|'reset'|'tags';id?:string;ids?:string[]};
/** Dashboard 的组与标签筛选彼此独立，所有修改统一交给宿主。 */
export default function App(){
 const {repairData,state,ready,saved,hostError,nativeFilter,dispatch,openExtension,refresh,openExtensions,cleanupUnverified,icons,isNative}=useDemoStore();
 const [collapsedGroups,setCollapsedGroups]=useState<Record<string,boolean>>({});
 const [twoColumns,setTwoColumns]=useState(false);
 const tagMenu=useRef<HTMLDetailsElement>(null);
 const groupMenu=useRef<HTMLDetailsElement>(null);
 const [group,setGroup]=useState('all');const [status,setStatus]=useState('Visible');const [query,setQuery]=useState('');const [tagFilter,setTagFilter]=useState<string[]>([]);
 const [selected,setSelected]=useState<string[]>([]);const [menu,setMenu]=useState<string|null>(null);const [dialog,setDialog]=useState<DialogState|null>(null);
 const [name,setName]=useState('');const [error,setError]=useState('');const [notice,setNotice]=useState('');
 useEffect(()=>{setGroup(nativeFilter.group);setStatus(nativeFilter.group==='all'?'Visible':'all');setSelected([])},[nativeFilter]);
 useEffect(()=>{
  setSelected(ids=>ids.filter(id=>state.extensions.some(e=>e.id===id)));
  setGroup(id=>id==='all'||id==='ungrouped'||state.groups.some(g=>g.id===id)?id:'all');
  setDialog(current=>current?.id&&!state.extensions.some(e=>e.id===current.id)?null:current);
 },[state]);
 useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),3000);return()=>clearTimeout(timer)},[notice]);
 useEffect(()=>{const close=(event:PointerEvent)=>{if(!(event.target instanceof Element)||!event.target.closest('.context-menu,.row-actions'))setMenu(null)};document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close)},[]);
 useEffect(()=>{const close=(event:PointerEvent)=>{if(event.target instanceof Node){for(const ref of [tagMenu,groupMenu])if(!ref.current?.contains(event.target))ref.current?.removeAttribute('open')}};document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close)},[]);
 function open(value:DialogState){setDialog(value);setMenu(null);setName('');setError('')}
 function toggleTag(tag:string){setTagFilter(current=>current.some(t=>t.toLocaleLowerCase()===tag.toLocaleLowerCase())?current.filter(t=>t.toLocaleLowerCase()!==tag.toLocaleLowerCase()):[...current,tag])}
 function clear(){setGroup('all');setStatus('all');setQuery('');setTagFilter([]);setSelected([])}
 function submitName(event:React.FormEvent){event.preventDefault();const value=name.trim();if(!value||Array.from(value).length>50||value.toLowerCase()==='ungrouped'||state.groups.some(g=>g.name.toLowerCase()===value.toLowerCase())){setError(t('group.uniqueNameError'));return}dispatch({type:'createGroup',name:value});clear();setCollapsedGroups({});setDialog(null)}
 async function copy(id:string){try{await navigator.clipboard.writeText(id);setNotice(t('extension.idCopied'))}catch{setNotice(id)}setMenu(null)}
 const rows=filterExtensions(state.extensions,{group,status,query,tags:tagFilter});
 const filtered=Boolean(query.trim()||status!=='all'||tagFilter.length);
 const hasGroupSections=groupExtensions(state.groups,rows,group,filtered,query).length>0;
 const tags=availableTags(state.extensions);const options=[...tags,...tagFilter.filter(tag=>!tags.some(t=>t.toLocaleLowerCase()===tag.toLocaleLowerCase()))];
 const groupOptions=[{id:'all',name:t('filter.allGroups')},...state.groups,{id:'ungrouped',name:t('filter.ungrouped')}];
 const selectedGroupName=group==='all'?t('filter.allGroups'):group==='ungrouped'?t('filter.ungrouped'):state.groups.find(g=>g.id===group)?.name;
 const metrics=[['metric.all',state.extensions.length,'all'],['metric.visible',state.extensions.filter(e=>e.visibility==='Visible').length,'Visible'],['metric.notFound',state.extensions.filter(e=>e.visibility!=='Visible').length,'NotVisible']] as const;
 const unverifiedCount=state.extensions.filter(extension=>extension.visibility==='Unverified').length;
 const activeMetric=status;
 const ids=dialog?.ids??(dialog?.id?[dialog.id]:[]);
 const initialTags=ids.length===1?state.extensions.find(e=>e.id===ids[0])?.tags??[]:[];
 return <div className="app" onKeyDown={e=>{if(e.key==='Escape'){setMenu(null);for(const ref of [tagMenu,groupMenu])if(ref.current?.open){ref.current.removeAttribute('open');ref.current.querySelector('summary')?.focus()}}}}><main>
  <header className="dashboard-toolbar"><h1>{t('app.title')}</h1>
  <section className="metrics" aria-label={t('app.extensionOverview')}>{metrics.map(([label,count,key])=><button key={key} aria-pressed={activeMetric===key} className={`metric ${activeMetric===key?'metric-active':''}`} onClick={()=>{if(key==='all'){clear();return}setStatus(key);setSelected([])}}><span>{t(label)}</span><strong>{count}</strong></button>)}</section>
  <div className="toolbar-controls"><div className="filters">
   <button className="clear-filters" title={t('filter.clearAll')} aria-label={t('filter.clearAll')} onClick={clear}>{t('filter.clear')}</button>
   <input id="search" aria-label={t('app.searchAria')} placeholder={t('app.searchPlaceholder')} value={query} onChange={e=>setQuery(e.target.value)}/>
   <details ref={groupMenu} className="tag-filter group-filter"><summary aria-label={t('filter.groupAria')}><span className="menu-width-sizer" aria-hidden="true">{groupOptions.map(g=><span key={g.id}>{g.name}</span>)}</span><span className="filter-button-content"><span>{selectedGroupName}</span><ChevronDown size={12}/></span></summary><div className="tag-filter-options group-filter-options">{groupOptions.map(g=><button key={g.id} aria-pressed={group===g.id} onClick={()=>{setGroup(g.id);setSelected([]);groupMenu.current?.removeAttribute('open');groupMenu.current?.querySelector('summary')?.focus()}}><span>{g.name}</span>{group===g.id&&<Check size={13}/>}</button>)}</div></details>
   <details ref={tagMenu} className="tag-filter"><summary><span className="menu-width-sizer" aria-hidden="true">{[tagFilter.length?t('filter.tagsCount',{count:tagFilter.length}):t('filter.tags'),...options].map((label,index)=><span key={index}>{label}</span>)}</span><span className="filter-button-content"><Tag size={13}/><span className="filter-caption">{tagFilter.length?t('filter.tagsCount',{count:tagFilter.length}):t('filter.tags')}</span><ChevronDown size={12}/></span></summary><div className="tag-filter-options">{options.length?options.map(tag=><label key={tag}><input type="checkbox" checked={tagFilter.some(t=>t.toLocaleLowerCase()===tag.toLocaleLowerCase())} onChange={()=>toggleTag(tag)}/><span>{tag}</span></label>):<span>{t('filter.noTags')}</span>}</div></details>
  </div><div className="header-actions"><SortMenu label={t('sort.groups')} options={groupSortOptions} onSelect={value=>dispatch({type:'sortGroups',direction:value==='asc'?1:-1})}/><button aria-label={t('sort.expandAll')} title={t('sort.expandAll')} onClick={()=>setCollapsedGroups({})}><GroupExpansionIcon expand/></button><button aria-label={t('sort.collapseAll')} title={t('sort.collapseAll')} onClick={()=>setCollapsedGroups(Object.fromEntries([...state.groups.map(g=>g.id),'ungrouped'].map(id=>[id,true])))}><GroupExpansionIcon/></button><button aria-label={t('sort.twoColumns')} title={t('sort.twoColumns')} aria-pressed={twoColumns} className={twoColumns?'view-toggle active':'view-toggle'} onClick={()=>setTwoColumns(value=>!value)}><Columns2 size={15}/></button><button onClick={()=>open({kind:'create'})}><Plus size={15}/>{t('group.button')}</button>{isNative&&<button className="cleanup-unverified" disabled={!ready||state.readOnly||state.freshness!=='Ready'||unverifiedCount===0} title={t('cleanup.title')} onClick={cleanupUnverified}>{t('cleanup.button',{count:unverifiedCount})}</button>}</div></div></header>
  <section aria-label={t('app.organizedExtensions')}>
  {(selected.length>0||tagFilter.length>0)&&<div className="selection-bar"><span>{selected.length?t('filter.selected',{count:selected.length}):t('filter.filters')}</span>{tagFilter.map(tag=><button key={tag} className="tag-chip" aria-label={t('filter.clearTag',{tag})} onClick={()=>toggleTag(tag)}>{tag} ×</button>)}{selected.length>0&&<><button onClick={()=>open({kind:'tags',ids:[...selected]})}><Tag size={14}/>{t('filter.editTags')}</button></>}</div>}
  <DiscoveryStatus state={state} ready={ready} empty={rows.length===0} hasGroupSections={hasGroupSections} defaultVisible={status==='Visible'&&group==='all'&&!query.trim()&&!tagFilter.length} native={isNative} onClear={clear} onHistory={()=>{clear();setStatus('NotVisible')}} onRefresh={refresh} onRepair={repairData}/>
  {rows.length>0&&rows.every(extension=>extension.visibility!=='Visible')&&status==='all'&&<p className="history-notice">{t('history.notice')}</p>}
  <ExtensionCards onSortAction={dispatch} collapsedGroups={collapsedGroups} onToggleGroup={id=>setCollapsedGroups(current=>({...current,[id]:!current[id]}))} twoColumns={twoColumns} icons={icons} isNative={isNative} activeGroup={group} filtered={filtered} query={query} rows={rows} groups={state.groups} selected={selected} onSelect={setSelected} onDropExtensions={(ids,groupId,beforeId)=>{dispatch({type:'move',ids,groupId,beforeId});setSelected([])}} menu={menu} onMenu={setMenu} onOpenExtension={openExtension} onCopy={copy} onEditTags={id=>open({kind:'tags',id})} onFilterTag={toggleTag}/>
  </section></main>
  <footer><div className="discovery-summary"><span>{isNative?`${t('app.localHost')} · ${statusText(state.freshness)}${state.readOnly?` · ${t('status.readOnly')}`:''}`:t('app.demoSample')}</span>{isNative&&<LastScan value={state.lastSuccessfulAt}/>}</div><div>{isNative?<><button onClick={openExtensions}>{t('app.openExtensions')}</button><button onClick={refresh}>{t('app.refresh')}</button></>:<button onClick={()=>open({kind:'reset'})}>{t('app.resetDemo')}</button>}<span className={saved?'saved':'danger-text'}><Check size={14}/>{!ready?t('app.connecting'):state.freshness==='Error'?t('empty.discoveryFailed'):state.freshness==='Stale'?t('app.staleDiscovery'):state.error?t('app.attentionRequired'):state.readOnly?t('app.sessionOnly'):saved?t('app.saved'):t('app.saveFailed')}</span></div></footer>
  {(hostError||state.error||notice)&&<div className="toast" role="status">{hostError||state.error||notice}</div>}
  {dialog&&<Modal title={dialog.kind==='create'?t('group.new'):dialog.kind==='reset'?t('dialog.resetTitle'):t('dialog.editTagsTitle')} onClose={()=>setDialog(null)}>
   {dialog.kind==='create'&&<form onSubmit={submitName}><label>{t('group.name')}<input autoFocus value={name} onChange={e=>setName(e.target.value)} placeholder={t('group.placeholder')}/></label>{error&&<p className="danger-text" role="alert">{error}</p>}<div className="modal-actions"><button type="button" onClick={()=>setDialog(null)}>{t('dialog.cancel')}</button><button className="primary">{t('group.create')}</button></div></form>}
   {dialog.kind==='tags'&&<TagEditor initial={initialTags} suggestions={tags} count={ids.length} onCancel={()=>setDialog(null)} onSave={values=>{dispatch({type:'setTags',ids,tags:values});setDialog(null);setSelected([])}}/>}
   {dialog.kind==='reset'&&<><p>{t('dialog.restoreSample')}</p><div className="modal-actions"><button onClick={()=>setDialog(null)}>{t('dialog.cancel')}</button><button className="danger" onClick={()=>{dispatch({type:'reset'});setDialog(null);clear()}}>{t('app.resetDemo')}</button></div></>}
  </Modal>}
 </div>
}
