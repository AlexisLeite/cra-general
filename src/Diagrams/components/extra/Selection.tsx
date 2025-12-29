import { observer } from 'mobx-react-lite';
import { Diagram } from '../../store/Diagram';
import { Shape } from '../objects/Shape';
import { getRectPath } from '../../util/shapes';
import { Coordinates } from '../../store/primitives/Coordinates';
import { makeScalableComponent } from '../objects/makeScalableComponent';
import { Selector } from '../../store/extensions/Selector';

export const Selection = makeScalableComponent(
  observer(() => {
    const d = Diagram.use();
    const selector = d.getExtension(Selector);

    if (!selector.selectionMode) {
      return null;
    }

    return (
      <>
        <Shape
          paths={[
            {
              d: getRectPath(selector.box, 0),
              strokeWidth: 1,
            },
          ]}
          labelOffset={new Coordinates()}
          className="selection_square"
        />
      </>
    );
  }),
);
