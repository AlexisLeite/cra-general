import { Dimensions } from './store/primitives/Dimensions';
import { Node } from './store/elements/Node';
import json from '../saves/temp.json';
import { TaskNode } from './custom/bpmn/TaskNode';
import { toJS } from 'mobx';
import { Diagram } from './store/Diagram';
import { EdgeWithLoad } from './custom/bpmn/EdgeWithLoad';

Diagram.registerClass(TaskNode);
Diagram.registerClass(EdgeWithLoad);

export const d = new Diagram();
d.setDefaultEdge(EdgeWithLoad);

(window as any).d = d;
(window as any).toJS = toJS;

export function extremosYCuadricula(conectados = false) {
  const cols = 8;
  const nodes = 5;

  function x(n: number) {
    return (n % cols) * 850;
  }
  function y(n: number) {
    return Math.floor(n / cols) * 700;
  }

  d.add(
    new Node(null, {
      id: 'lefttop',
      label: 'Left Top',
      box: new Dimensions([0, 0, 200, 100]),
    }),
  );
  d.add(
    new Node(null, {
      id: 'leftright',
      label: 'Left Right',
      box: new Dimensions([10000 - 200, 0, 200, 100]),
    }),
  );
  d.add(
    new Node(null, {
      id: 'leftbottom',
      label: 'Left Bottom',
      box: new Dimensions([0, 10000 - 80, 200, 100]),
    }),
  );
  d.add(
    new Node(null, {
      id: 'rightbottom',
      label: 'Right Top',
      box: new Dimensions([10000 - 200, 10000 - 80, 200, 100]),
    }),
  );

  for (let i = 0; i < nodes; i++) {
    d.add(
      new TaskNode(null, {
        id: 'task' + i,
        label: 'Task ' + i,
        box: new Dimensions([x(i) + 5000, y(i) + 5000, 200, 100]),
      }),
    );
  }

  if (conectados) {
    for (let i = 1; i < nodes; i++) {
      d.connect(
        d.getNodeById('0')!.getGateway('right')!,
        d.getNodeById(String(i))!.getGateway('left')!,
      );
    }
  }
}

export async function restoreSaved() {
  d.import(JSON.stringify(json as any));
}

restoreSaved();
