import { beforeEach, expect, it, vi } from 'vitest';
import { seedState } from '../test/extensionFixture';
const native=vi.hoisted(()=>({calls:[] as unknown[][],fail:false,failManage:false,wait:undefined as Promise<void>|undefined,failSearch:false,choice:undefined as string|undefined,showErrorMessage:vi.fn()}));
vi.mock('vscode',()=>({env:{language:'en'},commands:{executeCommand:async(...args:unknown[])=>{native.calls.push(args);if(args[0]==='_extensions.manage'){if(native.failManage||native.fail)throw new Error('Unavailable');await native.wait;}if((native.fail && args[0]==='extension.open') || native.failSearch)throw new Error('Unavailable')}},window:{showErrorMessage:native.showErrorMessage}}));
import { openNativeExtension } from '../../src/nativeExtensions';
it('快速路径不可用时回退商店入口',async()=>{
 native.failManage=true;
 await expect(openNativeExtension('ms-python.python',seedState)).resolves.toBe('Opened');
 expect(native.calls).toEqual([['_extensions.manage','ms-python.python'],['extension.open','ms-python.python']]);
 expect(native.showErrorMessage).not.toHaveBeenCalled();
});
it('合并未完成的同 ID 导航，完成后允许再次打开',async()=>{
 let release!:()=>void;
 native.wait=new Promise<void>(resolve=>{release=resolve});
 const first=openNativeExtension('ms-python.python',seedState);
 const second=openNativeExtension('ms-python.python',seedState);
 expect(native.calls).toHaveLength(1);
 release();
 await expect(Promise.all([first,second])).resolves.toEqual(['Opened','Opened']);
 await openNativeExtension('ms-python.python',seedState);
 expect(native.calls).toHaveLength(2);
});
beforeEach(()=>{native.calls=[];native.fail=false;native.failManage=false;native.wait=undefined;native.failSearch=false;native.choice=undefined;native.showErrorMessage.mockReset();native.showErrorMessage.mockImplementation(async()=>native.choice)});

it('直接打开已知扩展，不先查询商店',async()=>{
 await expect(openNativeExtension('ms-python.python',seedState)).resolves.toBe('Opened');
 expect(native.calls).toEqual([['_extensions.manage','ms-python.python']]);
});
it.each(['unknown.extension','command:workbench.action.closeWindow',null,{},'ms-python.python extra'])('rejects invalid or unknown target %s',async id=>{
 await expect(openNativeExtension(id,seedState)).rejects.toThrow('Invalid extension ID');
 expect(native.calls).toEqual([]);
});
it('原生页失败时提供恢复入口，取消不执行额外命令',async()=>{
 native.fail=true;
 await openNativeExtension('ms-python.python',seedState);
 expect(native.showErrorMessage).toHaveBeenCalledWith(expect.stringContaining('ms-python.python'),'Find in VS Code');
 expect(native.calls).toEqual([['_extensions.manage','ms-python.python'],['extension.open','ms-python.python']]);
});
it('选择恢复入口后使用固定搜索命令与已验证 ID',async()=>{
 native.fail=true;native.choice='Find in VS Code';
 await openNativeExtension('ms-python.python',seedState);
 expect(native.calls).toEqual([['_extensions.manage','ms-python.python'],['extension.open','ms-python.python'],['workbench.extensions.search','@id:ms-python.python']]);
});
it('恢复命令失败返回明确 Failed',async()=>{
 native.fail=true;native.failSearch=true;native.choice='Find in VS Code';
 await expect(openNativeExtension('ms-python.python',seedState)).resolves.toBe('Failed');
});


