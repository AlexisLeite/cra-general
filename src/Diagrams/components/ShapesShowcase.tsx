import { CollapsiblePanel } from '../layout/CollapsiblePanel';
import { TaskNode } from '../custom/bpmn/nodes/TaskNode';
import { Diagram } from '../store/Diagram';
import { Mouse } from '../util/Mouse';
import { useRef, type MouseEvent } from 'react';
import { Dragger } from '../store/extensions/Dragger';
import { EventNode } from '../custom/bpmn/nodes/EventNode';
import { GateNode } from '../custom/bpmn/nodes/GateNode';
import type { BPMNode } from '../custom/bpmn/nodes/BPMNode';
import { Selector } from '../store/extensions/Selector';
import { getId } from '../util/getId';

const event = new EventNode(null, {
  id: 'event-1',
  label: '',
});
const gate = new GateNode(null, {
  id: 'gate-1',
  label: '',
});
const task = new TaskNode(null, {
  id: 'task-1',
  label: '',
});

function createNode(d: Diagram, type: string, ev: MouseEvent) {
  ev.nativeEvent.stopImmediatePropagation();

  let node: BPMNode | null = null;
  const id = getId(d, type);

  switch (type) {
    case 'event':
      node = new EventNode(null, {
        id,
        label: `Event ${id}`,
        movable: true,
      });
      break;
    case 'task':
      node = new TaskNode(null, {
        id,
        label: `Task ${id}`,
        movable: true,
      });
      break;
    case 'gate':
      node = new GateNode(null, {
        id,
        label: ``,
        movable: true,
      });
      break;
  }

  if (node !== null) {
    d.add(node);
    node.setPosition(
      d.canvas.inverseFit(Mouse.getInstance().coordinates.substract([100, 50])),
    );
    d.rules.displaceWhenDragOnEdges = false;
    d.getExtension(Dragger)?.startDrag(node);
    d.getExtension(Selector).selectNode(node);
  }
}

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
      <div onMouseDownCapture={createNode.bind(createNode, d, 'task')}>
        <task.Renderer />
      </div>
      <div onMouseDownCapture={createNode.bind(createNode, d, 'event')}>
        <event.Renderer />
      </div>
      <div onMouseDownCapture={createNode.bind(createNode, d, 'gate')}>
        <gate.Renderer />
      </div>
    </CollapsiblePanel>
  );
};
