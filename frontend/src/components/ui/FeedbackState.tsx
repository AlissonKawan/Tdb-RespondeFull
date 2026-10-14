import type { ReactNode } from 'react';
import Button from './Button';

interface StateProps {
  title: string;
  description?: string;
}

interface LoadingStateProps extends Partial<StateProps> {
  variant?: 'card' | 'table' | 'inline';
  count?: number;
  rows?: number;
  columns?: number;
  className?: string;
}

interface EmptyStateProps extends Partial<StateProps> {
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

interface SkeletonCollectionProps {
  className?: string;
  label?: string;
}

interface CardSkeletonProps extends SkeletonCollectionProps {
  count?: number;
}

interface TableSkeletonProps extends SkeletonCollectionProps {
  rows?: number;
  columns?: number;
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-ui bg-muted motion-reduce:animate-none ${className}`} aria-hidden="true" />;
}

export function CardSkeleton({ count = 3, className = '', label = 'Carregando conteúdo...' }: CardSkeletonProps) {
  return (
    <div role="status" aria-busy="true" className={`grid gap-4 md:grid-cols-2 xl:grid-cols-3 ${className}`}>
      <span className="sr-only">{label}</span>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="min-h-52 rounded-2xl border border-border bg-surface p-5 shadow-sm" aria-hidden="true">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-1 items-center gap-3">
              <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-2/5" />
              </div>
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="mt-6 space-y-3">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-3/5" />
          </div>
          <div className="mt-7 flex justify-end gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 4, className = '', label = 'Carregando tabela...' }: TableSkeletonProps) {
  return (
    <div role="status" aria-busy="true" className={`overflow-hidden rounded-2xl border border-border bg-surface ${className}`}>
      <span className="sr-only">{label}</span>
      <div className="grid gap-4 border-b border-border bg-muted/60 px-5 py-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }} aria-hidden="true">
        {Array.from({ length: columns }, (_, index) => <Skeleton key={index} className="h-3 w-3/5" />)}
      </div>
      <div className="divide-y divide-border" aria-hidden="true">
        {Array.from({ length: rows }, (_, rowIndex) => (
          <div key={rowIndex} className="grid min-h-16 items-center gap-4 px-5 py-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
            {Array.from({ length: columns }, (_, columnIndex) => (
              <Skeleton key={columnIndex} className={`h-3 ${columnIndex === 0 ? 'w-4/5' : 'w-3/5'}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function LoadingState({
  title = 'Carregando...',
  variant = 'card',
  count = 3,
  rows = 5,
  columns = 4,
  className = '',
}: LoadingStateProps) {
  if (variant === 'table') return <TableSkeleton rows={rows} columns={columns} label={title} className={className} />;
  if (variant === 'card') return <CardSkeleton count={count} label={title} className={className} />;

  return (
    <div role="status" aria-busy="true" className={`rounded-2xl border border-border bg-surface p-4 ${className}`}>
      <span className="sr-only">{title}</span>
      <div className="flex items-center gap-3" aria-hidden="true">
        <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-2/5" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>
    </div>
  );
}

export function ErrorState({ title = 'Erro ao carregar dados', description }: Partial<StateProps>) {
  return (
    <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <p className="font-semibold">{title}</p>
      {description && <p className="mt-1 text-red-600">{description}</p>}
    </div>
  );
}

function DefaultEmptyIcon() {
  return (
    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-9Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 14h4l1.5 2h5l1.5-2h4M9 9h6" />
    </svg>
  );
}

export function EmptyState({
  title = 'Nenhum registro encontrado',
  description,
  icon,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-primary ring-1 ring-border">
        {icon ?? <DefaultEmptyIcon />}
      </div>
      <p className="mt-4 font-semibold text-foreground">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>}
      {actionLabel && onAction && (
        <Button type="button" variant="secondary" className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
