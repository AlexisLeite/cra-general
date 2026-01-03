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
  private readonly windowTime = 100;
  private readonly maxSize = 50;

  private index = -1;
  private snapshots: string[] = [];

  private async avoidEvents(cb: () => unknown) {
    this.disable();
    try {
      await cb();
    } finally {
      this.enable();
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
          this.snapshots.splice(
            0,
            Math.max(0, this.snapshots.length - this.maxSize),
          );
          this.index = this.snapshots.length - 1;
        });
      }, this.windowTime),
    );
  }

  redo() {
    if (this.hasNext) {
      this.avoidEvents(async () => {
        this.index = Math.min(this.snapshots.length - 1, this.index + 1);
        await this.diagram.reset();
        this.diagram.import(this.snapshots[this.index]);
      });
    }
  }

  undo() {
    if (this.hasPrevious) {
      this.avoidEvents(async () => {
        this.index = Math.max(-1, this.index - 1);
        await this.diagram.reset();
        this.diagram.import(this.snapshots[this.index] || '{}');
      });
    }
  }

  get hasNext() {
    return this.index < this.snapshots.length - 1;
  }

  get hasPrevious() {
    return this.index > -1;
  }

  init() {
    makeObservable<typeof this, 'index'>(this, {
      index: observable,
      hasNext: computed,
      hasPrevious: computed,
      redo: action,
      undo: action,
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
