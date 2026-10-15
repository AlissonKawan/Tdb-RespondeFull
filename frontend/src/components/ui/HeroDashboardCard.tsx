import { useEffect, useState } from 'react';
import { programImages } from '../../config/programImages';

const networkMetrics = [
  { value: '+18 mil', label: 'Dentistas Voluntários' },
  { value: '+90 mil', label: 'Jovens Atendidos' },
  { value: '12 Países', label: 'América Latina e Portugal' },
];

const programSlides = [
  {
    image: programImages.dentistaDoBem,
    imageAlt: 'Adolescente sorrindo durante atendimento odontológico do programa Dentista do Bem',
    audience: 'Crianças e Jovens (11 a 17 anos)',
    title: 'Dentista do Bem',
    description:
      'Atendimento odontológico integral e gratuito realizado em consultórios particulares voluntários até completarem 18 anos.',
    impact: 'Mais de 90 mil jovens já foram transformados.',
    badgeClassName: 'border-blue-200 bg-blue-50/90 text-blue-800',
    accentClassName: 'text-primary',
    overlayClassName:
      'bg-gradient-to-t from-blue-50 via-white/95 via-[45%] to-blue-100/10 md:bg-gradient-to-l md:from-blue-50 md:via-white/95 md:via-[45%] md:to-blue-100/10',
    transitionTintClassName:
      'bg-[linear-gradient(0deg,rgba(59,130,246,0.10)_0%,transparent_58%)] md:bg-[linear-gradient(90deg,transparent_28%,rgba(59,130,246,0.04)_40%,rgba(59,130,246,0.14)_57%,rgba(59,130,246,0.08)_72%,transparent_88%)]',
  },
  {
    image: programImages.apoloniasDoBem,
    imageAlt: 'Mulher sorrindo, representando acolhimento e dignidade no programa Apolônias do Bem',
    audience: 'Mulheres Sobreviventes de Violência',
    title: 'Apolônias do Bem',
    description:
      'Reabilitação bucal integral para mulheres que sofreram violência doméstica, restabelecendo saúde, sorriso e dignidade com sigilo absoluto.',
    impact: 'Mais de 1.200 mulheres acolhidas.',
    badgeClassName: 'border-rose-200 bg-rose-50/90 text-rose-800',
    accentClassName: 'text-rose-700',
    overlayClassName:
      'bg-gradient-to-t from-rose-50 via-white/95 via-[45%] to-rose-100/10 md:bg-gradient-to-l md:from-rose-50 md:via-white/95 md:via-[45%] md:to-rose-100/10',
    transitionTintClassName:
      'bg-[linear-gradient(0deg,rgba(244,63,94,0.10)_0%,transparent_58%)] md:bg-[linear-gradient(90deg,transparent_28%,rgba(244,63,94,0.04)_40%,rgba(244,63,94,0.14)_57%,rgba(244,63,94,0.08)_72%,transparent_88%)]',
  },
];

