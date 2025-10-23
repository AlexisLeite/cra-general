import { observer } from 'mobx-react-lite'
import { Diagram } from '../../store/Diagram'
import { FaCircleArrowRight } from 'react-icons/fa6'

export const NodeTools = observer(() => {
  const d = Diagram.use()

  if (!d.selectedNode) {
    return null
  }

  const nodeBox = d.selectedNode.box
  const box = nodeBox.copy().sum([nodeBox.width + 10, 0, 0, 0])
  const { left, top, height } = box.style

  return (
    <div
      className="diagram__node_tools"
      style={{ left, top: top + height / 2 }}
    >
      <FaCircleArrowRight
        className="diagram__node_connect_to diagram__node_tool"
        onMouseDownCapture={d.connector.startConnectionFrom.bind(
          d.connector,
          d.selectedNode,
        )}
      />
    </div>
  )
})
