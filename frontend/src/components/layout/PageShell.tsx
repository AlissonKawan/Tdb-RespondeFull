import type { ReactNode } from 'react';

interface PageShellProps {
  children: ReactNode;
  className?: string;
}

function PageShell({ children, className = '' }: PageShellProps) {
  return <div className={`bg-background text-foreground ${className}`}>{children}</div>;
}

export default PageShell;

