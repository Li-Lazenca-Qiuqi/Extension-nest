import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readJson=(name:string)=>JSON.parse(readFileSync(new URL(`../../${name}`,import.meta.url),'utf8'));

describe('manifest localization',()=>{
 it('provides English and Chinese text for every localized manifest entry',()=>{
  const manifest=readJson('package.json');
  const english=readJson('package.nls.json');
  const chinese=readJson('package.nls.zh-cn.json');
  const references=[...JSON.stringify(manifest).matchAll(/%([^%]+)%/g)].map(match=>match[1]);
  expect(references.length).toBeGreaterThan(20);
  expect(Object.keys(chinese).sort()).toEqual(Object.keys(english).sort());
  expect(readJson('package.nls.zh.json')).toEqual(chinese);
  for(const key of references){
   expect(english[key],key).toBeTypeOf('string');
   expect(chinese[key],key).toMatch(/[\u3400-\u9fff]/);
  }
  for(const command of manifest.contributes.commands)expect(command.title).toMatch(/^%command\..+%$/);
 });
});
