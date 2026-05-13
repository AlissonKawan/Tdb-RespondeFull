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
    <section className="relative overflow-hidden border-b border-[#E2E8F0] bg-[linear-gradient(135deg,#F8FAFC_0%,#EFF6FF_58%,#FFFFFF_100%)]">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(37,99,235,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(37,99,235,0.05)_1px,transparent_1px)] bg-[size:56px_56px]" />
      <div className="absolute right-0 top-0 h-64 w-96 bg-[radial-gradient(circle_at_center,rgba(96,165,250,0.26),transparent_66%)]" />
      <Container className={`relative py-16 ${centered ? 'text-center' : ''}`}>
        {eyebrow && (
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#2563EB]">{eyebrow}</p>
        )}
        <h1 className={`text-4xl font-black tracking-tight text-[#0F172A] sm:text-5xl ${centered ? 'mx-auto' : ''}`}>
          {title}
        </h1>
        {description && (
          <p className={`mt-4 max-w-3xl text-lg leading-8 text-[#475569] ${centered ? 'mx-auto' : ''}`}>
            {description}
          </p>
        )}
      </Container>
    </section>
  );
}

export default PageHeader;

