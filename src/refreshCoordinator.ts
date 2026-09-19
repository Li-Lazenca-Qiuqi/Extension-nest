/** 所有刷新入口共享一个合并器；工作仍进入宿主写队列，与组织保存串行。 */
export class RefreshCoordinator {
  private revision = 0;
  private disposed = false;
  private queued = false;
  private running = false;
  private timer?: ReturnType<typeof setTimeout>;
  private waiters: Array<{ resolve: () => void; reject: (error: unknown) => void }> = [];

  constructor(private readonly enqueue: (work: () => Promise<void>) => Promise<void>,
    private readonly read: (current: () => boolean) => Promise<void>) {}

  request(delay = 0): Promise<void> {
    if (this.disposed) return Promise.resolve();
    this.revision++;
    const promise = new Promise<void>((resolve, reject) => this.waiters.push({ resolve, reject }));
    if (!this.running && !this.queued) {
      if (this.timer) clearTimeout(this.timer);
      this.timer = undefined;
      if (delay) this.timer = setTimeout(() => { this.timer = undefined; this.queue(); }, delay);
      else this.queue();
    }
    return promise;
  }

  dispose(): void {
    this.disposed = true;
    this.revision++;
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    for (const waiter of this.waiters.splice(0)) waiter.resolve();
  }

  private queue(): void {
    if (this.disposed || this.queued) return;
    this.queued = true;
    void this.enqueue(async () => {
      this.queued = false;
      if (this.disposed) return;
      this.running = true;
      const revision = this.revision;
      let error: unknown;
      let failed = false;
      try { await this.read(() => !this.disposed && revision === this.revision); }
      catch (reason) { failed = true; error = reason; }
      finally { this.running = false; }
      if (this.disposed) return;
      if (revision !== this.revision) { this.queue(); return; }
      for (const waiter of this.waiters.splice(0)) {
        if (failed) waiter.reject(error); else waiter.resolve();
      }
    }).catch(error => {
      this.queued = false;
      for (const waiter of this.waiters.splice(0)) waiter.reject(error);
    });
  }
}
