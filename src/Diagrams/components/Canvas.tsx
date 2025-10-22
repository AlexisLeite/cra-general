import { Diagram } from '../store/Diagram'

export const Canvas = () => {
  const d = Diagram.use()

  return (
    <div className="diagram__canvas" ref={d.panzoom.useRef}>
      {d.nodes.map((c) => (
        <c.Renderer key={c.state.id} node={c} />
      ))}
    </div>
  )
}
