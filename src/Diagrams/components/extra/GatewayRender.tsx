import { observer } from 'mobx-react-lite';
import { Gateway } from '../../store/elements/Gateway';
import { Shape } from '../objects/Shape';
import { getCirclePath } from '../../util/shapes';
import { Diagram } from '../../store/Diagram';
import { NodesConnector } from '../../store/extensions/NodesConnector';

export const GatewayRender = observer(({ gateway }: { gateway: Gateway }) => {
  const d = Diagram.use();
  const connector = d.getExtension(NodesConnector);

  return (
    <Shape
      key={gateway.id}
      paths={[
        {
          d: getCirclePath(gateway.coordinates, gateway.radius),
          fill: gateway.fill,
          stroke: gateway.stroke,
          strokeWidth: gateway.strokeWidth,
        },
      ]}
      className="diagram__node__gateway"
      onMouseDownCapture={connector.startConnectionFrom.bind(
        connector,
        gateway,
      )}
    />
  );
});
