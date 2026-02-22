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
      data-gateway-parent={gateway.parent.id}
      onMouseOut={(ev) => {
        const nextTarget = ev.relatedTarget;
        if (
          nextTarget instanceof Element &&
          nextTarget.closest(
            `[data-id="${gateway.parent.id}"], [data-gateway-parent="${gateway.parent.id}"]`,
          )
        ) {
          return;
        }

        gateway.parent.setState('hover', false);
      }}
      onMouseDownCapture={connector.startConnectionFrom.bind(
        connector,
        gateway,
      )}
    />
  );
});
