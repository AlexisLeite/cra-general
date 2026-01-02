import { observer } from 'mobx-react-lite';
import { Diagram } from '../../store/Diagram';
import { RenderEdge } from '../objects/RenderEdge';
import { makeScalableComponent } from '../objects/makeScalableComponent';
import { NodesConnector } from '../../store/extensions/NodesConnector';
import { Cross } from '../objects/Cross';

export const NodesConnectorRenderer = makeScalableComponent(
  observer(() => {
    const d = Diagram.use();

    const connector = d.getExtension(NodesConnector);
    const points = connector.arrowSteps;

    if (!points.length) {
      return null;
    }

    return (
      <>
        {connector?.candidateGateway && (
          <Cross
            coordinates={connector.candidateGateway.coordinates}
            stroke="yellow"
          />
        )}
        <RenderEdge
          points={points}
          width={2 * d.canvas.scale}
          arrowSize={8 * d.canvas.scale}
        />
      </>
    );
  }),
);
