import type { HTMLAttributes, PropsWithChildren } from 'react';

type StageProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>>;

export function Stage({ children, className, ...rest }: StageProps) {
  return (
    <div {...rest} className={['stage', className].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}
