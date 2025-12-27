import { Element } from '../store/elements/Element';

export class Keyboard extends Element {
  private static instance: Keyboard | null = null;
  public static getInstance() {
    if (!this.instance) {
      this.instance = new Keyboard();
    }

    return this.instance!;
  }

  code = '';
  ctrl = false;
  shift = false;
  alt = false;

  constructor() {
    super(null);

    document.addEventListener('keydown', (ev) => {
      this.code = ev.code;
      this.shift = ev.shiftKey;
      this.ctrl = ev.ctrlKey;
      this.alt = ev.altKey;
    });
    document.addEventListener('keyup', () => {
      this.code = '';
      this.shift = false;
      this.ctrl = false;
      this.alt = false;
    });
  }
}
