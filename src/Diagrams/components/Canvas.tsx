import { observer } from 'mobx-react-lite'
import { Coordinates } from '../store/Coordinates'
import { Diagram } from '../store/Diagram'
import { Default } from './objects/DefaultNode'
import { NodeTools } from './extra/NodeTools'
import { ConnectorRenderer } from './extra/ConnectorRenderer'
import { Stats } from './extra/Stats'
import { Edge } from './objects/Edge'
import { Svg } from './extra/Svg'

export const Canvas = observer(() => {
  const d = Diagram.use()

  const box = d.panzoom.fit(new Coordinates([0, 0]))

  return (
    <div className="diagram__canvas" ref={d.panzoom.useRef}>
      <div
        className="diagram__panzoom"
        style={{
          transform: `translate(${box.get(0)}px, ${box.get(1)}px) scale(${d.panzoom.scale})`,
        }}
      >
        {d.nodes.map((c) => (
          <Default key={c.state.id} node={c} />
        ))}
        <NodeTools />
      </div>
      <Svg>
        {d.edges.map((c) => (
          <Edge
            key={`${c.state.from.id}__${c.state.to.id}`}
            points={[
              c.state.from.box.rightMiddle,
              c.state.to.box.leftMiddle,
            ].map((c) => d.panzoom.fit(c))}
          />
        ))}
      </Svg>
      <ConnectorRenderer />
      <Stats />
    </div>
  )
})
