import { observer } from 'mobx-react-lite';
import { Diagram } from '../../store/Diagram';
import { RenderEdge } from '../objects/RenderEdge';
import { Shape } from '../objects/Shape';
import { getCirclePath } from '../../util/shapes';
import { Coordinates } from '../../store/primitives/Coordinates';

export const ConnectorRenderer = observer(() => {
  const d = Diagram.use();

  const points = d.connector.arrowSteps;

  if (!points.length) {
    return null;
  }

  let point: Coordinates | null = null;
  if (d.connector.candidateGate && d.connector.candidateNode) {
    switch (d.connector.candidateGate) {
      case 'down':
        point = d.connector.candidateNode.box.bottomMiddle;
        break;
      case 'left':
        point = d.connector.candidateNode.box.leftMiddle;
        break;
      case 'right':
        point = d.connector.candidateNode.box.rightMiddle;
        break;
      case 'up':
        point = d.connector.candidateNode.box.topMiddle;
        break;
    }
  }

  return (
    <>
      <RenderEdge
        points={points}
        width={2 * d.canvas.scale}
        arrowSize={8 * d.canvas.scale}
      />
      {point && (
        <Shape
          paths={[
            {
              d: getCirclePath(d.canvas.fit(point), 5),
              stroke: 'green',
              fill: 'green',
            },
          ]}
        />
      )}
    </>
  );
});
