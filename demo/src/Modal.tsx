import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { t } from './uiI18n';
/** 原生模态框管理焦点，支持鼠标关闭和 Escape 取消。 */
export default function Modal({title,children,onClose}:{title:string;children:ReactNode;onClose:()=>void}) {
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{ref.current?.showModal();return()=>ref.current?.close()},[]);
 return <dialog ref={ref} onCancel={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose()}}><header><h2>{title}</h2><button className="icon-button" aria-label={t('dialog.close')} onClick={onClose}><X size={20}/></button></header>{children}</dialog>
}
