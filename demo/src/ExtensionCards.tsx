import { MoreHorizontal, ArrowUp, Power, Tag, FolderInput, Copy } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { Extension, Group } from './models';
import ExtensionIcon from './ExtensionIcon';
import { marketplaceIconUrl } from './extensionIconUrl';
import { groupExtensions } from './groupExtensions';
import { groupCssColor } from './groupColors';
import { useCardDrag } from './useCardDrag';
import { EXTENSION_DRAG_MIME, parseDraggedIds } from './dragPayload';
interface Props { icons?:Record<string,string>; isNative?:boolean; activeGroup:string; filtered:boolean; rows:Extension[]; groups:Group[]; selected:string[]; onSelect:(ids:string[])=>void; onDropExtensions:(ids:string[],groupId:string|null)=>void; menu:string|null; onMenu:(id:string|null)=>void; onToggle:(id:string)=>void; onUpdate:(id:string)=>void; onEditTags:(id:string)=>void; onFilterTag:(tag:string)=>void; onMove:(id:string)=>void; onOpenExtension:(id:string)=>void; onCopy:(id:string)=>void }
/** 以紧凑卡片展示插件，保留鼠标选择、移组和管理操作。 */
export default function ExtensionCards(p:Props) {
 const drag=useCardDrag(p.onDropExtensions,()=>p.onMenu(null));
 const sections=groupExtensions(p.groups,p.rows,p.activeGroup,p.filtered);
 const select=(id:string,additive:boolean)=>p.onSelect(additive?(p.selected.includes(id)?p.selected.filter(value=>value!==id):[...p.selected,id]):[id]);
 const groupStyle=(id:string)=>({'--group-color':groupCssColor(p.groups.find(group=>group.id===id)?.color)} as CSSProperties);
 return <div className="cards-region">
 {sections.map(section=><details className={`extension-section${drag.targetGroup===section.id?' is-drop-target':''}`} style={groupStyle(section.id)} key={section.id} open data-group-section={section.id}
 onDragOver={event=>{if(Array.from(event.dataTransfer.types).includes(EXTENSION_DRAG_MIME)){event.preventDefault();event.dataTransfer.dropEffect='move'}}}
 onDrop={event=>{event.preventDefault();event.stopPropagation();const ids=parseDraggedIds(event.dataTransfer.getData(EXTENSION_DRAG_MIME));if(ids)p.onDropExtensions(ids,section.id==='ungrouped'?null:section.id)}}><summary><span>{section.name}</span><small>{section.extensions.length}</small></summary><div className="extension-grid">{section.extensions.map(ext=><article key={ext.id} data-extension={ext.id} aria-label={ext.name} draggable={false} onDragStart={event=>event.preventDefault()}
 tabIndex={0} onKeyDown={event=>{if(event.target===event.currentTarget&&(event.key===' '||event.key==='Enter')){event.preventDefault();select(ext.id,event.ctrlKey||event.metaKey)}}}
 onClickCapture={event=>{
  if(drag.consumeClick()){event.preventDefault();event.stopPropagation();return}
  const control=(event.target as Element).closest('button,input,select,a,[role="menuitem"]');
  if(control&&!control.classList.contains('extension-name'))return;
  select(ext.id,event.ctrlKey||event.metaKey);
  if(event.ctrlKey||event.metaKey){event.preventDefault();event.stopPropagation()}
 }} style={groupStyle(section.id)} onPointerDown={event=>drag.begin(event,p.selected.includes(ext.id)?p.selected:[ext.id])} className={`extension-card ${drag.activeIds.includes(ext.id)?'is-dragging':''} ${!ext.enabled?'is-disabled':''} ${p.selected.includes(ext.id)?'selected':''} ${p.menu===ext.id?'menu-open':''}`} onContextMenu={e=>{e.preventDefault();p.onMenu(ext.id)}}>
 <div className="card-heading"><button className="extension-name extension-icon" aria-label={`Open ${ext.name} in VS Code`} title="Open in VS Code" onClick={()=>p.onOpenExtension(ext.id)}><ExtensionIcon key={p.icons?.[ext.id]??ext.id} extension={ext} src={p.icons?.[ext.id]??(!p.isNative?marketplaceIconUrl(ext.id):undefined)}/></button><div className="extension-identity"><button className="extension-name extension-title" title={`Open ${ext.name} in VS Code`} onClick={()=>p.onOpenExtension(ext.id)}><strong>{ext.name}</strong></button><small>{ext.publisher}</small></div><div className="row-actions"><button className="icon-button" aria-label={`Manage ${ext.name}`} aria-expanded={p.menu===ext.id} onClick={()=>p.onMenu(p.menu===ext.id?null:ext.id)}><MoreHorizontal size={18}/></button>
 {p.menu===ext.id&&<div className="context-menu" role="menu" aria-label={`${ext.name} actions`}><button role="menuitem" onClick={()=>p.onMove(ext.id)}><FolderInput size={14}/>Move to group</button><button role="menuitem" onClick={()=>p.onToggle(ext.id)}><Power size={14}/>{ext.enabled?'Disable':'Enable'}</button>{ext.update&&<button role="menuitem" onClick={()=>p.onUpdate(ext.id)}><ArrowUp size={14}/>Update</button>}<button role="menuitem" onClick={()=>p.onCopy(ext.id)}><Copy size={14}/>Copy ID</button><button role="menuitem" onClick={()=>p.onEditTags(ext.id)}><Tag size={14}/>Edit tags</button></div>}</div></div>
 <div className="card-bottom"><button className={`status ${ext.enabled?'enabled':''}`} aria-label={`${ext.enabled?'Disable':'Enable'} ${ext.name}`} title={ext.enabled?'Disable extension':'Enable extension'} onClick={()=>p.onToggle(ext.id)}>{ext.enabled?'Enabled':'Disabled'}</button>{ext.tags.length>0&&<div className="card-tags">{ext.tags.map(tag=><button key={tag.toLocaleLowerCase()} className="tag-chip" title={`Filter by ${tag}`} onClick={()=>p.onFilterTag(tag)}><Tag size={10} aria-hidden="true" style={{flexShrink:0}}/>{tag}</button>)}</div>}<div className="version-actions">{ext.update&&<button className="update" aria-label={`Update ${ext.name}`} title={`Update to ${ext.update}`} onClick={()=>p.onUpdate(ext.id)}><ArrowUp size={13}/></button>}<span className="version">{ext.version}</span></div></div>

 </article>)}</div>{section.extensions.length===0&&<div className="group-empty">No extensions</div>}</details>)}{sections.length===0&&<div className="empty">No extensions</div>}</div>
}
