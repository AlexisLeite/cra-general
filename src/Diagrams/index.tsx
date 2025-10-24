import { Viewer } from './components/Viewer';
import { Diagram } from './store/Diagram';
import { Dimensions } from './store/Dimensions';
import { Node } from './store/Node';

const d = new Diagram();
(window as any).d = d;

let cols = 5;
const nodes = 25;

function x(n: number) {
  return (n % cols) * 170;
}
function y(n: number) {
  return Math.floor(n / cols) * 100;
}

d.add(
  new Node({
    id: 'lefttop',
    label: 'Left Top',
    box: new Dimensions([0, 0, 150, 80]),
  }),
);
d.add(
  new Node({
    id: 'leftright',
    label: 'Left Right',
    box: new Dimensions([10000 - 150, 0, 150, 80]),
  }),
);
d.add(
  new Node({
    id: 'leftbottom',
    label: 'Left Bottom',
    box: new Dimensions([0, 10000 - 80, 150, 80]),
  }),
);
d.add(
  new Node({
    id: 'rightbottom',
    label: 'Right Top',
    box: new Dimensions([10000 - 150, 10000 - 80, 150, 80]),
  }),
);

for (let i = 0; i < nodes; i++) {
  d.add(
    new Node({
      id: String(i),
      label: 'World' + i,
      box: new Dimensions([x(i) + 5000, y(i) + 5000, 150, 80]),
    }),
  );
}

export const Diagrams = () => {
  return <Viewer diagram={d} />;
};
