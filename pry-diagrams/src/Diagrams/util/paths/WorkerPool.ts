// WorkerPool.ts
type Task = {
  payload: any;
  resolve: (value: any) => void;
  timeoutId?: ReturnType<typeof setTimeout>;
};

export class WorkerPool<T, R> {
  private workers: Worker[] = [];
  private idle: Worker[] = [];
  private queue: Task[] = [];
  private disabled = false;
  private warned = false;

  constructor(
    size: number,
    private readonly createWorker: () => Worker,
    private readonly taskTimeoutMs: number | null = null,
  ) {
    for (let i = 0; i < size; i++) {
      try {
        this.attachWorker(this.createWorker());
      } catch (error) {
        this.disablePool(error);
        break;
      }
    }
  }

  exec(payload: T): Promise<R> {
    if (this.disabled || this.workers.length === 0) {
      return Promise.resolve(null as R);
    }

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
    if (this.taskTimeoutMs !== null && this.taskTimeoutMs > 0) {
      task.timeoutId = setTimeout(() => {
        const currentTask = (worker as any)._task as Task | null;
        if (currentTask !== task) {
          return;
        }

        (worker as any)._task = null;
        task.resolve(null);
        this.idle.push(worker);
        this.runNext();
      }, this.taskTimeoutMs);
    }

    try {
      worker.postMessage(task.payload);
    } catch (error) {
      this.clearTaskTimeout(task);
      (worker as any)._task = null;
      task.resolve(null);
      this.handleWorkerFailure(worker, error);
      this.runNext();
    }
  }

  private attachWorker(worker: Worker) {
    worker.addEventListener('message', (e) => {
      const task = (worker as any)._task as Task | null;
      if (!task) {
        return;
      }

      this.clearTaskTimeout(task);
      task.resolve(e.data);
      (worker as any)._task = null;

      if (!this.disabled) {
        this.idle.push(worker);
      }
      this.runNext();
    });

    const onFailure = (error: unknown) => {
      const task = (worker as any)._task as Task | null;
      if (task) {
        this.clearTaskTimeout(task);
        task.resolve(null);
        (worker as any)._task = null;
      }
      this.handleWorkerFailure(worker, error);
      this.runNext();
    };

    worker.addEventListener('error', onFailure as EventListener);
    worker.addEventListener('messageerror', onFailure as EventListener);

    this.workers.push(worker);
    this.idle.push(worker);
  }

  private clearTaskTimeout(task: Task) {
    if (task.timeoutId !== undefined) {
      clearTimeout(task.timeoutId);
      task.timeoutId = undefined;
    }
  }

  private handleWorkerFailure(worker: Worker, error: unknown) {
    this.workers = this.workers.filter((w) => w !== worker);
    this.idle = this.idle.filter((w) => w !== worker);
    try {
      worker.terminate();
    } catch {
      // ignore
    }

    if (this.workers.length === 0) {
      this.disablePool(error);
    }
  }

  private disablePool(error: unknown) {
    if (!this.warned) {
      this.warned = true;
      if (error instanceof ErrorEvent) {
        console.warn(
          '[pry-diagrams] Pathfinding worker disabled, falling back to direct edge paths.',
          {
            message: error.message,
            filename: error.filename,
            lineno: error.lineno,
            colno: error.colno,
            error: String(error.error),
          },
        );
      } else {
        console.warn('[pry-diagrams] Pathfinding worker disabled, falling back to direct edge paths.', error);
      }
    }

    this.disabled = true;
    for (const worker of this.workers.splice(0)) {
      try {
        worker.terminate();
      } catch {
        // ignore
      }
    }
    this.idle = [];

    for (const task of this.queue.splice(0)) {
      this.clearTaskTimeout(task);
      task.resolve(null);
    }
  }
}
