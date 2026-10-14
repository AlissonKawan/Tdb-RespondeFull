const networkMetrics = [
  { value: '+18 mil', label: 'Dentistas Voluntários' },
  { value: '+90 mil', label: 'Jovens Atendidos' },
  { value: '12 Países', label: 'América Latina e Portugal' },
];

function HeroDashboardCard() {
  return (
    <section className="relative min-w-0" aria-labelledby="programas-acolhimento-title">
      <div className="absolute -inset-3 -z-10 rounded-[2.25rem] bg-gradient-to-br from-blue-300/35 via-white/10 to-sky-300/30 blur-2xl" />

      <div className="overflow-hidden rounded-[1.75rem] border border-white/90 bg-white/95 shadow-[0_28px_80px_-32px_rgba(15,23,42,0.45)] ring-1 ring-blue-950/5 backdrop-blur sm:rounded-[2rem]">
        <header className="border-b border-blue-100 bg-gradient-to-br from-blue-50 via-white to-sky-50 px-5 py-5 sm:px-6 sm:py-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-bold text-blue-800 shadow-sm">
            <svg className="h-3.5 w-3.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 3 5 6v5c0 4.6 2.8 8.2 7 10 4.2-1.8 7-5.4 7-10V6l-7-3Z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="m9.5 12 1.7 1.7 3.6-3.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            OSCIP <span className="text-blue-300" aria-hidden="true">•</span> Fundação em 2002
          </span>

          <h2 id="programas-acolhimento-title" className="mt-4 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            Programas de Acolhimento Social
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            A Turma do Bem transforma mensagens dispersas em atendimento odontológico digno e gratuito.
          </p>
        </header>

        <div className="grid gap-3 p-4 sm:p-5">
          <article className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 sm:p-5">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm shadow-blue-600/20">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M7.2 11.4a3.8 3.8 0 1 1 5.4-5.4A3.8 3.8 0 1 1 18 11.4L12.6 17a.85.85 0 0 1-1.2 0l-5.5-5.6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8.8 11.1c.9 1.2 2 1.8 3.2 1.8s2.3-.6 3.2-1.8" strokeLinecap="round" />
                </svg>
              </div>

              <div className="min-w-0 flex-1">
                <span className="inline-flex rounded-full border border-blue-200 bg-white px-2.5 py-1 text-[0.6875rem] font-bold leading-4 text-blue-800">
                  Crianças e Jovens (11 a 17 anos)
                </span>
                <h3 className="mt-2 text-lg font-black text-slate-950">Dentista do Bem</h3>
                <p className="mt-1.5 text-sm leading-6 text-slate-700">
                  Atendimento odontológico integral e gratuito realizado em consultórios particulares voluntários até completarem 18 anos. Mais de 90 mil jovens já foram transformados.
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-violet-200 bg-violet-50/65 p-4 sm:p-5">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-700 text-white shadow-sm shadow-violet-700/20">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M12 3 5 6v5c0 4.6 2.8 8.2 7 10 4.2-1.8 7-5.4 7-10V6l-7-3Z" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9.2 12.1 11 14l4-4.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <div className="min-w-0 flex-1">
                <span className="inline-flex rounded-full border border-violet-200 bg-white px-2.5 py-1 text-[0.6875rem] font-bold leading-4 text-violet-800">
                  Mulheres Sobreviventes de Violência
                </span>
                <h3 className="mt-2 text-lg font-black text-slate-950">Apolônias do Bem</h3>
                <p className="mt-1.5 text-sm leading-6 text-slate-700">
                  Reabilitação bucal integral para mulheres que sofreram violência doméstica, restabelecendo a saúde, o sorriso e a dignidade com protocolo de sigilo absoluto. Mais de 1.200 mulheres acolhidas.
                </p>
              </div>
            </div>
          </article>
        </div>

        <footer className="border-t border-slate-200 bg-slate-950 px-4 py-4 text-white sm:px-5 sm:py-5">
          <p className="mb-3 text-xs font-semibold text-sky-300">Impacto da rede Turma do Bem</p>
          <dl className="grid grid-cols-1 gap-2 min-[390px]:grid-cols-3">
            {networkMetrics.map((metric) => (
              <div key={metric.label} className="flex flex-col rounded-xl border border-white/10 bg-white/[0.07] px-3 py-3">
                <dt className="order-2 text-[0.6875rem] font-medium leading-4 text-slate-300">{metric.label}</dt>
                <dd className="order-first mb-1 text-lg font-black leading-none tracking-tight text-white sm:text-xl">{metric.value}</dd>
              </div>
            ))}
          </dl>
        </footer>
      </div>
    </section>
  );
}

export default HeroDashboardCard;
