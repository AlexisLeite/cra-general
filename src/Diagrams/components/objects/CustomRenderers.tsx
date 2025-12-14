import { observer } from 'mobx-react-lite';
import { Diagram } from '../../store/Diagram';
import { Node } from '../../store/elements/Node';

const RenderNode = observer(({ node }: { node: Node }) => {
  const diagram = Diagram.use();
  const R = node.state.Renderer!;

  return (
    <div
      onMouseOver={() => node.setState('hover', true)}
      onMouseOut={() => node.setState('hover', false)}
      onMouseDown={(ev) => diagram.canvas.handleMouseDown(ev)}
      key={node.id}
      data-id={node.id}
      className={`${node.selected ? 'selected' : ''} ${node.state.edition ? 'edition' : ''} diagram__node`}
      ref={node.useRef.bind(node)}
      style={{
        position: 'absolute',
        left: `${node.box.x}px`,
        top: `${node.box.y}px`,
        width: `${node.box.width}px`,
        height: `${node.box.height}px`,
        zIndex: node.state.hover ? 2 : 1,
      }}
    >
      <div>
        <R node={node} />
      </div>
    </div>
  );
});

const RenderNodes = observer(() => {
  const diagram = Diagram.use();

  return (
    <>
      {diagram.nodes
        .filter((c) => c.state.Renderer)
        .map((node) => {
          return <RenderNode node={node} key={node.id} />;
        })}
    </>
  );
});

export const RenderCustomRenderers = observer(() => {
  const diagram = Diagram.use();
  return (
    <div
      style={{
        width: `${diagram.canvas.size.x}px`,
        height: `${diagram.canvas.size.y}px`,
      }}
      onWheel={(ev) => diagram.canvas.handleWheel(ev.nativeEvent, true)}
      onMouseDown={(ev) => diagram.canvas.handleMouseDown(ev)}
    >
      <RenderNodes />
    </div>
  );
});
