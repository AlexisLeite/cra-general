import { SVGAttributes } from 'react';
import { Diagram } from '../../../store/Diagram';

interface IconBaseProps extends SVGAttributes<SVGElement> {
  size?: string | number;
  color?: string;
  title?: string;
}

const MiSnapToGrid = (props: IconBaseProps) => (
  <svg
    viewBox="0 0 256 256"
    fill="currentColor"
    height="1em"
    width="1em"
    {...props}
  >
    {props.title && <title>{props.title}</title>}
    <path d="M200,44H56A12,12,0,0,0,44,56V200a12,12,0,0,0,12,12H200a12,12,0,0,0,12-12V56A12,12,0,0,0,200,44Zm4,12v68H132V52h68A4,4,0,0,1,204,56ZM56,52h68v72H52V56A4,4,0,0,1,56,52ZM52,200V132h72v72H56A4,4,0,0,1,52,200Zm148,4H132V132h72v68A4,4,0,0,1,200,204Z" />
    <circle cx="50" cy="50" r="50" stroke="black" fill="black" />
  </svg>
);

export function SnapToGridTool() {
  const d = Diagram.use();

  return (
    <MiSnapToGrid
      className={`tool ${d.snapToGrid ? 'selected' : ''}`}
      onClick={() => d.toggleSnapToGrid()}
      title="Snap to grid"
    />
  );
}
