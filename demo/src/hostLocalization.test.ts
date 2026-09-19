import { afterEach, expect, it } from 'vitest';
import { env } from '../test/vscodeMock';
import { HOST_MESSAGES, t } from '../../src/i18n';
import { DemoGroupNode, DemoTreeProvider } from '../../src/demoTree';
import { seedState } from './seed';

afterEach(()=>{env.language='en'});

it('uses the VS Code language and falls back to English for unsupported locales',()=>{
 env.language='zh-cn';expect(t('Not found')).toBe('未发现');
 env.language='en';expect(t('Not found')).toBe('Not found');
 env.language='fr';expect(t('Not found')).toBe('Not found');
});

it('keeps dynamic values literal and preserves every template parameter',()=>{
 for(const [key,message] of Object.entries(HOST_MESSAGES)){
  const english=t(key as keyof typeof HOST_MESSAGES,{},'en');
  const chinese=t(key as keyof typeof HOST_MESSAGES,{},'zh-cn');
  expect(english).toBe(message.en);
  expect(chinese.length).toBeGreaterThan(0);
  const placeholders=(text:string)=>[...text.matchAll(/\{([\w]+)\}/g)].map(match=>match[1]).sort();
  expect(placeholders(chinese),key).toEqual(placeholders(english));
 }
 const id='vendor.$&<extension>';
 expect(t("Unable to open extension {id}'s native page. Find it in the VS Code Extensions view.",{id},'zh-cn')).toContain(id);
});

it('localizes the virtual Ungrouped label without changing custom group names or IDs',()=>{
 const snapshot=structuredClone(seedState);
 env.language='zh-cn';
 const tree=new DemoTreeProvider(snapshot,async()=>{});
 const nodes=tree.getChildren().filter((node):node is DemoGroupNode=>node instanceof DemoGroupNode);
 expect(nodes).toHaveLength(snapshot.groups.length+1);
 expect(nodes.at(-1)?.label).toBe('未分组');
 expect(nodes[0].label).toBe(snapshot.groups[0].name);
 expect(snapshot).toEqual(seedState);
 tree.dispose();
});
