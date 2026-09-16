import { beforeEach, expect, it, vi } from 'vitest';
import { seedState } from './seed';
const native=vi.hoisted(()=>({calls:[] as unknown[][],fail:false,failSearch:false,choice:undefined as string|undefined,showErrorMessage:vi.fn()}));
vi.mock('vscode',()=>({commands:{executeCommand:async(...args:unknown[])=>{native.calls.push(args);if((native.fail && args[0]==='extension.open') || native.failSearch)throw new Error('Unavailable')}},window:{showErrorMessage:native.showErrorMessage}}));
import { openNativeExtension } from '../../src/nativeExtensions';
beforeEach(()=>{native.calls=[];native.fail=false;native.failSearch=false;native.choice=undefined;native.showErrorMessage.mockReset();native.showErrorMessage.mockImplementation(async()=>native.choice)});

it('opens the exact known extension ID with the fixed native command',async()=>{
 await openNativeExtension('ms-python.python',seedState);
 expect(native.calls).toEqual([['extension.open','ms-python.python']]);
});
it.each(['unknown.extension','command:workbench.action.closeWindow',null,{},'ms-python.python extra'])('rejects invalid or unknown target %s',async id=>{
 await expect(openNativeExtension(id,seedState)).rejects.toThrow('Invalid extension ID');
 expect(native.calls).toEqual([]);
});
it('原生页失败时提供恢复入口，取消不执行额外命令',async()=>{
 native.fail=true;
 await openNativeExtension('ms-python.python',seedState);
 expect(native.showErrorMessage).toHaveBeenCalledWith(expect.stringContaining('ms-python.python'),'在 VS Code 中查找');
 expect(native.calls).toEqual([['extension.open','ms-python.python']]);
});
it('选择恢复入口后使用固定搜索命令与已验证 ID',async()=>{
 native.fail=true;native.choice='在 VS Code 中查找';
 await openNativeExtension('ms-python.python',seedState);
 expect(native.calls).toEqual([['extension.open','ms-python.python'],['workbench.extensions.search','@id:ms-python.python']]);
});
it('恢复命令失败仍传播错误供宿主报告',async()=>{
 native.fail=true;native.failSearch=true;native.choice='在 VS Code 中查找';
 await expect(openNativeExtension('ms-python.python',seedState)).rejects.toThrow('Unavailable');
});


