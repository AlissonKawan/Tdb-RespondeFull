import { useEffect, useRef, type ReactNode } from 'react';
import AtendimentoIcon, { type AtendimentoIconName } from './AtendimentoIcon';

export function PainelSecao({ title, icon, children, defaultOpen = true }: { title: string; icon: AtendimentoIconName; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="atendimento-section group" open={defaultOpen}>
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2.5 rounded-xl px-3 text-sm font-bold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><AtendimentoIcon name={icon} className="h-4 w-4" /></span>
        <h3 className="flex-1">{title}</h3>
        <AtendimentoIcon name="chevron" className="atendimento-section-chevron h-4 w-4 text-muted-foreground" />
      </summary>
      <div className="space-y-3 px-3 pb-3">{children}</div>
    </details>
  );
}

export default function AtendimentoPanel({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const viewport = window.matchMedia('(min-width: 1280px)');
    const sync = () => {
      const focused = dialog.contains(document.activeElement) ? document.activeElement as HTMLElement : null;
      dialog.close();
      if (open) {
        if (viewport.matches) dialog.show();
        else dialog.showModal();
        focused?.focus();
      }
    };
    sync();
    viewport.addEventListener('change', sync);
    return () => { viewport.removeEventListener('change', sync); dialog.close(); };
  }, [open]);

  return (
    <dialog ref={ref} id="detalhes-atendimento" className="atendimento-panel" aria-labelledby="painel-atendimento-titulo" onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="flex min-h-16 shrink-0 items-center justify-between gap-2 border-b border-border px-4">
        <h2 id="painel-atendimento-titulo" className="text-base font-bold text-foreground">Detalhes do atendimento</h2>
        <button type="button" onClick={onClose} aria-label="Fechar detalhes do atendimento" className="atendimento-icon-button"><AtendimentoIcon name="close" /></button>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain p-3">{children}</div>
    </dialog>
  );
}
