import { forwardRef, SVGProps } from 'react';

export const Svg = forwardRef<any, SVGProps<SVGSVGElement>>(
  ({ children, className, style }, ref) => {
    return (
      <svg
        className={className}
        width="100%"
        height="100%"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          ...style,
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {children}
      </svg>
    );
  },
);
