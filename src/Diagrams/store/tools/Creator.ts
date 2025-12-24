import { makeAutoObservable, runInAction } from 'mobx';
import type { Diagram } from '../Diagram';
import { TextNode } from '../elements/TextNode';
import { Coordinates } from '../primitives/Coordinates';
import { Dimensions } from '../primitives/Dimensions';
import { DClickEvent } from '../elements/Events';

export type TCreationMode = 'none' | 'text';

export class Creator {
  creationMode: TCreationMode = 'none';

  constructor(public diagram: Diagram) {
    this.diagram.onEvent(DClickEvent, (ev) => {
      this.handleMouseUp(ev);
    });
    makeAutoObservable(this);
  }

  protected getId() {
    let id = String(Date.now());
    let i = 0;
    while (this.diagram.getNodeById(id)) {
      id = String(Date.now()) + String(i++);
    }
    return id;
  }

  handleMouseUp(ev: DClickEvent) {
    if (!ev.cancelled && this.creationMode !== 'none') {
      ev.cancel();

      switch (this.creationMode) {
        case 'text':
          const node = this.diagram.add(
            new TextNode(null, {
              id: this.getId(),
              label: 'No label',
              box: new Dimensions([
                ...this.diagram.canvas.inverseFit(
                  new Coordinates(ev.originalEvent),
                ).raw,
                100,
                100,
              ]),
            }),
          );
          node.select();
      }
    }

    runInAction(() => {
      this.creationMode = 'none';
    });
  }
}
