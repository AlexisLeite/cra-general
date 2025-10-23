import { observer } from 'mobx-react-lite'
import { Diagram } from '../../store/Diagram'
import { Mouse } from '../../util/Mouse'

export const Stats = observer(() => {
  const d = Diagram.use()

  const displacement = d.panzoom.displacement.round
  const scale = Math.round(d.panzoom.scale * 10) / 10
  const mouse = Mouse.getInstance().coordinates
  const selected = d.selectedNode
    ? d.selectedNode.coordinates.copy().round.nonObserved
    : null

  return (
    <div className="diagram__stats">
      <pre>
        {`

displacement: ${displacement}
scale: ${scale}
mouse: ${mouse}
mouse-fit: ${
          d.panzoom.inverseFit(mouse.copy().substract(d.panzoom.canvasPosition))
            .round
        }
${selected ? `selected: ${selected}` : ''}

`.trim()}
      </pre>
    </div>
  )
})
