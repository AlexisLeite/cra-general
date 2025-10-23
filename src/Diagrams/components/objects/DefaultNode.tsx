import { observer } from 'mobx-react-lite'
import { type Node } from '../../store/Node'

export const Default = observer(({ node }: { node: Node }) => {
  const box = node.box //Diagram.use().panzoom.fit()

  return (
    <div
      className={`diagram__node ${node.state.selected ? '--selected-node' : ''}`}
      style={{
        left: box.x,
        top: box.y,
        width: node.box.width,
        height: node.box.height,
      }}
      ref={node.useRef.bind(node)}
    >
      {node.state.Renderer ? (
        <node.state.Renderer node={node} />
      ) : (
        node.state.label
      )}
    </div>
  )
})
