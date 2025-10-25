import { Viewer } from './components/Viewer';
import { Diagram } from './store/Diagram';
import { Dimensions } from './store/primitives/Dimensions';
import { Node } from './store/elements/Node';

const d = new Diagram();
(window as any).d = d;

let cols = 5;
const nodes = 20;

function x(n: number) {
  return (n % cols) * 250;
}
function y(n: number) {
  return Math.floor(n / cols) * 150;
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

export const Diagrams = () => {
  return <Viewer diagram={d} />;
};
