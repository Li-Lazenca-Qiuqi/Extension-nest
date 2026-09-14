import type { Extension,Group } from './models';
export interface ExtensionSection { id:string; name:string; extensions:Extension[] }
/** 按用户组顺序展示卡片，未分组固定置后；筛选时隐藏无匹配的其他组。 */
export function groupExtensions(groups:Group[],extensions:Extension[],activeGroup='all',filtered=false):ExtensionSection[]{
 const sections:ExtensionSection[]=groups.map(group=>({id:group.id,name:group.name,extensions:[]}));
 sections.push({id:'ungrouped',name:'Ungrouped',extensions:[]});
 const byId=new Map(sections.map(section=>[section.id,section]));
 for(const extension of extensions){byId.get(extension.groupId??'ungrouped')?.extensions.push(extension)}
 return sections.filter(section=>(activeGroup==='all'||section.id===activeGroup)&&(!filtered||section.extensions.length>0));
}
