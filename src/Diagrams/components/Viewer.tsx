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
import { ShapesShowcase } from './ShapesShowcase';
import { AlignmentSuggestions } from './extra/AlignmentSuggestions';

export const Viewer = observer(({ diagram }: { diagram: Diagram }) => {
  return (
    <diagram.Context>
      <Stage>
        <ShapesShowcase />
        <Canvas>
          <Grid />
          <ConnectorRenderer />
          <Measurement />
          <AlignmentSuggestions />
          <Selection />
        </Canvas>
      </Stage>
      <Tools />
      <Stats />
    </diagram.Context>
  );
});
