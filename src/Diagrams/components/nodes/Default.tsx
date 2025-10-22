import { observer } from 'mobx-react-lite'
import { Diagram, type Node } from '../../store/Diagram'

export const Default = observer(({ node }: { node: Node }) => {
  const box = Diagram.use().panzoom.fit(node.state.box)

  return (
    <div
      className="diagram__node"
      style={{
        left: box.x - box.width / 2,
        top: box.y - box.height / 2,
        transform: `scale(${Diagram.use().panzoom.scale})`,
        width: node.state.box.width,
        height: node.state.box.height,
      }}
    >
      {node.state.label}
    </div>
  )
})
