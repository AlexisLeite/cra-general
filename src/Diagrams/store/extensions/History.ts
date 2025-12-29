import {
  action,
  computed,
  makeObservable,
  observable,
  runInAction,
} from 'mobx';
import { DChangeEvent } from '../elements/Events';
import { DiagramExtension } from './DiagramExtension';
import { bind, bindTimeout } from '../../util/binders';

export class History extends DiagramExtension {
  index = -1;
  private snapshots: string[] = [];

  private avoidEvents(cb: () => unknown) {
    this.enable = false;
    try {
      cb();
    } finally {
      this.enable = true;
    }
  }

  unbind = () => {};
  private window() {
    if (!this.enabled) {
      return;
    }

    this.unbind();
    this.unbind = bind(
      bindTimeout(() => {
        runInAction(() => {
          this.snapshots.splice(this.index + 1);
          this.snapshots.push(this.diagram.export());
          this.index = this.snapshots.length - 1;
        });
      }, 100),
    );
  }

  next() {
    this.avoidEvents(() => {
      this.index = Math.min(this.snapshots.length - 1, this.index + 1);
      this.diagram.import(this.snapshots[this.index]);
    });
  }

  previous() {
    this.avoidEvents(() => {
      this.index = Math.max(-1, this.index - 1);
      this.diagram.import(this.snapshots[this.index] || '{}');
    });
  }

  get hasNext() {
    return this.index < this.snapshots.length - 1;
  }

  get hasPrevious() {
    return this.index > -1;
  }

  init() {
    makeObservable(this, {
      index: observable,
      hasNext: computed,
      hasPrevious: computed,
      previous: action,
      next: action,
    });

    this.diagram.onEvent(
      DChangeEvent,
      (ev) => {
        if (!ev.cancelled) {
          this.window();
        }
      },
      this.diagram.priorities.Change_History,
    );

    this.window();
  }
}
