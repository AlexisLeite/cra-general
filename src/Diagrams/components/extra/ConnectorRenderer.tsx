import { observer } from 'mobx-react-lite'
import { Diagram } from '../../store/Diagram'
import { Edge } from '../objects/Edge'
import { Cross } from '../objects/Cross'
import { Coordinates } from '../../store/Coordinates'
import { Svg } from './Svg'

export const ConnectorRenderer = observer(() => {
  const d = Diagram.use()

  const points = d.connector.arrowSteps

  return (
    <div className="diagram__connector">
      <Svg>
        {points && (
          <Edge
            points={points}
            width={2 * d.panzoom.scale}
            arrowSize={8 * d.panzoom.scale}
          />
        )}
        <Cross
          coordinates={d.panzoom.fit(new Coordinates([0, 0]))}
          stroke="#0000ff"
        />
      </Svg>
    </div>
  )
})
