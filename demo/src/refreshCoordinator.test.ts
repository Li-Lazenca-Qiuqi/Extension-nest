import { afterEach, expect, it, vi } from 'vitest';
import { RefreshCoordinator } from '../../src/refreshCoordinator';

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(done => { resolve = done; });
  return { promise, resolve };
}
function queue() {
  let tail = Promise.resolve();
  return (work: () => Promise<void>) => {
    const next = tail.then(work);
    tail = next.catch(() => undefined);
    return next;
  };
}
afterEach(() => vi.useRealTimers());

it('排队前合并所有入口，手动刷新立即执行并取消去抖定时器', async () => {
  vi.useFakeTimers();
  const read = vi.fn(async () => {});
  const coordinator = new RefreshCoordinator(queue(), read);
  const requests = [coordinator.request(150), coordinator.request(150), coordinator.request(), coordinator.request()];
  await Promise.all(requests);
  await vi.advanceTimersByTimeAsync(200);
  expect(read).toHaveBeenCalledTimes(1);
});

it('扫描期间事件使旧结果失效，只补读一次，保存先于补读完成', async () => {
  const enqueue = queue(), gate = deferred(), started = deferred();
  const events: string[] = [];
  let runs = 0;
  let organization = 'before';
  const coordinator = new RefreshCoordinator(enqueue, async current => {
    runs++;
    if (runs === 1) { started.resolve(); await gate.promise; }
    if (current()) events.push(organization);
  });
  const first = coordinator.request();
  await started.promise;
  const save = enqueue(async () => { organization = 'saved'; });
  const requests = [coordinator.request(), coordinator.request(150), coordinator.request()];
  gate.resolve();
  await Promise.all([first, save, ...requests]);
  expect(runs).toBe(2);
  expect(events).toEqual(['saved']);
});

it('释放使运行中结果失效并清除待执行刷新', async () => {
  const gate = deferred(), started = deferred();
  const published: boolean[] = [];
  const coordinator = new RefreshCoordinator(queue(), async current => {
    started.resolve(); await gate.promise; published.push(current());
  });
  const request = coordinator.request();
  await started.promise;
  coordinator.dispose();
  await request;
  gate.resolve();
  await Promise.resolve();
  expect(published).toEqual([false]);
  await coordinator.request();
  expect(published).toHaveLength(1);
});

it('读操作失败不阻塞下一次请求，释放去抖请求不会执行', async () => {
  vi.useFakeTimers();
  const read = vi.fn().mockRejectedValueOnce(new Error('scan')).mockResolvedValue(undefined);
  const coordinator = new RefreshCoordinator(queue(), read);
  await expect(coordinator.request()).rejects.toThrow('scan');
  await coordinator.request();
  const pending = coordinator.request(150);
  coordinator.dispose();
  await pending;
  await vi.advanceTimersByTimeAsync(200);
  expect(read).toHaveBeenCalledTimes(2);
});
