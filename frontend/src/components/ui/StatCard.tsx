interface StatCardProps {
  label: string;
  value: string | number;
  description?: string;
  tone?: 'blue' | 'green' | 'orange' | 'slate';
}

function StatCard({ label, value, description, tone = 'blue' }: StatCardProps) {
  const tones = {
    blue: 'text-[#2563EB] bg-blue-50',
    green: 'text-[#059669] bg-emerald-50',
    orange: 'text-[#F97316] bg-orange-50',
    slate: 'text-[#0F172A] bg-slate-50',
  };

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
      <div className={`mb-4 h-2 w-12 rounded-full ${tones[tone]}`} />
      <p className="text-sm font-semibold text-[#475569]">{label}</p>
      <p className="mt-2 text-3xl font-black text-[#0F172A]">{value}</p>
      {description && <p className="mt-1 text-sm text-[#475569]">{description}</p>}
    </div>
  );
}

export default StatCard;