function HeroDashboardCard() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isManuallyPaused, setIsManuallyPaused] = useState(false);

  useEffect(() => {
    if (isManuallyPaused) return;

    const intervalId = window.setInterval(() => {
      setCurrentSlide((current) => (current + 1) % programSlides.length);
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [isManuallyPaused]);

  const showPreviousSlide = () => {
    setCurrentSlide((current) => (current - 1 + programSlides.length) % programSlides.length);
  };

  const showNextSlide = () => {
    setCurrentSlide((current) => (current + 1) % programSlides.length);
  };

  return (
    <section
      className="relative min-w-0"
      aria-label="Programas de acolhimento social da Turma do Bem"
      aria-roledescription="carrossel"
    >
      <div className="absolute -inset-4 -z-10 rounded-[2.75rem] bg-gradient-to-r from-blue-300/30 via-white/10 to-rose-300/25 blur-3xl" />

      <div className="overflow-hidden rounded-[1.75rem] border border-white/90 bg-white shadow-[0_32px_90px_-35px_rgba(15,23,42,0.55)] ring-1 ring-blue-950/10 sm:rounded-[2.25rem]">
        <div className="relative min-h-[42rem] overflow-hidden bg-slate-100 sm:min-h-[36rem] lg:min-h-[33rem]">
          {programSlides.map((slide, index) => {
            const isActive = index === currentSlide;

            return (
              <article
                key={slide.title}
                className={`absolute inset-0 transition-opacity duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none ${
                  isActive ? 'z-10 opacity-100' : 'pointer-events-none opacity-0'
                }`}
                aria-hidden={!isActive}
              >
                <img
                  src={slide.image}
                  alt={slide.imageAlt}
                  loading="lazy"
                  className={`absolute inset-0 h-full w-full object-cover object-left transition-[transform,filter] duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transform-none motion-reduce:transition-none ${
                    isActive ? 'translate-x-0 scale-100 blur-0' : '-translate-x-2 scale-[1.035] blur-[1px]'
                  }`}
                />
                <div
                  className={`absolute inset-0 ${slide.overlayClassName}`}
                  aria-hidden="true"
                />
                <div
                  className={`absolute inset-0 transition-opacity duration-1000 motion-reduce:transition-none ${slide.transitionTintClassName} ${
                    isActive ? 'opacity-100' : 'opacity-40'
                  }`}
                  aria-hidden="true"
                />

                <div className="relative z-10 flex min-h-[42rem] items-end px-6 pb-24 pt-72 sm:min-h-[36rem] sm:px-10 sm:pt-64 md:items-center md:justify-end md:px-14 md:py-16 lg:min-h-[33rem] lg:px-20">
                  <div
                    className={`w-full transition-[opacity,transform,filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transform-none motion-reduce:transition-none md:max-w-[48%] ${
                      isActive
                        ? 'translate-x-0 opacity-100 blur-0 delay-200'
                        : 'translate-x-8 opacity-0 blur-[2px] delay-0'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-white/90 px-3 py-1.5 text-xs font-bold text-blue-900 shadow-sm backdrop-blur">
                      <svg className="h-3.5 w-3.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M12 3 5 6v5c0 4.6 2.8 8.2 7 10 4.2-1.8 7-5.4 7-10V6l-7-3Z" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="m9.5 12 1.7 1.7 3.6-3.7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      OSCIP <span className="text-blue-300" aria-hidden="true">•</span> Fundação em 2002
                    </span>

                    <p className={`mt-5 text-xs font-black uppercase tracking-[0.16em] ${slide.accentClassName}`}>
                      Programas de Acolhimento Social
                    </p>
                    <h2 className="mt-2 text-4xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-[3.5rem]">
                      {slide.title}
                    </h2>
                    <span className={`mt-4 inline-flex rounded-full border px-3 py-1.5 text-xs font-bold sm:text-sm ${slide.badgeClassName}`}>
                      {slide.audience}
                    </span>
                    <p className="mt-5 text-base leading-7 text-slate-700 sm:text-lg sm:leading-8">
                      {slide.description}
                    </p>
                    <p className={`mt-4 text-lg font-black sm:text-xl ${slide.accentClassName}`}>
                      {slide.impact}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}

          <button
            type="button"
            onClick={showPreviousSlide}
            className="absolute left-3 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/90 text-slate-800 shadow-lg backdrop-blur transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:left-5"
            aria-label="Mostrar programa anterior"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <button
            type="button"
            onClick={showNextSlide}
            className="absolute right-3 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/90 text-slate-800 shadow-lg backdrop-blur transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:right-5"
            aria-label="Mostrar próximo programa"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/80 bg-white/90 p-1.5 shadow-lg backdrop-blur">
            {programSlides.map((slide, index) => (
              <button
                key={slide.title}
                type="button"
                onClick={() => setCurrentSlide(index)}
                className={`h-3 rounded-full transition-[width,background-color] duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  index === currentSlide ? 'w-8 bg-primary' : 'w-3 bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={`Mostrar ${slide.title}`}
                aria-current={index === currentSlide ? 'true' : undefined}
              />
            ))}
            <span className="mx-0.5 h-5 w-px bg-slate-200" aria-hidden="true" />
            <button
              type="button"
              onClick={() => setIsManuallyPaused((paused) => !paused)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={isManuallyPaused ? 'Retomar rotação automática' : 'Pausar rotação automática'}
              aria-pressed={isManuallyPaused}
            >
              {isManuallyPaused ? (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M8 5.5v13l10-6.5L8 5.5Z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M7 5h3.5v14H7V5Zm6.5 0H17v14h-3.5V5Z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <footer className="border-t border-slate-800 bg-slate-950 px-5 py-5 text-white sm:px-8 sm:py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-300">Impacto da rede Turma do Bem</p>
              <p className="mt-1 text-sm text-slate-400">Odontologia voluntária com alcance internacional.</p>
            </div>
            <dl className="grid flex-1 grid-cols-1 gap-3 min-[390px]:grid-cols-3 lg:max-w-3xl">
              {networkMetrics.map((metric) => (
                <div key={metric.label} className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3">
                  <dt className="order-2 text-xs font-medium leading-5 text-slate-300">{metric.label}</dt>
                  <dd className="order-first mb-1 text-2xl font-black leading-none tracking-tight text-white">{metric.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </footer>
      </div>
    </section>
  );
}

export default HeroDashboardCard;
