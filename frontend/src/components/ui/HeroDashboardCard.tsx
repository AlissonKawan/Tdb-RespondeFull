import ChartCard from './ChartCard';

function HeroDashboardCard() {
  return (
    <div className="relative min-w-0" aria-label="Exemplo de triagem com dados protegidos">
      <div className="absolute -inset-3 -z-10 rounded-[2.25rem] bg-gradient-to-br from-blue-300/35 via-white/10 to-sky-300/30 blur-2xl" />

      <div className="overflow-hidden rounded-[1.75rem] border border-white/90 bg-white/95 shadow-[0_28px_80px_-32px_rgba(15,23,42,0.45)] ring-1 ring-blue-950/5 backdrop-blur sm:rounded-[2rem]">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/90 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>
          <div className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-slate-600">
            <svg className="h-3.5 w-3.5 shrink-0 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="5" y="10" width="14" height="10" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" strokeLinecap="round" />
            </svg>
            <span className="truncate">Ambiente protegido</span>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 ring-1 ring-blue-200">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 21a7 7 0 0 1 14 0" strokeLinecap="round" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500">Paciente identificado por codinome</p>
                <h2 className="mt-0.5 truncate text-lg font-bold text-slate-950">Sorriso Aurora</h2>
              </div>
            </div>

            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" aria-hidden="true" />
              Caso Urgente
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500">Necessidade sinalizada</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-900">Dor intensa e dificuldade para se alimentar</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-semibold text-amber-800">Status da triagem</p>
              <p className="mt-1 flex items-center gap-2 text-sm font-bold leading-6 text-amber-950">
                <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" aria-hidden="true" />
                Aguardando Dentista
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50/80 px-3.5 py-3 text-xs leading-5 text-blue-900">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M12 3 5 6v5c0 4.6 2.8 8.2 7 10 4.2-1.8 7-5.4 7-10V6l-7-3Z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="m9.5 12 1.7 1.7 3.6-3.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span><strong>Sigilo em primeiro lugar:</strong> dados pessoais ficam restritos à equipe responsável pelo acolhimento.</span>
          </div>
        </div>

        <ChartCard embedded />
      </div>
    </div>
  );
}

export default HeroDashboardCard;

