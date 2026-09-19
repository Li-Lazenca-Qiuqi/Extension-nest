/** 原生树和 Dashboard 共用内部拖放格式，不使用通用文本作为指令。 */
export const EXTENSION_DRAG_MIME='application/vnd.extension-nest.extension';
/** 读取内部插件 ID 载荷；全部 ID 必须合法，不能部分执行损坏载荷。 */
export function parseDraggedIds(value:string):string[]|undefined{
 try{const payload=JSON.parse(value);if(!payload||!Array.isArray(payload.ids)||!payload.ids.length||payload.ids.length>1000||!payload.ids.every((id:unknown)=>typeof id==='string'&&id.trim().length>0))return;return [...new Set<string>(payload.ids)]}catch{return}
}
