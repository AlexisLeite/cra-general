import { observer } from 'mobx-react-lite';
import { Diagram } from '../../store/Diagram';
import { RenderEdge } from '../objects/RenderEdge';
import { makeScalableComponent } from '../objects/makeScalableComponent';
import { NodesConnector } from '../../store/extensions/NodesConnector';

export const ConnectorRenderer = makeScalableComponent(
  observer(() => {
    const d = Diagram.use();

    const points = d.getExtension(NodesConnector).arrowSteps;

    if (!points.length) {
      return null;
    }

    return (
      <>
        <RenderEdge
          points={points}
          width={2 * d.canvas.scale}
          arrowSize={8 * d.canvas.scale}
        />
      </>
    );
  }),
);
