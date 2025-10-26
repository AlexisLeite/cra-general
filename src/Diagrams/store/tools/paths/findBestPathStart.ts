import { Diagram } from '../../Diagram';
import { Gateway } from '../../elements/Gateway';
import { Coordinates } from '../../primitives/Coordinates';

type MatrixInput = {
  fromWidth: number;
  fromHeight: number;
  fromX: number;
  fromY: number;
  toWidth: number;
  toHeight: number;
  toX: number;
  toY: number;
  gridSize: number;
};

const matricesOriginal: Record<string, (props: MatrixInput) => Coordinates[]> =
  Object.freeze({
    /**
     * The path starts on the bottom
     */
    fromBottom1: (props) => [
      new Coordinates([props.fromX, props.fromY]),
      new Coordinates([props.fromX, props.fromY + props.gridSize]),
      new Coordinates([props.toX, props.fromY + props.gridSize]),
    ],
    fromBottom2: (props) => [
      new Coordinates([props.fromX, props.fromY]),
      new Coordinates([props.fromX, props.fromY + props.gridSize]),
      new Coordinates([
        props.fromX - props.fromWidth / 2 - props.gridSize,
        props.fromY + props.gridSize,
      ]),
      new Coordinates([
        props.fromX - props.fromWidth / 2 - props.gridSize,
        props.fromY - props.fromHeight - props.gridSize,
      ]),
    ],
    fromBottom3: (props) => [
      new Coordinates([props.fromX, props.fromY]),
      new Coordinates([props.fromX, props.fromY + props.gridSize]),
      new Coordinates([
        props.fromX + props.fromWidth / 2 + props.gridSize,
        props.fromY + props.gridSize,
      ]),
      new Coordinates([
        props.fromX + props.fromWidth / 2 + props.gridSize,
        props.fromY - props.fromHeight - props.gridSize,
      ]),
    ],
    fromBottom4: (props) => [
      new Coordinates([props.fromX, props.fromY]),
      new Coordinates([props.fromX, props.fromY + props.gridSize]),
      new Coordinates([props.toX, props.fromY + props.gridSize]),
    ],
    fromBottom5: (props) => [
      new Coordinates([props.fromX, props.fromY]),
      new Coordinates([props.fromX, props.fromY + props.gridSize]),
    ],

    /**
     * The path starts on the top
     */
    fromTop1: (props) => [
      new Coordinates([props.fromX, props.fromY]),
      new Coordinates([props.fromX, props.fromY - props.gridSize]),
      new Coordinates([props.toX, props.fromY - props.gridSize]),
    ],
    fromTop2: (props) => [
      new Coordinates([props.fromX, props.fromY]),
      new Coordinates([props.fromX, props.fromY - props.gridSize]),
      new Coordinates([
        props.fromX - props.fromWidth / 2 - props.gridSize,
        props.fromY - props.gridSize,
      ]),
      new Coordinates([
        props.fromX - props.fromWidth / 2 - props.gridSize,
        props.fromY + props.fromHeight + props.gridSize,
      ]),
    ],
    fromTop3: (props) => [
      new Coordinates([props.fromX, props.fromY]),
      new Coordinates([props.fromX, props.fromY - props.gridSize]),
      new Coordinates([
        props.fromX + props.fromWidth / 2 + props.gridSize,
        props.fromY - props.gridSize,
      ]),
      new Coordinates([
        props.fromX + props.fromWidth / 2 + props.gridSize,
        props.fromY + props.fromHeight + props.gridSize,
      ]),
    ],
    fromTop4: (props) => [
      new Coordinates([props.fromX, props.fromY]),
      new Coordinates([props.fromX, props.fromY - props.gridSize]),
      new Coordinates([props.toX, props.fromY - props.gridSize]),
    ],
    fromTop5: (props) => [
      new Coordinates([props.fromX, props.fromY]),
      new Coordinates([props.fromX, props.fromY - props.gridSize]),
    ],

    /**
     * The path starts on the left
     */
    fromLeft1: (props) => [
      new Coordinates([props.fromX, props.fromY]),
      new Coordinates([props.fromX - props.gridSize, props.fromY]),
      new Coordinates([
        props.fromX - props.gridSize,
        props.fromY - props.fromHeight / 2 - props.gridSize,
      ]),
    ],
    fromLeft2: (props) => [
      new Coordinates([props.fromX, props.fromY]),
      new Coordinates([props.fromX - props.gridSize, props.fromY]),
      new Coordinates([
        props.fromX - props.gridSize,
        props.fromY - props.fromHeight / 2 - props.gridSize,
      ]),
      new Coordinates([
        props.fromX + props.fromWidth + props.gridSize,
        props.fromY - props.fromHeight / 2 - props.gridSize,
      ]),
    ],
    fromLeft3: (props) => [
      new Coordinates([props.fromX, props.fromY]),
      new Coordinates([props.fromX - props.gridSize, props.fromY]),
      new Coordinates([
        props.fromX - props.gridSize,
        props.fromY + props.fromHeight / 2 + props.gridSize,
      ]),
      new Coordinates([
        props.fromX + props.fromWidth + props.gridSize,
        props.fromY + props.fromHeight / 2 + props.gridSize,
      ]),
    ],
    fromLeft4: (props) => [
      new Coordinates([props.fromX, props.fromY]),
      new Coordinates([props.fromX - props.gridSize, props.fromY]),
      new Coordinates([
        props.fromX - props.gridSize,
        props.fromY + props.fromHeight / 2 + props.gridSize,
      ]),
      new Coordinates([
        Math.min(
          props.fromX + props.fromWidth + props.gridSize,
          props.toX - props.gridSize,
        ),
        props.fromY + props.fromHeight / 2 + props.gridSize,
      ]),
    ],
    fromLeft5: (props) => [
      new Coordinates([props.fromX, props.fromY]),
      new Coordinates([props.fromX - props.gridSize, props.fromY]),
    ],

    /**
     * The path starts on the right
     */
    fromRight1: (props) => [
      new Coordinates([props.fromX, props.fromY]),
      new Coordinates([props.fromX + props.gridSize, props.fromY]),
      new Coordinates([
        props.fromX + props.gridSize,
        props.fromY - props.fromHeight / 2 - props.gridSize,
      ]),
      new Coordinates([
        Math.min(
          props.fromX + props.gridSize,
          Math.max(
            props.fromX - props.fromWidth - props.gridSize,
            props.toX + props.toWidth + props.gridSize,
          ),
        ),
        props.fromY - props.fromHeight / 2 - props.gridSize,
      ]),
    ],
    fromRight2: (props) => [
      new Coordinates([props.fromX, props.fromY]),
      new Coordinates([props.fromX + props.gridSize, props.fromY]),
      new Coordinates([
        props.fromX + props.gridSize,
        props.fromY - props.fromHeight / 2 - props.gridSize,
      ]),
      new Coordinates([
        props.fromX - props.fromWidth - props.gridSize,
        props.fromY - props.fromHeight / 2 - props.gridSize,
      ]),
    ],
    fromRight3: (props) => [
      new Coordinates([props.fromX, props.fromY]),
      new Coordinates([props.fromX + props.gridSize, props.fromY]),
      new Coordinates([
        props.fromX + props.gridSize,
        props.fromY - props.fromHeight / 2 - props.gridSize,
      ]),
      new Coordinates([
        Math.max(
          props.fromX - props.gridSize - props.fromWidth,
          props.toX + props.toWidth / 2 + props.gridSize,
        ),
        props.fromY - props.fromHeight / 2 - props.gridSize,
      ]),
    ],
    fromRight4: (props) => [
      new Coordinates([props.fromX, props.fromY]),
      new Coordinates([props.fromX + props.gridSize, props.fromY]),
      new Coordinates([
        props.fromX + props.gridSize,
        props.fromY + props.fromHeight / 2 + props.gridSize,
      ]),
      new Coordinates([
        Math.min(
          props.fromX + props.gridSize,
          Math.max(
            props.fromX - props.fromWidth - props.gridSize,
            props.toX + props.toWidth + props.gridSize,
          ),
        ),
        props.fromY + props.fromHeight / 2 + props.gridSize,
      ]),
    ],
    fromRight5: (props) => [
      new Coordinates([props.fromX, props.fromY]),
      new Coordinates([props.fromX + props.gridSize, props.fromY]),
    ],
  });

