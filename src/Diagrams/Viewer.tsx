import { observer } from 'mobx-react-lite';
import { Diagram } from './store/Diagram';
import { ConnectorRenderer } from './components/extra/ConnectorRenderer';
import { Stats } from './components/extra/Stats';
import { Tools } from './components/extra/Tools';

import './index.css';
import { Measurement } from './components/extra/Measurement';
import { Selection } from './components/extra/Selection';
import { Grid } from './components/objects/Grid';
import { Canvas } from './components/Canvas';
import { Stage } from './layout/HStack';
import { ShapesShowcase } from './components/ShapesShowcase';
import { AlignmentSuggestions } from './components/extra/AlignmentSuggestions';

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
