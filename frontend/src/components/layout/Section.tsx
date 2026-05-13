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
    base: 'bg-[#F8FAFC]',
    white: 'bg-white',
    blue: 'bg-gradient-to-b from-white to-[#EFF6FF]',
  };

  return (
    <section className={`py-16 ${tones[tone]} ${className}`}>
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}

export default Section;

