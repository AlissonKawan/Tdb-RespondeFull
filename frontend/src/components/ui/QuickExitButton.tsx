import { useId } from 'react';
import { quickExit } from '../../services/quickExit';
import { useQuickExitVisibility } from './useQuickExitVisibility';

export default function QuickExitButton() {
  const historyNoticeId = useId();
  const visible = useQuickExitVisibility();
  if (!visible) return null;
  return (
    <>
      <button
        type="button"
        onClick={quickExit}
        aria-label="Saída rápida para o YouTube"
        aria-describedby={historyNoticeId}
        title="Abre o YouTube nesta aba e sai da conta. Não apaga o histórico do navegador."
        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-muted/60 px-3 text-sm font-medium text-muted-foreground transition-colors duration-fast hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4M14 8l4 4-4 4m-4-4h8" />
        </svg>
        <span>Saída rápida</span>
      </button>
      <span id={historyNoticeId} className="sr-only">Não apaga o histórico</span>
    </>
  );
}
