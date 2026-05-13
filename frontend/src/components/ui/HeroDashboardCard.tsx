import ChartCard from './ChartCard';

const flow = ['Entrada', 'Triagem', 'Resposta'];

function HeroDashboardCard() {
  return (
    <div className="relative">
      <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-[2rem] bg-blue-950/10 blur-xl" />
      <div className="relative">
        <ChartCard />
        <div className="mt-4 rounded-3xl border border-white/70 bg-white/90 p-4 shadow-xl shadow-blue-950/10 backdrop-blur">
          <div className="mb-4 flex items-center justify-between text-xs font-semibold text-[#475569]">
            <span>Fluxo de resposta</span>
            <span className="text-[#2563EB]">organizado</span>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {flow.map((item, index) => (
              <div key={item} className="flex flex-1 items-center">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2563EB] text-xs font-bold text-white shadow-lg shadow-blue-600/20">
                  {index + 1}
                </div>
                <span className="ml-2 text-xs font-bold text-[#0F172A]">{item}</span>
                {index < flow.length - 1 && <div className="mx-3 hidden h-px flex-1 bg-gradient-to-r from-[#60A5FA] to-[#E2E8F0] sm:block" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeroDashboardCard;

