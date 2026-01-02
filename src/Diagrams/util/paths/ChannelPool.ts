export class ChannelPool {
  private free: MessagePort[] = [];
  private busy = new Set<MessagePort>();

  constructor(size: number) {
    for (let i = 0; i < size; i++) {
      const { port1, port2 } = new MessageChannel();
      this.free.push(port1);
      this.workerPorts.push(port2);
    }
  }

  readonly workerPorts: MessagePort[] = [];

  acquire(): MessagePort | null {
    const port = this.free.pop();
    if (!port) return null;

    this.busy.add(port);
    return port;
  }

  release(port: MessagePort) {
    if (!this.busy.has(port)) return;

    this.busy.delete(port);
    this.free.push(port);
  }
}
