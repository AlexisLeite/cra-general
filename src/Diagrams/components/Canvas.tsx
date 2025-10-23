import { observer } from 'mobx-react-lite'
import { Diagram } from '../store/Diagram'
import { ConnectorRenderer } from './extra/ConnectorRenderer'
import { Stats } from './extra/Stats'
import { Edge } from './objects/Edge'
import { Svg } from './extra/Svg'
import { Shape } from './objects/Shape'
import { getRectPath } from '../util/shapes'
import { Cross } from './objects/Cross'
import { Coordinates } from '../store/Coordinates'

const Nodes = observer(() => {
  const d = Diagram.use()
  const translation = d.panzoom.displacement.copy().multiply(d.panzoom.scale)
  return (
    <Svg
      style={{
        width: 10000,
        height: 10000,
        transform: `translate(${translation.x + 450}px, ${translation.y + 300}px) scale(${d.panzoom.scale})`,
        transformOrigin: '0 0',
        willChange: 'transform',
      }}
    >
      <Cross coordinates={new Coordinates([5000, 5000])} stroke="#0000ff" />
      {d.nodes.map((c) => (
        <Shape
          key={c.id}
          paths={[
            {
              d: getRectPath(c.box, 10),
              strokeWidth: 3,
              fill: '#ffffff',
            },
          ]}
          label={c.state.label}
          labelOffset={c.coordinates.sum(c.box.size.half)}
          labelFontSize={14}
          ref={c.useRef.bind(c)}
          selected={c.state.selected}
        />
      ))}
      {d.edges.map((c) => (
        <Edge
          key={`${c.state.from.id}__${c.state.to.id}`}
          points={[c.state.from.box.rightMiddle, c.state.to.box.leftMiddle].map(
            (c) => d.panzoom.fit(c),
          )}
        />
      ))}
    </Svg>
  )
})

export const Canvas = observer(() => {
  const d = Diagram.use()

  return (
    <div
      className={`diagram__canvas ${d.panzoom.dragging ? 'avoid-selection' : ''}`}
      ref={d.panzoom.useRef}
    >
      <Nodes />
      <ConnectorRenderer />
      <Stats />
    </div>
  )
})
