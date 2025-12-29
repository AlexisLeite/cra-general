import { makeAutoObservable } from 'mobx';

export class ClassList {
  private _data = new Set<string>();

  constructor() {
    makeAutoObservable(this);
  }

  add(...cl: string[]) {
    for (const c of cl) {
      this._data.add(c);
    }
  }

  delete(cl: string) {
    this._data.delete(cl);
  }

  toggle(cl: string) {
    if (this._data.has(cl)) {
      this.delete(cl);
    } else {
      this.add(cl);
    }
  }

  get string() {
    return [...this._data].join(' ');
  }
}
