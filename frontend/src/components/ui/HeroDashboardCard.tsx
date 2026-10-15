import { programImages } from '../../config/programImages';

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
        <header className="border-b border-blue-100 bg-gradient-to-br from-blue-50 via-white to-sky-50 px-5 py-6 sm:px-7 sm:py-7">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-bold text-blue-800 shadow-sm">
            <svg className="h-3.5 w-3.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 3 5 6v5c0 4.6 2.8 8.2 7 10 4.2-1.8 7-5.4 7-10V6l-7-3Z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="m9.5 12 1.7 1.7 3.6-3.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            OSCIP <span className="text-blue-300" aria-hidden="true">•</span> Fundação em 2002
          </span>

          <h2 id="programas-acolhimento-title" className="mt-4 text-3xl font-black tracking-[-0.03em] text-slate-950 sm:text-4xl">
            Programas de Acolhimento Social
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            A Turma do Bem transforma mensagens dispersas em atendimento odontológico digno e gratuito.
          </p>
        </header>

        <div className="grid gap-5 p-4 sm:p-6">
          <article className="group relative min-h-[18rem] overflow-hidden rounded-[1.5rem] border border-blue-300/50 bg-slate-950 shadow-[0_20px_45px_-24px_rgba(30,64,175,0.8)] sm:min-h-[20rem]">
            <img
              src={programImages.dentistaDoBem}
              alt="Adolescente sorrindo durante atendimento odontológico do programa Dentista do Bem"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-normal motion-safe:group-hover:scale-[1.025]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-blue-950/80 to-blue-950/10" aria-hidden="true" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-slate-950/10" aria-hidden="true" />

            <div className="relative z-10 flex min-h-[18rem] max-w-full flex-col justify-end p-5 text-white sm:min-h-[20rem] sm:max-w-[76%] sm:p-7">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-xs font-bold text-white shadow-sm backdrop-blur-md">
                <svg className="h-4 w-4 text-sky-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M7.2 11.4a3.8 3.8 0 1 1 5.4-5.4A3.8 3.8 0 1 1 18 11.4L12.6 17a.85.85 0 0 1-1.2 0l-5.5-5.6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8.8 11.1c.9 1.2 2 1.8 3.2 1.8s2.3-.6 3.2-1.8" strokeLinecap="round" />
                </svg>
                Crianças e Jovens (11 a 17 anos)
              </span>
              <h3 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">Dentista do Bem</h3>
              <p className="mt-3 text-sm leading-6 text-blue-50 sm:text-base sm:leading-7">
                Atendimento odontológico integral e gratuito em consultórios particulares voluntários até completarem 18 anos. <strong className="font-extrabold text-white">Mais de 90 mil jovens transformados.</strong>
              </p>
            </div>
          </article>

          <article className="group relative min-h-[18rem] overflow-hidden rounded-[1.5rem] border border-rose-300/50 bg-slate-950 shadow-[0_20px_45px_-24px_rgba(159,18,57,0.7)] sm:min-h-[20rem]">
            <img
              src={programImages.apoloniasDoBem}
              alt="Mulher sorrindo, representando acolhimento e dignidade no programa Apolônias do Bem"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover object-[center_30%] transition-transform duration-normal motion-safe:group-hover:scale-[1.025]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-rose-950/80 to-rose-950/10" aria-hidden="true" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-slate-950/10" aria-hidden="true" />

            <div className="relative z-10 flex min-h-[18rem] max-w-full flex-col justify-end p-5 text-white sm:min-h-[20rem] sm:max-w-[76%] sm:p-7">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-xs font-bold text-white shadow-sm backdrop-blur-md">
                <svg className="h-4 w-4 text-rose-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M12 3 5 6v5c0 4.6 2.8 8.2 7 10 4.2-1.8 7-5.4 7-10V6l-7-3Z" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9.2 12.1 11 14l4-4.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Mulheres Sobreviventes de Violência
              </span>
              <h3 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">Apolônias do Bem</h3>
              <p className="mt-3 text-sm leading-6 text-rose-50 sm:text-base sm:leading-7">
                Reabilitação bucal integral com sigilo absoluto para restabelecer saúde, sorriso e dignidade. <strong className="font-extrabold text-white">Mais de 1.200 mulheres acolhidas.</strong>
              </p>
            </div>
          </article>
        </div>

        <footer className="border-t border-slate-800 bg-slate-950 px-4 py-5 text-white sm:px-6 sm:py-6">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-sky-300">Impacto da rede Turma do Bem</p>
          <dl className="grid grid-cols-1 gap-3 min-[390px]:grid-cols-3">
            {networkMetrics.map((metric) => (
              <div key={metric.label} className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-4">
                <dt className="order-2 text-xs font-medium leading-5 text-slate-300">{metric.label}</dt>
                <dd className="order-first mb-1.5 text-2xl font-black leading-none tracking-tight text-white">{metric.value}</dd>
              </div>
            ))}
          </dl>
        </footer>
      </div>
    </section>
  );
}

export default HeroDashboardCard;
