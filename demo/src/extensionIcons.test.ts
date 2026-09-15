import { afterEach, expect, it, vi } from 'vitest';
const host=vi.hoisted(()=>({icon:'icon.png',missing:false,reads:0}));
vi.mock('vscode',()=>({
 extensions:{getExtension:()=>host.missing?undefined:{packageJSON:{icon:host.icon},extensionUri:'local'}},
 Uri:{joinPath:()=> 'local/icon.png'},
 workspace:{fs:{stat:async()=>({size:3}),readFile:async()=>{host.reads++;return new Uint8Array([1,2,3])}}}
}));
import { loadExtensionIcon } from '../../src/extensionIcons';
afterEach(()=>{host.icon='icon.png';host.missing=false;host.reads=0;vi.unstubAllGlobals()});

it('loads local icons and reuses the session cache',async()=>{
 vi.stubGlobal('fetch',()=>{throw new Error('Unexpected network request')});
 expect(await loadExtensionIcon('test.local')).toBe('data:image/png;base64,AQID');
 await loadExtensionIcon('test.local');
 expect(host.reads).toBe(1);
});
it('fetches a marketplace icon when the extension is not installed',async()=>{
 host.missing=true;
 vi.stubGlobal('fetch',async()=>new Response(new Uint8Array([1,2,3]),{headers:{'content-type':'image/png'}}));
 expect(await loadExtensionIcon('test.remote')).toBe('data:image/png;base64,AQID');
});
it('does not read an icon outside the extension directory',async()=>{
 host.icon='../outside.png';
 vi.stubGlobal('fetch',async()=>new Response('',{status:404}));
 expect(await loadExtensionIcon('test.traversal')).toBeUndefined();
 expect(host.reads).toBe(0);
});
it('falls back when the network fails',async()=>{
 host.missing=true;
 vi.stubGlobal('fetch',async()=>{throw new Error('Offline')});
 expect(await loadExtensionIcon('test.offline')).toBeUndefined();
});
it('rejects non-image responses',async()=>{
 host.missing=true;
 vi.stubGlobal('fetch',async()=>new Response('error',{headers:{'content-type':'text/html'}}));
 expect(await loadExtensionIcon('test.html')).toBeUndefined();
});
