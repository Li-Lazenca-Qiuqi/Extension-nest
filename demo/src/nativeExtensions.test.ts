import { beforeEach, expect, it, vi } from 'vitest';
import { seedState } from './seed';
const native=vi.hoisted(()=>({calls:[] as unknown[][],fail:false}));
vi.mock('vscode',()=>({commands:{executeCommand:async(...args:unknown[])=>{native.calls.push(args);if(native.fail)throw new Error('Unavailable')}}}));
import { openNativeExtension } from '../../src/nativeExtensions';
beforeEach(()=>{native.calls=[];native.fail=false});

it('opens the exact known extension ID with the fixed native command',async()=>{
 await openNativeExtension('ms-python.python',seedState);
 expect(native.calls).toEqual([['extension.open','ms-python.python']]);
});
it.each(['unknown.extension','command:workbench.action.closeWindow',null,{},'ms-python.python extra'])('rejects invalid or unknown target %s',async id=>{
 await expect(openNativeExtension(id,seedState)).rejects.toThrow('Invalid extension ID');
 expect(native.calls).toEqual([]);
});
it('propagates native command failures for the dashboard error message',async()=>{
 native.fail=true;
 await expect(openNativeExtension('ms-python.python',seedState)).rejects.toThrow('Unavailable');
});


