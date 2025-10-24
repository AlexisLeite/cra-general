import { observer } from 'mobx-react-lite';
import { Diagram } from '../store/Diagram';
import { NodesRenderer } from './NodesRenderer';
import { ConnectorRenderer } from './extra/ConnectorRenderer';
import { Stats } from './extra/Stats';
import { NodeTools } from './extra/NodeTools';
import { Tools } from './extra/Tools';

import './index.scss';
import { Measurement } from './extra/Measurement';
import { Svg } from './extra/Svg';
import { Cross } from './objects/Cross';
import { Coordinates } from '../store/Coordinates';
import { Selection } from './extra/Selection';

export const Viewer = observer(({ diagram }: { diagram: Diagram }) => {
  return (
    <diagram.Context>
      <div className="canvas__frame">
        <NodesRenderer />
        <Stats />
        <NodeTools />
        <Tools />
        <Svg className="diagram__extra">
          <Cross
            coordinates={diagram.canvas.fit(new Coordinates([5000, 5000]))}
            stroke="#0000ff"
            size={20 * diagram.canvas.scale}
            strokeWidth={2 * diagram.canvas.scale}
          />
          <ConnectorRenderer />
          <Measurement />
          <Selection />
        </Svg>
      </div>
    </diagram.Context>
  );
});
