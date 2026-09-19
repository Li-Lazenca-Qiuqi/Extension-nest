import { useState } from 'react';
import { X } from 'lucide-react';
import { normalizeTags } from './tags';
import { t } from './uiI18n';
interface Props { initial:string[]; suggestions:string[]; count:number; onSave:(tags:string[])=>void; onCancel:()=>void }
/** 标签编辑只提交标签数组；批量编辑明确替换目标插件的标签。 */
export default function TagEditor({initial,suggestions,count,onSave,onCancel}:Props){
 const [tags,setTags]=useState(initial);const [input,setInput]=useState('');const [error,setError]=useState('');
 function add(values:string[]){try{setTags(normalizeTags([...tags,...values]));setInput('');setError('')}catch(e){setError(e instanceof Error?e.message:t('tags.invalid'))}}
 function save(){try{onSave(normalizeTags([...tags,...(input.trim()?input.split(','):[])]))}catch(e){setError(e instanceof Error?e.message:t('tags.invalid'))}}
 return <div className="tag-editor"><p>{t('tags.automaticHint')}</p>{count>1&&<p>{t('tags.replaceOn',{count})}</p>}<div className="tag-chips">{tags.map(tag=><button key={tag.toLocaleLowerCase()} onClick={()=>setTags(tags.filter(t=>t!==tag))} aria-label={t('tags.remove',{tag})}>{tag}<X size={12}/></button>)}</div><form onSubmit={e=>{e.preventDefault();add(input.split(','))}}><label htmlFor="tag-input">{t('tags.label')}</label><div className="tag-input-row"><input id="tag-input" autoFocus value={input} placeholder={t('tags.placeholder')} onChange={e=>setInput(e.target.value)}/><button type="submit">{t('tags.add')}</button></div></form>{suggestions.length>0&&<div className="tag-suggestions">{suggestions.filter(tag=>!tags.some(t=>t.toLocaleLowerCase()===tag.toLocaleLowerCase())).map(tag=><button key={tag} onClick={()=>add([tag])}>{tag}</button>)}</div>}{error&&<p className="danger-text" role="alert">{error}</p>}<div className="modal-actions"><button onClick={onCancel}>{t('dialog.cancel')}</button><button className="primary" onClick={save}>{t('tags.save')}</button></div></div>
}
