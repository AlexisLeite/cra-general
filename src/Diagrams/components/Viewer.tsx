import { observer } from 'mobx-react-lite';
import { Diagram } from '../store/Diagram';
import { ConnectorRenderer } from './extra/ConnectorRenderer';
import { Stats } from './extra/Stats';
import { Tools } from './extra/Tools';

import './index.css';
import { Measurement } from './extra/Measurement';
import { Svg } from './extra/Svg';
import { Cross } from './objects/Cross';
import { Coordinates } from '../store/primitives/Coordinates';
import { Selection } from './extra/Selection';
import { Shapes } from './objects/Shapes';
import { Grid } from './objects/Grid';
import type { Node } from '../store/elements/Node';

const RenderNode = observer(({ node }: { node: Node }) => {
  const diagram = Diagram.use();
  const R = node.state.Renderer!;

  return (
    <div
      onMouseOver={() => (node.state.hover = true)}
      onMouseOut={() => (node.state.hover = false)}
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
        zIndex: node.state.hover ? 1 : 0,
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

const Custom = observer(({ diagram }: { diagram: Diagram }) => {
  const translation = diagram.canvas.displacement
    .copy(false)
    .multiply(diagram.canvas.scale);

  return (
    <div
      style={{
        width: `${diagram.canvas.size.x}px`,
        height: `${diagram.canvas.size.y}px`,
        transform: `translate(${translation.x}px, ${translation.y}px) scale(${diagram.canvas.scale}) translateZ(0)`,
        transformOrigin: '0 0',
        willChange: 'transform',
      }}
      onWheel={(ev) => diagram.canvas.handleWheel(ev.nativeEvent)}
      onMouseDown={(ev) => diagram.canvas.handleMouseDown(ev)}
    >
      <RenderNodes />
    </div>
  );
});

export const Viewer = observer(({ diagram }: { diagram: Diagram }) => {
  return (
    <diagram.Context>
      <div className="canvas__frame">
        <Svg
          style={diagram.canvas.getDisplacementStyles()}
          shapeRendering="geometricPrecision"
        >
          <Grid />
        </Svg>
        <Custom diagram={diagram} />
        <Svg
          ref={diagram.canvas.useRef}
          shapeRendering="geometricPrecision"
          style={{ pointerEvents: 'none' }}
        >
          <Shapes />
          <Cross
            coordinates={new Coordinates([5000, 5000])}
            stroke="#0000ff"
            size={20}
            strokeWidth={2}
          />
          <ConnectorRenderer />
          <Measurement />
          <Selection />
        </Svg>
        <Stats />
        <Tools />
      </div>
    </diagram.Context>
  );
});
