import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect,it } from 'vitest';
import ExtensionCards from './ExtensionCards';
import { seedState } from './seed';
/** 防止默认界面退回只有组名字段、没有分区的平铺卡片。 */
it('renders default group sections expanded with exactly one card per extension',()=>{
 const noop=()=>{};
 const html=renderToStaticMarkup(createElement(ExtensionCards,{activeGroup:'all',filtered:false,rows:seedState.extensions,groups:seedState.groups,selected:[],menu:null,onSelect:noop,onDropExtensions:noop,onMenu:noop,onToggle:noop,onUpdate:noop,onEditTags:noop,onFilterTag:noop,onOpenExtension:noop,onCopy:noop}));
 expect((html.match(/<details[^>]*data-group-section=/g)||[])).toHaveLength(5);
 expect((html.match(/<details[^>]*open=""/g)||[])).toHaveLength(5);
 expect((html.match(/<article /g)||[])).toHaveLength(14);
 for(const name of ['AI Coding','Python &amp; Data','Web Development','Writing','Ungrouped'])expect(html).toContain(`<summary><span>${name}</span>`);
});
