const visualMetrics = {
  linePoints: '0,62 38,50 76,56 114,34 152,42 190,20 228,28 266,12',
  bars: [42, 64, 56, 78, 70, 88, 74],
};

function ChartCard() {
  return (
    <div className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-2xl shadow-blue-950/15 backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#2563EB]">Operacao</p>
          <h3 className="mt-1 text-lg font-bold text-[#0F172A]">Sinais de atendimento</h3>
        </div>
        <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-[#059669]">
          Online
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ['12', 'canais'],
          ['3m', 'triagem'],
          ['1', 'historico'],
        ].map(([value, label]) => (
          <div key={label} className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
            <p className="text-xl font-black text-[#0F172A]">{value}</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#475569]">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold text-[#0F172A]">Atividade</p>
            <span className="text-xs font-semibold text-[#2563EB]">+18%</span>
          </div>
          <svg viewBox="0 0 266 72" className="h-28 w-full overflow-visible">
            <polyline points={visualMetrics.linePoints} fill="none" stroke="#BFDBFE" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points={visualMetrics.linePoints} fill="none" stroke="#2563EB" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="266" cy="12" r="5" fill="#F97316" />
          </svg>
        </div>

        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4">
          <p className="mb-4 text-sm font-bold text-[#0F172A]">Canais</p>
          <div className="flex h-28 items-end gap-2">
            {visualMetrics.bars.map((bar, index) => (
              <div key={index} className="flex flex-1 items-end rounded-full bg-blue-50">
                <div
                  className="w-full rounded-full bg-gradient-to-t from-[#1E3A8A] to-[#60A5FA]"
                  style={{ height: `${bar}%` }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChartCard;
