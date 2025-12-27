import type { PropsWithChildren } from 'react';

export function Stage({ children }: PropsWithChildren) {
  return <div className="stage">{children}</div>;
}
