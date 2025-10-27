import { makeAutoObservable } from 'mobx';

export class Debugger {
  data: string = '';

  constructor() {
    makeAutoObservable(this);
  }

  set(what: string) {
    if (!what) {
      this.data = '';
    } else {
      this.data = `
    
Debug:   
======
  
${what}`;
    }
  }
}

export const debug = new Debugger();
