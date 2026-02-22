import { computed, makeObservable, observable } from 'mobx';

type CB = () => void;

export class CancellablePromise<T> extends Promise<T> {
  constructor(
    executor: (
      resolve: (value: T) => void,
      reject: (reason?: any) => void,
    ) => void,
    public cancel: () => unknown,
  ) {
    super(executor);
  }
}

export const cancellingToken = Symbol();

/**
 * A simple semaphore implementation to control concurrency.
 * Limits the number of concurrent tasks that can run simultaneously.
 */
export class Semaphore {
  private current = 0;
  private queue: { resolve: CB; reject: CB }[] = [];

  /**
   * Creates a new instance of the Semaphore.
   *
   * @param concurrency - The maximum number of concurrent tasks allowed.
   */
  constructor(private concurrency: number) {
    makeObservable<Semaphore, 'current'>(this, {
      current: observable,
      isBusy: computed,
    });
  }

  public get isBusy() {
    return this.current > 0;
  }

  /**
   * Acquires a permit to run a task.
   *
   * If the number of currently acquired permits is less than the concurrency limit,
   * the promise resolves immediately. Otherwise, it is queued until a permit is released.
   *
   * @returns A promise that resolves when the permit has been acquired.
   */
  public async acquire(): Promise<void> {
    if (this.current < this.concurrency) {
      this.current++;
      return Promise.resolve();
    }

    let resolver: any = null;
    let rejecter: any = null;
    return new CancellablePromise<void>(
      (resolve, reject) => {
        resolver = resolve;
        rejecter = reject;
        this.queue.push({ resolve, reject });
      },
      () => {
        this.queue = this.queue.filter((c) => c.resolve !== resolver);
        rejecter(cancellingToken);
      },
    );
  }

  clear() {
    this.queue.forEach((c) => c.reject());
    this.queue.splice(0);
  }

  /**
   * Releases a previously acquired permit.
   *
   * If there are queued tasks waiting for a permit, the next one is dequeued and allowed to proceed.
   */
  public release() {
    this.current = Math.max(0, this.current - 1);
    this.queue.shift()?.resolve();
  }
}
