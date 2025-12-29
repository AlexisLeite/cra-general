import { observer } from 'mobx-react-lite';
import { Diagram } from '../../store/Diagram';
import { Node } from '../../store/elements/Node';

const RenderNode = observer(({ node }: { node: Node }) => {
  const R = node.Renderer!;

  return <R />;
});

const RenderNodes = observer(() => {
  const diagram = Diagram.use();

  return (
    <>
      {diagram.nodes
        .filter((c) => c.Renderer)
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
    >
      <RenderNodes />
    </div>
  );
});
