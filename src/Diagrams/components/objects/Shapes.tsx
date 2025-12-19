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

const ShapeWrap = observer(({ node }: { node: Node }) => {
  return (
    <>
      {!node.state.Renderer && (
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
          onMouseOver={() => (node.state.hover = true)}
          onMouseOut={() => (node.state.hover = false)}
          className={`${node.selected ? 'selected' : ''} ${node.state.edition ? 'edition' : ''} diagram__node`}
          label={node.state.label}
          labelOffset={node.coordinates.sum(node.box.size.half)}
          labelFontSize={node.state.labelFontSize ?? 14}
          ref={node.useRef.bind(node)}
          selected={node.selected}
          data-id={node.id}
          onDoubleClick={(ev) => {
            ev.stopPropagation();
            node.toggleEdition();
          }}
        />
      )}
      {(node.state.hover || node.selected) &&
        node.gateways.map((c) => {
          return <GatewayRender key={c.id} gateway={c} />;
        })}
    </>
  );
});

const DiagramEdge = observer(({ edge }: { edge: Edge }) => {
  const diagram = Diagram.use();

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
        diagram.edgesDragger.startDrag(edge, m, ev);
      }}
    />
  );
});

const ScalableShapes = makeScalableComponent(
  observer(() => {
    const d = Diagram.use();
    return (
      <>
        {d.nodes
          .map((c) =>
            d.selectedNodes.find((s) => s === c) ? null : (
              <ShapeWrap node={c} key={c.id} />
            ),
          )
          .filter(Boolean)}
        {d.selectedNodes.map((c) => (
          <ShapeWrap node={c} key={c.id} />
        ))}
        {d.edges.map((c) => (
          <DiagramEdge edge={c} key={c.id} />
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
