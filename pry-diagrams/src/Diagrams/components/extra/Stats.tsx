import { observer } from 'mobx-react-lite';
import { Diagram } from '../../store/Diagram';
import { Mouse } from '../../util/Mouse';
import { debug } from '../../store/extensions/Debugger';
import { Measurer } from '../../store/extensions/Measurer';
import { Selector } from '../../store/extensions/Selector';

export const Stats = observer(() => {
  const d = Diagram.use();
  const measurer = d.getExtension(Measurer);
  const selector = d.getExtension(Selector);

  const displacement = d.canvas.displacement.round;
  const scale = Math.round(d.canvas.scale * 100) / 100;
  const mouse = Mouse.getInstance().coordinates;
  const selected = selector?.selectedNodes[0]
    ? selector?.selectedNodes[0].box.copy().round
    : null;

  const measure = Math.round(measurer?.getMeassurement() || 0);

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
