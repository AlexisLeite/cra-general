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
import { RenderCustomRenderers } from './objects/CustomRenderers';

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
        <RenderCustomRenderers diagram={diagram} />
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
