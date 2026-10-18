import type { ReactNode } from 'react';

export type AtendimentoIconName = 'back' | 'panel' | 'close' | 'calendar' | 'record' | 'chat' | 'user' | 'priority' | 'copy' | 'phone' | 'history' | 'chevron' | 'end';

// Mesma linguagem SVG utilizada na navegação do sistema, sem dependência adicional.
const paths: Record<AtendimentoIconName, ReactNode> = {
  back: <path d="m14 6-6 6 6 6M8 12h13" />,
  panel: <><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M15 4v16m-5-12-4 4 4 4" /></>,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4m8-4v4M3 11h18m-13 4h3m2 0h3" /></>,
  record: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 3h6v4H9zm0 9h6m-6 4h4" /></>,
  chat: <><path d="M7 19 3 21v-6a9 9 0 1 1 4 4Z" /><path d="M8 10h8m-8 4h5" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></>,
  priority: <><path d="M6 20v-6m6 6V5m6 15V10" /><path d="M3 20h18" /></>,
  copy: <><rect x="8" y="8" width="13" height="13" rx="2" /><path d="M16 8V3H3v13h5" /></>,
  phone: <path d="M8 3H4a1 1 0 0 0-1 1 17 17 0 0 0 17 17 1 1 0 0 0 1-1v-4l-5-2-2 3a12 12 0 0 1-7-7l3-2Z" />,
  history: <><path d="M3 10a9 9 0 1 1 2 8M3 4v6h6" /><path d="M12 7v5l3 2" /></>,
  chevron: <path d="m6 9 6 6 6-6" />,
  end: <><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6m0-6-6 6" /></>,
};

export default function AtendimentoIcon({ name, className = 'h-5 w-5' }: { name: AtendimentoIconName; className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`} aria-hidden="true">{paths[name]}</svg>;
}
