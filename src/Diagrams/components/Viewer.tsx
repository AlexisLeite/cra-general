import { observer } from 'mobx-react-lite';
import { Diagram } from '../store/Diagram';
import { ConnectorRenderer } from './extra/ConnectorRenderer';
import { Stats } from './extra/Stats';
import { NodeTools } from './extra/NodeTools';
import { Tools } from './extra/Tools';

import './index.scss';
import { Measurement } from './extra/Measurement';
import { Svg } from './extra/Svg';
import { Cross } from './objects/Cross';
import { Coordinates } from '../store/primitives/Coordinates';
import { Selection } from './extra/Selection';
import { Shapes } from './objects/Shapes';
import { Grid } from './objects/Grid';

export const Viewer = observer(({ diagram }: { diagram: Diagram }) => {
  return (
    <diagram.Context>
      <div className="canvas__frame">
        <Svg ref={diagram.canvas.useRef} shapeRendering="geometricPrecision">
          <Grid />
          <Shapes />
        </Svg>
        <Stats />
        <NodeTools />
        <Tools />
        <Svg className="diagram__extra">
          <Cross
            coordinates={diagram.canvas.fit(new Coordinates([5000, 5000]))}
            stroke="#0000ff"
            size={diagram.canvas.fit(20)}
            strokeWidth={diagram.canvas.fit(2)}
          />
          <ConnectorRenderer />
          <Measurement />
          <Selection />
        </Svg>
      </div>
    </diagram.Context>
  );
});
