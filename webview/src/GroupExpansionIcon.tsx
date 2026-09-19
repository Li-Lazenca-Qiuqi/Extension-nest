/** 叠层方框表达批量分组，正负号分别表示展开和收起。 */
export default function GroupExpansionIcon({expand=false}:{expand?:boolean}){
 return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
  <path d="M3.5 10.5h-1a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v1"/>
  <rect x="5" y="5" width="9.5" height="9.5" rx="1"/>
  <path d="M7.5 9.75H12"/>
  {expand&&<path d="M9.75 7.5V12"/>}
 </svg>;
}
