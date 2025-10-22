import { observer } from 'mobx-react-lite'
import { Diagram } from '../store/Diagram'
import { Canvas } from './Canvas'

import './index.scss'

export const Viewer = observer(({ diagram }: { diagram: Diagram }) => {
  return (
    <diagram.Context>
      <Canvas />
    </diagram.Context>
  )
})
