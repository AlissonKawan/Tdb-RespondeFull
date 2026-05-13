interface StateProps {
  title: string;
  description?: string;
}

export function LoadingState({ title = 'Carregando...' }: Partial<StateProps>) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-[#2563EB]">
      {title}
    </div>
  );
}

export function ErrorState({ title = 'Erro ao carregar dados', description }: Partial<StateProps>) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <p className="font-semibold">{title}</p>
      {description && <p className="mt-1 text-red-600">{description}</p>}
    </div>
  );
}

export function EmptyState({ title = 'Nenhum registro encontrado', description }: Partial<StateProps>) {
  return (
    <div className="rounded-2xl border border-dashed border-[#E2E8F0] bg-white px-6 py-10 text-center">
      <p className="font-semibold text-slate-700">{title}</p>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
    </div>
  );
}
