import { CollapsiblePanel } from '../layout/CollapsiblePanel';
import { TaskNode } from '../custom/bpmn/TaskNode';
import { Diagram } from '../store/Diagram';
import { Mouse } from '../util/Mouse';
import { useRef } from 'react';

let maxIds: Record<string, number> = {};
function getId(diagram: Diagram, prefix: string) {
  let n = maxIds[prefix] || 0;
  while (diagram.getNodeById(`${prefix}${n}`)) {
    n++;
  }
  return n;
}

export const ShapesShowcase = () => {
  const d = Diagram.use();

  const uns = useRef(() => {});

  return (
    <CollapsiblePanel
      title="Tools"
      defaultWidth={280}
      onMouseLeave={() => {
        uns.current();
        if (!d.rules.displaceWhenDragOnEdges) {
          const i = setTimeout(() => {
            d.rules.displaceWhenDragOnEdges = true;
          }, 2000);
          uns.current = () => {
            clearInterval(i);
          };
        }
      }}
    >
      <div
        className="diagram__node"
        style={{
          height: '80px',
        }}
        onMouseDown={() => {
          const id = getId(d, 'task');

          const task = new TaskNode(null, {
            id: `task${id}`,
            label: `Task ${id}`,
            movable: true,
          });

          d.add(task);
          task.setPosition(
            d.canvas.inverseFit(
              Mouse.getInstance().coordinates.substract([100, 50]),
            ),
          );
          task.setDimentions([200, 100]);
          d.rules.displaceWhenDragOnEdges = false;
          d.dragger.startDrag(task);
        }}
      >
        Task
      </div>
    </CollapsiblePanel>
  );
};
