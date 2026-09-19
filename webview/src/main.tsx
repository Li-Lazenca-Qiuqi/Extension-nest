import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { t } from './uiI18n';
import './styles.css';

// 独立浏览器预览使用浏览器语言；VS Code Webview 的宿主语言由宿主注入并保持不变。
if (typeof window !== 'undefined' && !window.acquireVsCodeApi) {
 const currentLanguage=document.documentElement.lang.trim().toLowerCase();
 if(!currentLanguage||currentLanguage==='en'){
  const browserLanguage=typeof navigator!=='undefined'&&typeof navigator.language==='string'?navigator.language.trim():'';
  if(browserLanguage)document.documentElement.lang=browserLanguage;
 }
 document.title=t('app.browserTitle');
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
