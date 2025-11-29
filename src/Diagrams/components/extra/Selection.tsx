import { observer } from 'mobx-react-lite';
import { Diagram } from '../../store/Diagram';
import { Shape } from '../objects/Shape';
import { getRectPath } from '../../util/shapes';
import { Coordinates } from '../../store/primitives/Coordinates';

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
          strokeWidth: 1,
        },
      ]}
      labelOffset={new Coordinates()}
      className="selection_square"
    />
  );
});
