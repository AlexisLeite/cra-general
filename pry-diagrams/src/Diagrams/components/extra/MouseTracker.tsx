import { observer } from 'mobx-react-lite';
import { makeScalableComponent } from '../objects/makeScalableComponent';
import { Cross } from '../objects/Cross';
import { Mouse } from '../../util/Mouse';
import { Diagram } from '../../store/Diagram';

export const MouseTracker = makeScalableComponent(
  observer(() => {
    return (
      <Cross
        coordinates={Diagram.use().canvas.inverseFit(
          Mouse.getInstance().coordinates,
        )}
        stroke="green"
        size={20}
      />
    );
  }),
);
