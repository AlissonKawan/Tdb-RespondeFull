import Card from './Card';
import type { ReactNode } from 'react';

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  destaque?: boolean;
  tone?: 'blue' | 'sky' | 'orange' | 'slate';
}

function FeatureCard({ icon, title, description, destaque = false, tone = 'blue' }: FeatureCardProps) {
  const tones = {
    blue: 'bg-primary/10 text-primary ring-primary/20',
    sky: 'bg-accent/10 text-primary ring-accent/30',
    orange: 'bg-warning/10 text-warning ring-warning/20',
    slate: 'bg-muted text-foreground ring-border',
  };

  return (
    <Card
      className={`group relative flex h-full min-h-52 flex-col overflow-hidden p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 ${
        destaque
          ? 'border-primary/30 shadow-lg shadow-primary/5 ring-1 ring-primary/20'
          : ''
      }`}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-2xl ring-1 ${tones[tone]}`}>
        {icon}
      </div>
      <h3 className="mb-2 text-base font-bold text-foreground">{title}</h3>
      <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      {destaque && (
        <span className="mt-auto inline-flex w-fit rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          Fluxo principal
        </span>
      )}
    </Card>
  );
}

export default FeatureCard;
