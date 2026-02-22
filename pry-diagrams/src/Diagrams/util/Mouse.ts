import { makeAutoObservable, runInAction } from 'mobx';
import { Coordinates } from '../store/primitives/Coordinates';

export class Mouse {
  private static instance: Mouse | null = null;
  public static getInstance() {
    if (!this.instance) {
      this.instance = new Mouse();
    }

    return this.instance!;
  }

  x = 0;
  y = 0;

  public get coordinates() {
    return new Coordinates([this.x, this.y]);
  }

  constructor() {
    makeAutoObservable(this);

    document.addEventListener('mousemove', (ev) => {
      runInAction(() => {
        this.x = ev.clientX;
        this.y = ev.clientY;
      });
    });
  }
}
