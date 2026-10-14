interface StatCardProps {
  label: string;
  value: string | number;
  description?: string;
  tone?: 'blue' | 'green' | 'orange' | 'slate';
}

function StatCard({ label, value, description, tone = 'blue' }: StatCardProps) {
  const tones = {
    blue: 'bg-primary/10 text-primary',
    green: 'bg-success/10 text-success',
    orange: 'bg-warning/10 text-warning',
    slate: 'bg-muted text-foreground',
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className={`mb-4 h-2 w-12 rounded-full ${tones[tone]}`} />
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-black text-foreground">{value}</p>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}

export default StatCard;

