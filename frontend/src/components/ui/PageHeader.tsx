import Container from './Container';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
}

function PageHeader({ eyebrow, title, description, align = 'left' }: PageHeaderProps) {
  const centered = align === 'center';

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

