import type { ReactNode } from 'react';

export const NodeTools = ({ children }: { children: ReactNode }) => {
  return <div className="node__tools">{children}</div>;
};
