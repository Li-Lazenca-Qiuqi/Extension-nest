import type { Extension } from './models';
import { displayTags } from './tags';
export interface ExtensionFilters { group:string; status:string; query:string; tags:string[] }
/** 标签不改变归属；多个标签、组、状态与搜索条件取交集。 */
export function filterExtensions(extensions:Extension[],filters:ExtensionFilters):Extension[] {
  const query=filters.query.trim().toLocaleLowerCase();
  const tags=filters.tags.map(tag=>tag.toLocaleLowerCase());
  return extensions.filter(extension=>{
    const ownTags=displayTags(extension).map(tag=>tag.toLocaleLowerCase());
    return (filters.group==='all'||(filters.group==='ungrouped'?extension.groupId===null:extension.groupId===filters.group))
      &&(filters.status==='all'||(filters.status==='NotVisible'?extension.visibility!=='Visible':extension.visibility===filters.status))
      &&tags.every(tag=>ownTags.includes(tag))
      &&`${extension.name} ${extension.publisher} ${extension.id} ${ownTags.join(' ')}`.toLocaleLowerCase().includes(query);
  });
}
/** 从当前插件的标签中汇总筛选选项，大小写不敏感且保持展示名称。 */
export function availableTags(extensions:Extension[]):string[]{
 const names=new Map<string,string>();
 for(const extension of extensions)for(const tag of displayTags(extension))if(!names.has(tag.toLocaleLowerCase()))names.set(tag.toLocaleLowerCase(),tag);
 return [...names.values()].sort((a,b)=>a.localeCompare(b));
}
