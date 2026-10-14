import type { ReactNode } from 'react';
import Container from './Container';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  variant?: 'hero' | 'compact';
  actions?: ReactNode;
}

function PageHeader({
  eyebrow,
  title,
  description,
  align = 'left',
  variant = 'hero',
  actions,
}: PageHeaderProps) {
  const centered = align === 'center';

  if (variant === 'compact') {
    return (
      <section aria-labelledby="page-title">
        <Container className="flex flex-col gap-5 pb-2 pt-6 sm:flex-row sm:items-end sm:justify-between sm:pt-8">
          <div className={centered ? 'text-center' : ''}>
            {eyebrow && <p className="text-sm font-semibold text-primary">{eyebrow}</p>}
            <h1
              id="page-title"
              className={`mt-1 max-w-4xl text-pretty text-2xl font-black tracking-tight text-foreground sm:text-3xl ${centered ? 'mx-auto' : ''}`}
            >
              {title}
            </h1>
            {description && (
              <p className={`mt-2 max-w-3xl text-pretty text-sm leading-6 text-muted-foreground sm:text-base ${centered ? 'mx-auto' : ''}`}>
                {description}
              </p>
            )}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
        </Container>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden border-b border-border bg-surface">
      <div className="absolute inset-y-0 left-0 w-1.5 bg-primary" aria-hidden="true" />
      <Container className={`relative py-14 sm:py-16 ${centered ? 'text-center' : ''}`}>
        {eyebrow && (
          <p className="mb-3 text-sm font-semibold text-primary">{eyebrow}</p>
        )}
        <h1 className={`max-w-4xl text-pretty text-4xl font-black tracking-tight text-foreground sm:text-5xl ${centered ? 'mx-auto' : ''}`}>
          {title}
        </h1>
        {description && (
          <p className={`mt-4 max-w-3xl text-pretty text-lg leading-8 text-muted-foreground ${centered ? 'mx-auto' : ''}`}>
            {description}
          </p>
        )}
      </Container>
    </section>
  );
}

export default PageHeader;

