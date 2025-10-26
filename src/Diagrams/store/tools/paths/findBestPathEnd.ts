import { Diagram } from '../../Diagram';
import { Gateway } from '../../elements/Gateway';
import { Coordinates } from '../../primitives/Coordinates';

type MatrixInput = {
  toWidth: number;
  toHeight: number;
  toX: number;
  toY: number;
  fromX: number;
  fromY: number;
  gridSize: number;
};

const matricesOriginal: Record<string, (props: MatrixInput) => Coordinates[]> =
  Object.freeze({
    /**
     * The path starts on the bottom
     */
    toBottom1: (props) => [
      new Coordinates([props.toX, props.toY]),
      new Coordinates([props.toX, props.toY + props.gridSize]),
      new Coordinates([
        props.toX - props.toWidth / 2 - props.gridSize,
        props.toY + props.gridSize,
      ]),
    ],
    toBottom2: (props) => [
      new Coordinates([props.toX, props.toY]),
      new Coordinates([props.toX, props.toY + props.gridSize]),
      new Coordinates([
        props.toX - props.toWidth / 2 - props.gridSize,
        props.toY + props.gridSize,
      ]),
      new Coordinates([
        props.toX - props.toWidth / 2 - props.gridSize,
        props.toY - props.toHeight,
      ]),
    ],
    toBottom3: (props) => [
      new Coordinates([props.toX, props.toY]),
      new Coordinates([props.toX, props.toY + props.gridSize]),
      new Coordinates([
        props.toX + props.toWidth / 2 + props.gridSize,
        props.toY + props.gridSize,
      ]),
      new Coordinates([
        props.toX + props.toWidth / 2 + props.gridSize,
        props.toY - props.toHeight,
      ]),
    ],
    toBottom4: (props) => [
      new Coordinates([props.toX, props.toY]),
      new Coordinates([props.toX, props.toY + props.gridSize]),
      new Coordinates([
        props.toX + props.toWidth / 2 + props.gridSize,
        props.toY + props.gridSize,
      ]),
    ],
    toBottom5: (props) => [
      new Coordinates([props.toX, props.toY]),
      new Coordinates([props.toX, props.toY + props.gridSize]),
    ],

    /**
     * The path starts on the top
     */
    toTop1: (props) => [
      new Coordinates([props.toX, props.toY]),
      new Coordinates([props.toX, props.toY - props.gridSize]),
      new Coordinates([props.fromX, props.toY - props.gridSize]),
    ],
    toTop2: (props) => [
      new Coordinates([props.toX, props.toY]),
      new Coordinates([props.toX, props.toY - props.gridSize]),
      new Coordinates([
        props.toX - props.toWidth / 2 - props.gridSize,
        props.toY - props.gridSize,
      ]),
      new Coordinates([
        props.toX - props.toWidth / 2 - props.gridSize,
        props.toY + props.toHeight + props.gridSize,
      ]),
    ],
    toTop3: (props) => [
      new Coordinates([props.toX, props.toY]),
      new Coordinates([props.toX, props.toY - props.gridSize]),
      new Coordinates([
        props.toX + props.toWidth / 2 + props.gridSize,
        props.toY - props.gridSize,
      ]),
      new Coordinates([
        props.toX + props.toWidth / 2 + props.gridSize,
        props.toY + props.toHeight + props.gridSize,
      ]),
    ],
    toTop4: (props) => [
      new Coordinates([props.toX, props.toY]),
      new Coordinates([props.toX, props.toY - props.gridSize]),
      new Coordinates([
        props.toX + props.toWidth / 2 + props.gridSize,
        props.toY - props.gridSize,
      ]),
      new Coordinates([
        props.toX + props.toWidth / 2 + props.gridSize,
        Math.min(props.toY + props.toHeight, props.fromY),
      ]),
    ],
    toTop5: (props) => [
      new Coordinates([props.toX, props.toY]),
      new Coordinates([props.toX, props.toY - props.gridSize]),
    ],

    /**
     * The path starts on the left
     */
    toLeft1: (props) => [
      new Coordinates([props.toX, props.toY]),
      new Coordinates([props.toX - props.gridSize, props.toY]),
      new Coordinates([
        props.toX - props.gridSize,
        props.toY - props.toHeight / 2 - props.gridSize,
      ]),
    ],
    toLeft2: (props) => [
      new Coordinates([props.toX, props.toY]),
      new Coordinates([props.toX - props.gridSize, props.toY]),
      new Coordinates([
        props.toX - props.gridSize,
        props.toY - props.toHeight / 2 - props.gridSize,
      ]),
      new Coordinates([
        props.toX + props.toWidth + props.gridSize,
        props.toY - props.toHeight / 2 - props.gridSize,
      ]),
    ],
    toLeft3: (props) => [
      new Coordinates([props.toX, props.toY]),
      new Coordinates([props.toX - props.gridSize, props.toY]),
      new Coordinates([
        props.toX - props.gridSize,
        props.toY - props.toHeight / 2 - props.gridSize,
      ]),
      new Coordinates([
        props.toX + props.toWidth + props.gridSize,
        props.toY - props.toHeight / 2 - props.gridSize,
      ]),
    ],
    toLeft4: (props) => [
      new Coordinates([props.toX, props.toY]),
      new Coordinates([props.toX - props.gridSize, props.toY]),
      new Coordinates([
        props.toX - props.gridSize,
        props.toY + props.toHeight / 2 + props.gridSize,
      ]),
      new Coordinates([
        Math.min(props.toX + props.toWidth + props.gridSize, props.fromX),
        props.toY + props.toHeight / 2 + props.gridSize,
      ]),
    ],
    toLeft5: (props) => [
      new Coordinates([props.toX, props.toY]),
      new Coordinates([props.toX - props.gridSize, props.toY]),
    ],

    /**
     * The path starts on the right
     */
    toRight1: (props) => [
      new Coordinates([props.toX, props.toY]),
      new Coordinates([props.toX + props.gridSize, props.toY]),
      new Coordinates([props.toX + props.gridSize, props.fromY]),
    ],
    toRight2: (props) => [
      new Coordinates([props.toX, props.toY]),
      new Coordinates([props.toX + props.gridSize, props.toY]),
      new Coordinates([
        props.toX + props.gridSize,
        props.toY - props.toHeight / 2 - props.gridSize,
      ]),
      new Coordinates([
        props.toX - props.toWidth - props.gridSize,
        props.toY - props.toHeight / 2 - props.gridSize,
      ]),
    ],
    toRight3: (props) => [
      new Coordinates([props.toX, props.toY]),
      new Coordinates([props.toX + props.gridSize, props.toY]),
      new Coordinates([
        props.toX + props.gridSize,
        props.toY - props.toHeight / 2 - props.gridSize,
      ]),
      new Coordinates([
        props.toX - props.toWidth - props.gridSize,
        props.toY - props.toHeight / 2 - props.gridSize,
      ]),
    ],
    toRight4: (props) => [
      new Coordinates([props.toX, props.toY]),
      new Coordinates([props.toX + props.gridSize, props.toY]),
      new Coordinates([
        props.toX + props.gridSize,
        props.toY + props.toHeight / 2 + props.gridSize,
      ]),
    ],
    toRight5: (props) => [
      new Coordinates([props.toX, props.toY]),
      new Coordinates([props.toX + props.gridSize, props.toY]),
    ],
  });

