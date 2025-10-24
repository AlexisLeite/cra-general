import type { Coordinates } from '../../store/Coordinates';

export interface RedCrossProps {
  coordinates: Coordinates;
  size?: number;
  strokeWidth?: number;
  rounded?: boolean;
  stroke?: string;
}

export const Cross: React.FC<RedCrossProps> = ({
  coordinates,
  size = 20,
  strokeWidth = 2,
  rounded = true,
  stroke = '#ff0000',
}) => {
  const half = size / 2;
  const lineCap: 'round' | 'butt' | 'square' = rounded ? 'round' : 'butt';

  return (
    <>
      <line
        x1={coordinates.x - half}
        y1={coordinates.y}
        x2={coordinates.x + half}
        y2={coordinates.y}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap={lineCap}
      />
      <line
        x1={coordinates.x}
        y1={coordinates.y - half}
        x2={coordinates.x}
        y2={coordinates.y + half}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap={lineCap}
      />
    </>
  );
};
