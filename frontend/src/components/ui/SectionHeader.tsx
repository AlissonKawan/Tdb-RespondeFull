interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
}

function SectionHeader({ eyebrow, title, description, align = 'left' }: SectionHeaderProps) {
  const centered = align === 'center';

  return (
    <div className={`mb-8 ${centered ? 'text-center' : ''}`}>
      {eyebrow && <p className="text-sm font-semibold text-primary">{eyebrow}</p>}
      <h2 className={`mt-2 max-w-4xl text-pretty text-3xl font-bold tracking-tight text-foreground sm:text-4xl ${centered ? 'mx-auto' : ''}`}>
        {title}
      </h2>
      {description && (
        <p className={`mt-3 max-w-3xl text-pretty text-base leading-7 text-muted-foreground ${centered ? 'mx-auto' : ''}`}>
          {description}
        </p>
      )}
    </div>
  );
}

export default SectionHeader;

