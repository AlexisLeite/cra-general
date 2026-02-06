import { useRef, type MouseEvent } from 'react';
import { Coordinates } from '../../store/primitives/Coordinates';
import { Dimensions } from '../../store/primitives/Dimensions';
import { Dragger } from '../../store/extensions/Dragger';
import { Selector } from '../../store/extensions/Selector';
import type { AgentFlowController } from './AgentFlowController';
import type { AgentNodeKind } from './types';
import { ActionNode } from './nodes/ActionNode';
import { ConditionNode } from './nodes/ConditionNode';
import { OutcomeNode } from './nodes/OutcomeNode';
import { TriggerNode } from './nodes/TriggerNode';

const triggerPreview = new TriggerNode(null, {
  id: 'trigger-preview',
  label: 'Trigger',
  box: new Dimensions([0, 0, 96, 96]),
});
const actionPreview = new ActionNode(null, {
  id: 'action-preview',
  label: 'Action',
  box: new Dimensions([0, 0, 160, 84]),
});
const conditionPreview = new ConditionNode(null, {
  id: 'condition-preview',
  label: 'Condition',
  box: new Dimensions([0, 0, 112, 92]),
});
const outcomePreview = new OutcomeNode(null, {
  id: 'outcome-preview',
  label: 'Outcome',
  box: new Dimensions([0, 0, 104, 92]),
});

function createNode(
  controller: AgentFlowController,
  kind: AgentNodeKind,
  ev: MouseEvent,
) {
  ev.nativeEvent.stopImmediatePropagation();

  const diagram = controller.diagram;
  const mouseAtCreation = new Coordinates(ev.nativeEvent);
  const mouseInCanvas = diagram.canvas.inverseFit(mouseAtCreation.copy());

  const node = controller.createNode({
    kind,
    position: mouseInCanvas,
    centered: true,
    select: false,
  });

  diagram.rules.displaceWhenDragOnEdges = false;
  diagram.getExtension(Dragger)?.startDrag(node, mouseAtCreation);
  diagram.getExtension(Selector).clearSelection();
  diagram.getExtension(Selector).selectNode(node);
}

export const AgentShapesShowcase = ({
  controller,
}: {
  controller: AgentFlowController;
}) => {
  const resetDisplaceTimeout = useRef(() => {});
  const stopDiagramMouseDown = (ev: MouseEvent<HTMLDivElement>) => {
    ev.nativeEvent.stopImmediatePropagation();
  };

  return (
    <div
      className="diagram__plain_panel"
      id="AgentShapesShowcasePanel"
      onMouseDownCapture={stopDiagramMouseDown}
      onMouseLeave={() => {
        resetDisplaceTimeout.current();

        if (!controller.diagram.rules.displaceWhenDragOnEdges) {
          const timer = setTimeout(() => {
            controller.diagram.rules.displaceWhenDragOnEdges = true;
          }, 2000);

          resetDisplaceTimeout.current = () => {
            clearTimeout(timer);
          };
        }
      }}
    >
      <div className="collapsible_panel__header nodes" aria-expanded>
        <span className="collapsible_panel__title">Nodes</span>
      </div>
      <div className="collapsible_panel__content nodes">
        <div className="diagram__stats_section diagram__showcase_nodes">
          <div
            className="diagram__showcase_item"
            onMouseDownCapture={createNode.bind(createNode, controller, 'trigger')}
          >
            <triggerPreview.Renderer />
          </div>
          <div
            className="diagram__showcase_item"
            onMouseDownCapture={createNode.bind(createNode, controller, 'action')}
          >
            <actionPreview.Renderer />
          </div>
          <div
            className="diagram__showcase_item"
            onMouseDownCapture={createNode.bind(createNode, controller, 'condition')}
          >
            <conditionPreview.Renderer />
          </div>
          <div
            className="diagram__showcase_item"
            onMouseDownCapture={createNode.bind(createNode, controller, 'outcome')}
          >
            <outcomePreview.Renderer />
          </div>
        </div>
      </div>
    </div>
  );
};
