import { observer } from 'mobx-react-lite';
import { Diagram } from '../../store/Diagram';
import { Fragment } from 'react/jsx-runtime';

export const Grid = observer(() => {
  const d = Diagram.use();

  if (!d.showGrid) {
    return null;
  }

  const positions: number[] = [];
  const size = d.canvas.size.x;
  const gridSize = d.gridSize;
  for (let i = 0; i <= size; i += gridSize) {
    positions.push(i);
  }

  return (
    <>
      {positions.map((p) => (
        <Fragment key={`h_${p}`}>
          <path
            d={`M ${p} 0 L ${p} ${size}`}
            stroke={p % 500 === 0 ? '#ccc' : '#eee'}
            strokeWidth={1}
          ></path>
          <path
            d={`M 0 ${p} L ${size} ${p}`}
            stroke={p % 500 === 0 ? '#ccc' : '#eee'}
            strokeWidth={1}
          ></path>
        </Fragment>
      ))}
    </>
  );
});
