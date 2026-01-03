import { observer } from 'mobx-react-lite';
import type { Lanes } from '.';
import type { MouseEvent } from 'react';
import { Coordinates } from '../../../../store/primitives/Coordinates';
import { bind, bindDocument } from '../../../../util/binders';

function resizeLane(lanes: Lanes, ev: MouseEvent) {
  ev.nativeEvent.stopImmediatePropagation();

  const d = lanes.diagram!;

  const startPosition = d.canvas.inverseFit(new Coordinates(ev));
  const initialWidth = lanes.state.box.width;

  const unbind = bind(
    bindDocument({}, 'mousemove', (ev) => {
      const currentPosition = d.canvas.inverseFit(new Coordinates(ev));
      const diff = currentPosition.x - startPosition.x;

      lanes.state.box.width = Math.max(300, initialWidth + diff);
    }),
    bindDocument({}, 'mouseup', () => {
      unbind();
    }),
  );
}

export const LanesResizer = observer(({ lanes }: { lanes: Lanes }) => {
  if (!lanes.selected) {
    return null;
  }

  return (
    <>
      <div
        onMouseDown={resizeLane.bind(resizeLane, lanes)}
        className="lane__resize"
      ></div>
    </>
  );
});
