import type { ReactNode } from 'react';

type SoftCardProps = {
  children: ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
};

export default function SoftCard({
  children,
  className = '',
  as: Tag = 'div',
}: SoftCardProps) {
  return (
    <Tag className={`soft-card ${className}`.trim()}>
      {children}
    </Tag>
  );
}
