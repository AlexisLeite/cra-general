import { observer } from 'mobx-react-lite';
import { Diagram } from '../store/Diagram';
import { ConnectorRenderer } from './extra/ConnectorRenderer';
import { Stats } from './extra/Stats';
import { Tools } from './extra/Tools';

import './index.css';
import { Measurement } from './extra/Measurement';
import { Selection } from './extra/Selection';
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
