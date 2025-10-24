import { observer } from 'mobx-react-lite';
import { Diagram } from '../../store/Diagram';
import { Shape } from '../objects/Shape';
import { getRectPath } from '../../util/shapes';
import { Coordinates } from '../../store/Coordinates';

export const Selection = observer(() => {
  const d = Diagram.use();

  if (!d.selector.selectionModeEnabled) {
    return null;
  }

  return (
    <Shape
      paths={[
        {
          d: getRectPath(d.selector.get(), 0),
          stroke: '#ccccff',
          strokeWidth: 1,
          fill: '#ccccff33',
        },
      ]}
      labelOffset={new Coordinates()}
    />
  );
});
