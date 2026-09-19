import type { Extension,Group } from './models';
export interface ExtensionSection { id:string; name:string; extensions:Extension[] }
/** 按用户组顺序展示卡片，未分组固定置后；筛选时隐藏无匹配的组，但保留明确选中或组名命中的空分区。 */
export function groupExtensions(groups:Group[],extensions:Extension[],activeGroup='all',filtered=false,query=''):ExtensionSection[]{
 const sections:ExtensionSection[]=groups.map(group=>({id:group.id,name:group.name,extensions:[]}));
 sections.push({id:'ungrouped',name:'Ungrouped',extensions:[]});
 const byId=new Map(sections.map(section=>[section.id,section]));
 for(const extension of extensions){byId.get(extension.groupId??'ungrouped')?.extensions.push(extension)}
 const groupQuery=query.trim().toLocaleLowerCase();
 return sections.filter(section=>(activeGroup==='all'||section.id===activeGroup)&&(!filtered||section.extensions.length>0||section.id===activeGroup||Boolean(groupQuery&&section.name.toLocaleLowerCase().includes(groupQuery))));
}
