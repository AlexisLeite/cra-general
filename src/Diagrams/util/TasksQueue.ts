import { Mutex } from './Mutex';

export type Task<T> = () => Promise<T>;

export class TasksQueue {
  private mutex = new Mutex();

  public get isBusy() {
    return this.mutex.isBusy;
  }

  clear() {
    this.mutex.clear();
  }

  async run<T>(task: Task<T>): Promise<T | undefined> {
    return await this.mutex.runExclusive<T>(async () => {
      return await task();
    });
  }
}
