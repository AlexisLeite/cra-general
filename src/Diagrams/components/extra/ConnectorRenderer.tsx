import { observer } from 'mobx-react-lite';
import { Diagram } from '../../store/Diagram';
import { RenderEdge } from '../objects/RenderEdge';

export const ConnectorRenderer = observer(() => {
  const d = Diagram.use();

  const points = d.connector.arrowSteps;

  if (!points) {
    return null;
  }

  return (
    <RenderEdge
      points={points}
      width={2 * d.canvas.scale}
      arrowSize={8 * d.canvas.scale}
    />
  );
});
