import type { ReactNode } from 'react';

interface PageShellProps {
  children: ReactNode;
  className?: string;
}

function PageShell({ children, className = '' }: PageShellProps) {
  return <div className={`bg-[#F8FAFC] text-[#0F172A] ${className}`}>{children}</div>;
}

export default PageShell;

