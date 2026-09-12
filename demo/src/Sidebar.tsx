/** 请求扩展宿主聚焦真实 VS Code 分组视图，不渲染网页侧边栏。 */
export function showNativeGroups(postMessage:(message:unknown)=>void):void {
  postMessage({type:'showGroups'});
}
