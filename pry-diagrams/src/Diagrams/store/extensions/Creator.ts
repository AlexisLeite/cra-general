import { makeObservable, observable, runInAction } from 'mobx';
import { TextNode } from '../elements/TextNode';
import { Coordinates } from '../primitives/Coordinates';
import { Dimensions } from '../primitives/Dimensions';
import { DClickEvent } from '../elements/Events';
import { DiagramExtension } from './DiagramExtension';
import { Selector } from './Selector';

export type TCreationMode = 'none' | 'text';

export class Creator extends DiagramExtension {
  creationMode: TCreationMode = 'none';

  init() {
    this.diagram.onEvent(DClickEvent, (ev) => {
      this.handleClick(ev);
    });
    makeObservable(this, { creationMode: observable });
  }

  protected getId() {
    let id = String(Date.now());
    let i = 0;
    while (this.diagram.getNodeById(id)) {
      id = String(Date.now()) + String(i++);
    }
    return id;
  }

  handleClick(ev: DClickEvent) {
    if (!ev.cancelled && this.creationMode !== 'none') {
      ev.cancel();

      switch (this.creationMode) {
        case 'text': {
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
          this.diagram.getExtension(Selector).selectNode(node);
        }
      }
    }

    runInAction(() => {
      this.creationMode = 'none';
    });
  }
}
