import { Viewer } from './components/Viewer';
import { Diagram } from './store/Diagram';
import { Dimensions } from './store/primitives/Dimensions';
import { Node } from './store/elements/Node';
import { Coordinates } from './store/primitives/Coordinates';

import json from '../saves/temp.json';

const d = new Diagram();
(window as any).d = d;

export function extremosYCuadricula(conectados = false) {
  let cols = 5;
  const nodes = 20;

  function x(n: number) {
    return (n % cols) * 300;
  }
  function y(n: number) {
    return Math.floor(n / cols) * 200;
  }

  d.add(
    new Node({
      id: 'lefttop',
      label: 'Left Top',
      box: new Dimensions([0, 0, 200, 100]),
    }),
  );
  d.add(
    new Node({
      id: 'leftright',
      label: 'Left Right',
      box: new Dimensions([10000 - 200, 0, 200, 100]),
    }),
  );
  d.add(
    new Node({
      id: 'leftbottom',
      label: 'Left Bottom',
      box: new Dimensions([0, 10000 - 80, 200, 100]),
    }),
  );
  d.add(
    new Node({
      id: 'rightbottom',
      label: 'Right Top',
      box: new Dimensions([10000 - 200, 10000 - 80, 200, 100]),
    }),
  );

  for (let i = 0; i < nodes; i++) {
    d.add(
      new Node({
        id: String(i),
        label: 'World' + i,
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

export function cincoEnCuadrado() {
  const lt = d.add(
    new Node({
      id: 'lefttop',
      label: 'Left Top',
      box: new Dimensions([0, 0, 200, 100]),
    }),
  );
  const lr = d.add(
    new Node({
      id: 'leftbottom',
      label: 'Left Bottom',
      box: new Dimensions([0, 1000, 200, 100]),
    }),
  );
  const lb = d.add(
    new Node({
      id: 'righttop',
      label: 'Right Top',
      box: new Dimensions([1100, 0, 200, 100]),
    }),
  );
  const rb = d.add(
    new Node({
      id: 'rightbottom',
      label: 'Right Bottom',
      box: new Dimensions([1100, 1000, 200, 100]),
    }),
  );
  const m = d.add(
    new Node({
      id: 'middle',
      label: 'Middle',
      box: new Dimensions([550, 500, 200, 100]),
    }),
  );

  // d.connect(m.getGateway('bottom')!, lt.getGateway('bottom')!);
  // d.connect(m.getGateway('left')!, lt.getGateway('right')!);
  // d.connect(m.getGateway('top')!, lt.getGateway('right')!);
  // d.connect(m.getGateway('top')!, lt.getGateway('bottom')!);

  d.nodes.forEach((c) => {
    c.displace(new Coordinates([5800, 5200]));
  });
}
export async function restoreSaved() {
  d.import(JSON.stringify(json as any));
}

// extremosYCuadricula();

export const Diagrams = () => {
  return (
    <>
      <Viewer diagram={d} />
      <div
        ref={(el) => {
          if (el) {
            d.canvas.setScale(0.4);
            restoreSaved();
            window.requestAnimationFrame(() => {
              // d.canvas.centerOnPoint(
              //   d
              //     .getNodeById('lefttop')!
              //     .box.middle.sum(d.getNodeById('middle')!.box.middle)
              //     .divide(2),
              // );
            });
          }
        }}
      />
    </>
  );
};
