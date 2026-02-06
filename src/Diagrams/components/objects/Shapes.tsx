import { observer } from 'mobx-react-lite';
import { Diagram } from '../../store/Diagram';
import { RenderEdge } from './RenderEdge';
import { Shape } from './Shape';
import { getRectPath } from '../../util/shapes';
import { Node } from '../../store/elements/Node';
import { Edge } from '../../store/elements/Edge';
import { GatewayRender } from '../extra/GatewayRender';
import { makeScalableComponent } from './makeScalableComponent';
import { RenderCustomRenderers } from './CustomRenderers';
import { Selector } from '../../store/extensions/Selector';
import { runInAction } from 'mobx';

const ShapeWrap = observer(({ node }: { node: Node }) => {
  if (!node.parent) {
    return null;
  }

  return (
    <>
      {!node.Renderer && (
        <Shape
          key={node.id}
          paths={[
            {
              d: getRectPath(node.box, 10),
              stroke: node.state.stroke,
              strokeWidth: node.state.strokewWidth ?? 3,
              fill: node.state.fill,
            },
          ]}
          onMouseOver={() => {
            runInAction(() => {
              node.state.hover = true;
            });
          }}
          onMouseOut={(ev) => {
            const nextTarget = ev.relatedTarget;
            if (
              nextTarget instanceof Element &&
              nextTarget.closest(
                `[data-id="${node.id}"], [data-gateway-parent="${node.id}"]`,
              )
            ) {
              return;
            }

            runInAction(() => {
              node.state.hover = false;
            });
          }}
          className={node.classList.string}
          label={node.state.label}
          labelOffset={node.coordinates.sum(node.box.size.half)}
          labelFontSize={node.state.labelFontSize ?? 14}
          selected={node.selected}
          data-id={node.id}
        />
      )}
    </>
  );
});

const DiagramEdge = observer(({ edge }: { edge: Edge }) => {
  return (
    <RenderEdge
      edge={edge}
      points={edge.steps}
      endType={edge.arrowHeadEnd ?? 'arrow'}
      startType={edge.arrowHeadStart ?? 'none'}
      lineStyle={edge.lineStyle ?? 'solid'}
      color={edge.stroke}
      width={edge.strokeWidth ?? 2}
      draggable
      onMidpointMouseDown={(m, ev) => {
        edge.dragStart(m, ev);
      }}
    />
  );
});

const ScalableShapes = makeScalableComponent(
  observer(() => {
    const d = Diagram.use();
    const selector = d.getExtension(Selector);
    const selectedNodes = selector?.selectedNodes ?? [];
    const orderedNodes = [
      ...d.nodes.filter((node) => !selectedNodes.includes(node)),
      ...selectedNodes,
    ];
    const visibleGateways = orderedNodes
      .filter((node) => node.state.hover || node.selected)
      .flatMap((node) => node.gateways);

    return (
      <>
        {orderedNodes.map((node) => (
          <ShapeWrap node={node} key={node.id} />
        ))}
        {d.edges.map((c) => (
          <DiagramEdge edge={c} key={c.id} />
        ))}
        {visibleGateways.map((gateway) => (
          <GatewayRender
            gateway={gateway}
            key={`${gateway.parent.id}-${gateway.id}`}
          />
        ))}
      </>
    );
  }),
);

export function shapes() {
  return [
    <ScalableShapes key="ScalableShapes" />,
    <RenderCustomRenderers key="RenderCustomRenderers" />,
  ];
}
