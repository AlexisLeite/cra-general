import { observer } from 'mobx-react-lite';
import { Diagram } from '../store/Diagram';
import { Children, ReactElement, ReactNode } from 'react';
import { Svg } from './extra/Svg';

export const Canvas = observer(({ children }: { children?: ReactNode }) => {
  const diagram = Diagram.use();

  const scalables: ReactElement[] = [];
  const rest: any[] = [];

  Children.forEach(children, (c) => {
    if (((c as ReactElement).type as any).__scalable) {
      scalables.push(c as ReactElement);
    } else {
      rest.push(c);
    }
  });

  return (
    <div className="canvas__frame">
      <div ref={diagram.canvas.useRef}>
        {rest}
        {scalables.length && <Svg>{scalables}</Svg>}
      </div>
    </div>
  );
});
