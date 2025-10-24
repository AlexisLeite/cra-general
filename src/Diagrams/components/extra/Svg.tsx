import { CSSProperties, forwardRef, ReactNode, useState } from 'react';

export const Svg = forwardRef<
  any,
  {
    children: ReactNode;
    className?: string;
    style?: CSSProperties;
  }
>(({ children, className, style }, ref) => {
  const [viewBox, setViewBox] = useState('0 0 400 200');

  return (
    <svg
      className={className}
      width="100%"
      height="100%"
      viewBox={viewBox}
      style={style}
      ref={(el) => {
        try {
          (ref as any)(el);
        } catch (_) {}

        if (el instanceof SVGElement && !el.dataset.set) {
          el.dataset.set = 'true';
          const rect = el.getBoundingClientRect();
          setViewBox(`0 0 ${rect.width} ${rect.height}`);
        }
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  );
});
