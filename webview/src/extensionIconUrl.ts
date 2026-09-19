/** 图标资源使用完整 ID 查询最新版，避免示例版本过旧导致资源不存在。 */
export function marketplaceIconUrl(id:string):string|undefined {
 if(!/^[a-z0-9][a-z0-9-]*\.[a-z0-9][a-z0-9-]*$/i.test(id))return;
 const [publisher,name]=id.split('.');
 return `https://marketplace.visualstudio.com/_apis/public/gallery/publisher/${publisher}/extension/${name}/latest/assetbyname/Microsoft.VisualStudio.Services.Icons.Default`;
}
