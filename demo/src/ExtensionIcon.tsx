import { useState } from 'react';
import type { Extension } from './models';

/** 图片失败时保留原来的字母占位，图标尺寸不会随加载结果变化。 */
export default function ExtensionIcon({extension,src}:{extension:Extension;src?:string}){
 const [failed,setFailed]=useState(false);
 return src&&!failed?<img className="extension-logo" src={src} alt="" draggable={false} onError={()=>setFailed(true)}/>:<span className="monogram" style={{background:extension.color}}>{extension.monogram}</span>;
}