const matrices = new Proxy(matricesOriginal, {
  get(target, p, receiver) {
    console.log(p);
    return target[p as any];
  },
});

export function findBestPathStart(
  diagram: Diagram,
  from: Gateway,
  to: Gateway,
) {
  const props: MatrixInput = {
    fromHeight: from.parent.box.height,
    fromWidth: from.parent.box.width,
    fromX: from.coordinates.x,
    fromY: from.coordinates.y,
    toHeight: to.parent.box.height,
    toWidth: to.parent.box.width,
    toX: to.coordinates.x,
    toY: to.coordinates.y,
    gridSize: diagram.gridSize,
  };

  switch (from.orientation) {
    case 'down':
      if (props.toY > props.fromY) {
        return matrices.fromBottom5(props);
      } else {
        if (props.toX < props.fromX) {
          if (props.toX >= props.fromX - props.fromWidth / 2) {
            return matrices.fromBottom2(props);
          } else {
            return matrices.fromBottom1(props);
          }
        } else {
          if (props.toX <= props.fromX + props.fromWidth / 2) {
            return matrices.fromBottom3(props);
          } else {
            return matrices.fromBottom4(props);
          }
        }
      }
    case 'up':
      if (props.toY < props.fromY) {
        return matrices.fromTop5(props);
      } else {
        if (props.toX < props.fromX) {
          if (props.toX > props.fromX - props.fromWidth / 2) {
            return matrices.fromTop2(props);
          } else {
            return matrices.fromTop1(props);
          }
        } else {
          if (props.toX < props.fromX + props.fromWidth / 2) {
            return matrices.fromTop3(props);
          } else {
            return matrices.fromTop4(props);
          }
        }
      }
    case 'left':
      if (props.toX < props.fromX - props.gridSize) {
        return matrices.fromLeft5(props);
      } else {
        if (props.toY < props.fromY) {
          if (props.toY < props.fromY - props.fromHeight / 2) {
            return matrices.fromLeft1(props);
          } else {
            return matrices.fromLeft2(props);
          }
        } else {
          if (props.toY > props.fromY + props.fromHeight / 2) {
            return matrices.fromLeft4(props);
          } else {
            return matrices.fromLeft3(props);
          }
        }
      }
    case 'right':
      if (props.fromX < to.parent.box.x) {
        return matrices.fromRight5(props);
      } else {
        if (props.toY < props.fromY) {
          if (props.toY > props.fromY - props.fromHeight / 2) {
            return matrices.fromRight2(props);
          } else {
            return matrices.fromRight1(props);
          }
        } else {
          if (props.toY > props.fromY + props.fromHeight / 2) {
            return matrices.fromRight4(props);
          } else {
            return matrices.fromRight3(props);
          }
        }
      }
  }

  return [new Coordinates()];
}
