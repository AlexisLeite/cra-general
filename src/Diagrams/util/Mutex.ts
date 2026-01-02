import { cancellingToken, Semaphore } from './Semaphore';

export class Mutex extends Semaphore {
  constructor() {
    super(1);
  }

  async runExclusive<T>(cb: () => Promise<T>) {
    try {
      await this.acquire();
      const result = await cb();
      this.release();
      return result;
    } catch (t) {
      if (t !== cancellingToken) {
        throw t;
      }
    }
  }
}
