import { observer } from 'mobx-react-lite';
import { Diagram } from './store/Diagram';
import { NodesConnectorRenderer } from './components/extra/NodesConnectorRenderer';
import { Stats } from './components/extra/Stats';
import { Tools } from './components/extra/Tools';

import { Measurement } from './components/extra/Measurement';
import { Selection } from './components/extra/Selection';
import { Grid } from './components/objects/Grid';
import { Canvas } from './components/Canvas';
import { Stage } from './layout/HStack';
import { ShapesShowcase } from './components/ShapesShowcase';
import { AlignmentSuggestions } from './components/extra/AlignmentSuggestions';

import './diagram.css';
import { PathFindingRenderer } from './components/extra/PathFindingRenderer';

export const Viewer = observer(({ diagram }: { diagram: Diagram }) => {
  return (
    <diagram.Context>
      <Stage>
        <ShapesShowcase />
        <Canvas>
          <Grid />
          <NodesConnectorRenderer />
          <Measurement />
          <AlignmentSuggestions />
          <Selection />
          <PathFindingRenderer />
        </Canvas>
      </Stage>
      <Tools />
      <Stats />
    </diagram.Context>
  );
});
