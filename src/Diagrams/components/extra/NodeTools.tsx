import { observer } from 'mobx-react-lite';
import { Diagram } from '../../store/Diagram';
import { FaCircleArrowRight } from 'react-icons/fa6';

export const NodeTools = observer(() => {
  const d = Diagram.use();

  if (!d.selectedNode) {
    return null;
  }

  const { x: left, y: top } = d.canvas.fit(
    d.selectedNode.box.rightMiddle.sum([5 * d.canvas.scale, 0]),
  );

  return (
    <div
      className="diagram__node_tools"
      style={{
        left,
        top,
        background: 'transparent',
        height: '0',
      }}
    >
      <FaCircleArrowRight
        style={{
          transform: `scale(${d.canvas.scale})`,
          transformOrigin: '0',
          willChange: 'transform',
          shapeRendering: 'geometricPrecision',
        }}
        className="diagram__node_connect_to diagram__node_tool"
        onMouseDownCapture={d.connector.startConnectionFrom.bind(
          d.connector,
          d.selectedNode,
        )}
      />
    </div>
  );
});
