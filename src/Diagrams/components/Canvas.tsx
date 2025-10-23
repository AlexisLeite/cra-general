import { observer } from 'mobx-react-lite'
import { Diagram } from '../store/Diagram'
import { ConnectorRenderer } from './extra/ConnectorRenderer'
import { Stats } from './extra/Stats'
import { Edge } from './objects/Edge'
import { Svg } from './extra/Svg'
import { Shape } from './objects/Shape'
import { getRectPath } from '../util/shapes'

const Nodes = observer(() => {
  const d = Diagram.use()
  return (
    <Svg scale>
      {d.nodes.map((c) => (
        <Shape
          key={c.id}
          paths={[
            {
              d: getRectPath(c.box, 10),
              strokeWidth: 3,
            },
          ]}
          label={c.state.label}
          labelOffset={c.coordinates.sum(c.box.size.half)}
          labelFontSize={14}
        />
      ))}
    </Svg>
  )
})

export const Canvas = observer(() => {
  const d = Diagram.use()

  const translation = d.panzoom.displacement.copy().multiply(d.panzoom.scale)

  return (
    <div
      className={`diagram__canvas ${d.panzoom.dragging ? 'avoid-selection' : ''}`}
      ref={d.panzoom.useRef}
    >
      <div
        style={{
          width: 50000,
          height: 50000,
          transform: `translate(${translation.x}px, ${translation.y}px) scale(${d.panzoom.scale})`,
          transformOrigin: '0 0',
          willChange: 'transform',
        }}
      >
        <Nodes />
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
