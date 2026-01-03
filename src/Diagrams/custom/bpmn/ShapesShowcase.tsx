import { useRef, type MouseEvent } from 'react';
import { CollapsiblePanel } from '../../layout/CollapsiblePanel';
import { Diagram } from '../../store/Diagram';
import { Dragger } from '../../store/extensions/Dragger';
import { Selector } from '../../store/extensions/Selector';
import { getIdForNode } from '../../util/getIdForNode';
import { Mouse } from '../../util/Mouse';
import { BPMNode } from './nodes/BPMNode';
import { EventNode } from './nodes/EventNode';
import { GateNode } from './nodes/GateNode';
import { Lanes } from './nodes/Lanes';
import { TaskNode } from './nodes/TaskNode';

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

const lanes = new Lanes(null, { id: 'lanes-1' });
lanes.resetPools();
lanes.addPool().label = '';
lanes.addPool().label = '';

function createNode(d: Diagram, type: string, ev: MouseEvent) {
  ev.nativeEvent.stopImmediatePropagation();

  let node: BPMNode | null = null;
  const id = getIdForNode(d, type);

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
    case 'lane':
      node = new Lanes(null, { id });
  }

  if (node !== null) {
    d.add(node);
    node.setPosition(
      d.canvas.inverseFit(Mouse.getInstance().coordinates.substract([100, 50])),
    );
    d.rules.displaceWhenDragOnEdges = false;
    d.getExtension(Dragger)?.startDrag(node);
    d.getExtension(Selector).clearSelection();
    d.getExtension(Selector).selectNode(node);
  }
}

export const ShapesShowcase = () => {
  const d = Diagram.use();

  const uns = useRef(() => {});

  return (
    <>
      <CollapsiblePanel
        sections={[
          {
            key: 'nodes',
            title: 'Nodes',
            children: (
              <>
                <div
                  onMouseDownCapture={createNode.bind(createNode, d, 'task')}
                >
                  <task.Renderer />
                </div>
                <div
                  onMouseDownCapture={createNode.bind(createNode, d, 'event')}
                >
                  <event.Renderer />
                </div>
                <div
                  onMouseDownCapture={createNode.bind(createNode, d, 'gate')}
                >
                  <gate.Renderer />
                </div>
              </>
            ),
          },
          {
            key: 'groups',
            title: 'Groups',
            children: (
              <div onMouseDownCapture={createNode.bind(createNode, d, 'lane')}>
                <lanes.Renderer />
              </div>
            ),
          },
        ]}
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
      ></CollapsiblePanel>
    </>
  );
};
