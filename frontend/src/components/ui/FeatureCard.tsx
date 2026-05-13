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
    blue: 'bg-blue-50 text-[#2563EB] ring-blue-100',
    sky: 'bg-sky-50 text-[#1E3A8A] ring-sky-100',
    orange: 'bg-orange-50 text-orange-600 ring-orange-100',
    slate: 'bg-slate-50 text-[#0F172A] ring-[#E2E8F0]',
  };

  return (
    <Card
      className={`group relative flex h-full min-h-52 flex-col overflow-hidden p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/8 ${
        destaque 
          ? 'border-blue-200 shadow-lg shadow-blue-950/5 ring-1 ring-blue-100' 
          : ''
      }`}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#2563EB] via-[#60A5FA] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-2xl ring-1 ${tones[tone]}`}>
        {icon}
      </div>
      <h3 className="mb-2 text-base font-bold text-[#0F172A]">{title}</h3>
      <p className="text-sm leading-6 text-[#475569]">{description}</p>
      {destaque && (
        <span className="mt-auto inline-flex w-fit rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#2563EB]">
          Fluxo principal
        </span>
      )}
    </Card>
  );
}

export default FeatureCard;
