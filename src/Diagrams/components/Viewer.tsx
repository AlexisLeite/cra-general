import { observer } from 'mobx-react-lite';
import { Diagram } from '../store/Diagram';
import { ConnectorRenderer } from './extra/ConnectorRenderer';
import { Stats } from './extra/Stats';
import { Tools } from './extra/Tools';

import './index.css';
import { Measurement } from './extra/Measurement';
import { Cross } from './objects/Cross';
import { Coordinates } from '../store/primitives/Coordinates';
import { Selection } from './extra/Selection';
import { shapes } from './objects/Shapes';
import { Grid } from './objects/Grid';
import { Canvas } from './Canvas';
import { Stage } from '../layout/HStack';
import { CollapsiblePanel } from '../layout/CollapsiblePanel';

export const Viewer = observer(({ diagram }: { diagram: Diagram }) => {
  return (
    <diagram.Context>
      <Stage>
        <CollapsiblePanel title="Tools" defaultWidth={280}>
          Hello world
        </CollapsiblePanel>
        <Canvas>
          <Grid />
          {shapes()}
          <Cross
            coordinates={new Coordinates([5000, 5000])}
            stroke="#0000ff"
            size={20}
            strokeWidth={2}
          />
          <ConnectorRenderer />
          <Measurement />
          <Selection />
        </Canvas>
      </Stage>
      <Tools />
      <Stats />
    </diagram.Context>
  );
});
