import type { ReactNode } from 'react';
import Container from '../ui/Container';

interface SectionProps {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  tone?: 'base' | 'white' | 'blue';
}

function Section({ children, className = '', containerClassName = '', tone = 'base' }: SectionProps) {
  const tones = {
    base: 'bg-background',
    white: 'bg-surface',
    blue: 'border-y border-blue-100 bg-blue-50/65',
  };

  return (
    <section className={`py-14 sm:py-16 ${tones[tone]} ${className}`}>
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}

export default Section;

