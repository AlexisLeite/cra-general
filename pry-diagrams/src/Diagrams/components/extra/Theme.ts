import { makeAutoObservable } from 'mobx';

const key = 'diagram-theme-light';
const className = 'light';

export class Theme {
  public static instance = new Theme();

  isLight = false;

  private constructor() {
    if (localStorage.getItem(key) === 'true') {
      document.body.classList.add(className);
      this.isLight = true;
    }

    makeAutoObservable(this);
  }

  _get() {
    return document.body.classList.contains(className);
  }

  get() {
    return this.isLight;
  }

  toggle() {
    document.body.classList.toggle(className);
    this.isLight = this._get();
    localStorage.setItem(key, String(this._get()));
  }
}
