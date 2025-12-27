import { observer } from 'mobx-react-lite';
import { Diagram } from '../../store/Diagram';
import { makeBackScalableComponent } from './makeScalableComponent';
import { Aligner } from '../../store/tools/Aligner';

// Define the factor for the major line spacing (e.g., every 10 minor lines)
const MAJOR_GRID_FACTOR = 10;

export const Grid = makeBackScalableComponent(
  observer(() => {
    const d = Diagram.use();
    const aligner = d.getExtension(Aligner);

    if (!d.showGrid || !aligner) {
      return null;
    }

    const minorGridSize = aligner.gridSize; // e.g., 50
    const majorGridSize = minorGridSize * MAJOR_GRID_FACTOR; // e.g., 500
    const size = d.canvas.size.x; // Used to size the main coverage rect

    // This component assumes it's rendered directly inside the main <svg> tag.
    return (
      <>
        <defs>
          {/* 1. Minor Grid Pattern: Defines the smallest repeatable unit */}
          <pattern
            id="grid-minor"
            width={minorGridSize}
            height={minorGridSize}
            patternUnits="userSpaceOnUse"
          >
            {/* Draw a small cross or a pair of lines for the minor grid unit */}
            {/* M StartX StartY L EndX EndY (Draws horizontal and vertical lines at the edge of the tile) */}
            <path
              d={`M ${minorGridSize} 0 L 0 0 L 0 ${minorGridSize}`}
              fill="none"
              className="grid_line minor"
              strokeWidth={1}
            />
          </pattern>

          {/* 2. Major Grid Pattern: Defines the larger unit that includes the minor pattern */}
          <pattern
            id="grid-major"
            width={majorGridSize}
            height={majorGridSize}
            patternUnits="userSpaceOnUse"
          >
            {/* Fill the major tile with the repeating minor pattern */}
            <rect width="100%" height="100%" fill="url(#grid-minor)" />

            {/* Overlay the thick, strong lines along the major tile boundary */}
            <path
              d={`M ${majorGridSize} 0 L 0 0 L 0 ${majorGridSize}`}
              fill="none"
              className="grid_line strong"
              strokeWidth={2} // Thicker stroke for the strong line
            />
          </pattern>
        </defs>

        {/* 3. Coverage Rectangle: Fills the entire visible area with the major pattern */}
        <rect
          x={0}
          y={0}
          width={size} // Use d.canvas.size.x as a minimum, but using "100%" often works better
          height={size} // Use "100%" or a very large number if the SVG bounds are the viewport
          fill="url(#grid-major)"
        />
      </>
    );
  }),
);
