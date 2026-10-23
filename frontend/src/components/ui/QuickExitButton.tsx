import { quickExit } from '../../services/quickExit';

export default function QuickExitButton() {
  return (
    <button
      type="button"
      onClick={quickExit}
      aria-label="Saída rápida para o YouTube"
      title="Abre o YouTube nesta aba e sai da conta. Não apaga o histórico do navegador."
      className="inline-flex min-h-11 shrink-0 flex-col items-center justify-center rounded-ui border border-border bg-surface px-3 py-1 text-foreground shadow-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <span className="text-sm font-semibold">Saída rápida</span>
      <span className="text-xs text-muted-foreground">Não apaga o histórico</span>
    </button>
  );
}