const matrices = new Proxy(matricesOriginal, {
  get(target, p, receiver) {
    console.log(p);
    return target[p as any];
  },
});

export function findBestPathEnd(
  diagram: Diagram,
  to: Gateway,
  from: Coordinates,
) {
  const props: MatrixInput = {
    toHeight: to.parent.box.height,
    toWidth: to.parent.box.width,
    toX: to.coordinates.x,
    toY: to.coordinates.y,
    fromX: from.x,
    fromY: from.y,
    gridSize: diagram.gridSize,
  };

  switch (to.orientation) {
    case 'down':
      if (props.fromY > props.toY) {
        return matrices.toBottom5(props);
      } else {
        if (props.fromX < props.toX) {
          if (props.fromX >= props.toX - props.toWidth / 2) {
            return matrices.toBottom2(props);
          } else {
            return matrices.toBottom1(props);
          }
        } else {
          if (props.fromX <= props.toX + props.toWidth / 2) {
            return matrices.toBottom3(props);
          } else {
            return matrices.toBottom4(props);
          }
        }
      }
    case 'up':
      if (props.fromY < props.toY) {
        return matrices.toTop5(props);
      } else {
        if (props.fromX < props.toX) {
          if (props.fromX > props.toX - props.toWidth / 2) {
            return matrices.toTop2(props);
          } else {
            return matrices.toTop1(props);
          }
        } else {
          if (props.fromX < props.toX + props.toWidth / 2) {
            return matrices.toTop3(props);
          } else {
            return matrices.toTop4(props);
          }
        }
      }
    case 'left':
      if (props.fromX < props.toX) {
        return matrices.toLeft5(props);
      } else {
        if (props.fromY < props.toY) {
          if (props.fromY < props.toY - props.toHeight / 2) {
            return matrices.toLeft1(props);
          } else {
            return matrices.toLeft2(props);
          }
        } else {
          if (props.fromY > props.toY + props.toHeight / 2) {
            return matrices.toLeft4(props);
          } else {
            return matrices.toLeft3(props);
          }
        }
      }
    case 'right':
      if (props.fromX > props.toX) {
        return matrices.toRight5(props);
      } else {
        if (props.fromY < props.toY) {
          if (props.fromY > props.toY - props.toHeight / 2) {
            return matrices.toRight2(props);
          } else {
            return matrices.toRight1(props);
          }
        } else {
          if (props.fromY > props.toY + props.toHeight / 2) {
            return matrices.toRight4(props);
          } else {
            return matrices.toRight3(props);
          }
        }
      }
  }

  return [new Coordinates()];
}
