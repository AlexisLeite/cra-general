import { observer } from 'mobx-react-lite';
import { Diagram } from '../../store/Diagram';
import { Mouse } from '../../util/Mouse';

export const Stats = observer(() => {
  const d = Diagram.use();

  const displacement = d.canvas.displacement.round;
  const scale = Math.round(d.canvas.scale * 10) / 10;
  const mouse = Mouse.getInstance().coordinates;
  const selected = d.selectedNode
    ? d.selectedNode.coordinates.copy().round.nonObserved
    : null;

  const measure = Math.round(d.measurer.getMeassurement() || 0);
  const scaledMeasure = Math.round(measure / d.canvas.scale);

  return (
    <div className="diagram__stats">
      <pre>
        {`

displacement: ${displacement}
scale: ${scale}
mouse: ${mouse}
mouse-fit: ${
          d.canvas.inverseFit(mouse.copy().substract(d.canvas.elementPosition))
            .round
        }
${selected ? `selected: ${selected}` : ''}
${
  measure
    ? `
measure: ${measure}
measure-fit: ${scaledMeasure}  
`.trim()
    : ''
}

`.trim()}
      </pre>
    </div>
  );
});
