import { observer } from 'mobx-react-lite';
import { Diagram } from '../../store/Diagram';
import { Mouse } from '../../util/Mouse';
import { debug } from '../../store/tools/Debugger';

export const Stats = observer(() => {
  const d = Diagram.use();

  const displacement = d.canvas.displacement.round;
  const scale = Math.round(d.canvas.scale * 100) / 100;
  const mouse = Mouse.getInstance().coordinates;
  const selected = d.selector.selection[0]
    ? d.selector.selection[0].coordinates.copy().round.nonObserved
    : null;

  const measure = Math.round(d.measurer.getMeassurement() || 0);

  return (
    <div className="diagram__stats">
      <pre>
        {`

displacement: ${displacement}
scale: ${scale}
mouse: ${mouse}
mouse-fit: ${d.canvas.inverseFit(mouse).round}
${selected ? `selected: ${selected}` : ''}
${
  measure
    ? `
measure: ${measure}
`.trim()
    : ''
}

`.trim()}
        {debug.data}
      </pre>
    </div>
  );
});
