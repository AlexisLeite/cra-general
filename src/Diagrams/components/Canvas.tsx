import { observer } from 'mobx-react-lite';
import { Diagram } from '../store/Diagram';
import { Children, ReactElement, ReactNode } from 'react';
import { Svg } from './extra/Svg';
import { arrayOrArray } from '../util/arrayOrArray';
import { shapes } from './objects/Shapes';

export const Canvas = observer(({ children }: { children?: ReactNode }) => {
  const diagram = Diagram.use();

  const scalables: ReactElement[] = [];
  const rest: any[] = [];
  const back: ReactElement[] = [];

  Children.forEach([...arrayOrArray(children), ...shapes()], (c) => {
    if (((c as ReactElement).type as any).__scalable) {
      scalables.push(c as ReactElement);
    } else if (((c as ReactElement).type as any).__scalableBack) {
      back.push(c as ReactElement);
    } else {
      rest.push(c);
    }
  });

  return (
    <div className="canvas__frame">
      <div ref={diagram.canvas.useRef}>
        {back.length && <Svg className="background">{back}</Svg>}
        {rest}
        {scalables.length && <Svg className="foreground">{scalables}</Svg>}
      </div>
    </div>
  );
});
