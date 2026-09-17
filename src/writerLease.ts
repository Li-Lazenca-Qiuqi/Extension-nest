import { createHash } from 'node:crypto';
import { createServer, type Server } from 'node:net';

/** 应用存储目录级单写者，比 Profile 粒度更保守；不把该目录当 Profile 身份。 */
export class WriterLease {
  private server?: Server;
  private pending?: Promise<boolean>;
  private disposed = false;
  constructor(private readonly namespace: string) {}
  get owned(): boolean { return !!this.server; }
  acquire(): Promise<boolean> {
    if (this.disposed) return Promise.resolve(false);
    if (this.server) return Promise.resolve(true);
    if (this.pending) return this.pending;
    this.pending = new Promise<boolean>(resolve => {
      const hash = createHash('sha256').update(this.namespace).digest('hex');
      const server = createServer(socket => socket.destroy());
      server.once('error', () => { server.close(); resolve(false); });
      const ready = () => {
        if (this.disposed) { server.close(); resolve(false); return; }
        this.server = server; server.unref(); resolve(true);
      };
      if (process.platform === 'win32') server.listen(`\\\\.\\pipe\\extension-nest-${hash}`, ready);
      else server.listen({ host: '127.0.0.1', port: 20000 + Number.parseInt(hash.slice(0, 4), 16) % 40000 }, ready);
    }).finally(() => { this.pending = undefined; });
    return this.pending;
  }
  dispose(): void { this.disposed = true; this.server?.close(); this.server = undefined; }
}
