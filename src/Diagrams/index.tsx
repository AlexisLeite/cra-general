import { Viewer } from './components/Viewer'
import { Diagram } from './store/Diagram'
import { Dimensions } from './store/Dimensions'
import { Node } from './store/Node'

const d = new Diagram()

let cols = 20
const nodes = 5

function x(n: number) {
  return (n % cols) * 170
}
function y(n: number) {
  return Math.floor(n / cols) * 100
}

for (let i = 0; i < nodes; i++) {
  d.add(
    new Node({
      id: String(i),
      label: 'World' + i,
      box: new Dimensions([x(i), y(i), 150, 80]),
    }),
  )
}

export const Diagrams = () => {
  return <Viewer diagram={d} />
}
