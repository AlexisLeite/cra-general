import { CollapsiblePanel } from '../layout/CollapsiblePanel';
import { TaskNode } from '../custom/bpmn/nodes/TaskNode';
import { Diagram } from '../store/Diagram';
import { Mouse } from '../util/Mouse';
import { useRef } from 'react';
import { Dragger } from '../store/extensions/Dragger';
import { EventNode } from '../custom/bpmn/nodes/EventNode';

const maxIds: Record<string, number> = {};
function getId(diagram: Diagram, prefix: string) {
  let n = maxIds[prefix] || 0;
  while (diagram.getNodeById(`${prefix}${n}`)) {
    n++;
  }
  return n;
}

const event = new EventNode(null, {
  id: 'event-1',
  label: 'Event',
});

export const ShapesShowcase = () => {
  const d = Diagram.use();

  const uns = useRef(() => {});

  return (
    <CollapsiblePanel
      title="Tools"
      id="Showcase"
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
        onMouseDownCapture={(ev) => {
          ev.nativeEvent.stopImmediatePropagation();

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

          d.getExtension(Dragger)?.startDrag(task);
        }}
      >
        Task
      </div>
      <div
        onMouseDownCapture={(ev) => {
          ev.nativeEvent.stopImmediatePropagation();

          const id = getId(d, 'task');

          const event = new EventNode(null, {
            id: `event${id}`,
            label: `Event ${id}`,
            movable: true,
          });

          d.add(event);
          event.setPosition(
            d.canvas.inverseFit(
              Mouse.getInstance().coordinates.substract([100, 50]),
            ),
          );

          d.rules.displaceWhenDragOnEdges = false;
          d.getExtension(Dragger)?.startDrag(event);
        }}
      >
        <event.Renderer />
      </div>
    </CollapsiblePanel>
  );
};
