import { makeAutoObservable } from 'mobx';
import { AnyMouseEvent } from '../Canvas';
import type { Diagram } from '../Diagram';
import { TextNode } from '../elements/TextNode';
import { Coordinates } from '../primitives/Coordinates';
import { Dimensions } from '../primitives/Dimensions';

export type TCreationMode = 'none' | 'text';

export class Creator {
  creationMode: TCreationMode = 'none';

  constructor(public diagram: Diagram) {
    this.diagram.canvas.on('mouseUp', this.handleMouseUp.bind(this));
    makeAutoObservable(this);
  }

  protected getId() {
    let id = String(Date.now());
    let i = 0;
    while (this.diagram.getNodeById(id)) {
      id = String(Date.now() + String(i++));
    }
    return id;
  }

  handleMouseUp(ev: AnyMouseEvent) {
    if (this.creationMode !== 'none') {
      ev.preventDefault();

      switch (this.creationMode) {
        case 'text':
          const node = this.diagram.add(
            new TextNode({
              id: this.getId(),
              label: 'No label',
              box: new Dimensions([
                ...this.diagram.canvas.inverseFit(new Coordinates(ev)).raw,
                100,
                100,
              ]),
            }),
          );
          this.diagram.selectNode(node);
      }
    }
    this.creationMode = 'none';
  }
}
