// WorkerPool.ts
type Task = {
  payload: any;
  resolve: (value: any) => void;
};

export class WorkerPool<T, R> {
  private workers: Worker[] = [];
  private idle: Worker[] = [];
  private queue: Task[] = [];

  constructor(size: number, workerUrl: URL) {
    for (let i = 0; i < size; i++) {
      const worker = new Worker(workerUrl, { type: 'module' });

      worker.addEventListener('message', (e) => {
        const task = (worker as any)._task as Task;

        task.resolve(e.data);
        (worker as any)._task = null;
        this.idle.push(worker);
        this.runNext();
      });

      this.workers.push(worker);
      this.idle.push(worker);
    }
  }

  exec(payload: T): Promise<R> {
    return new Promise((resolve) => {
      this.queue.push({
        payload,
        resolve,
      });

      this.runNext();
    });
  }

  private runNext() {
    if (!this.idle.length || !this.queue.length) return;

    const worker = this.idle.pop()!;
    const task = this.queue.shift()!;

    (worker as any)._task = task;
    worker.postMessage(task.payload);
  }
}
