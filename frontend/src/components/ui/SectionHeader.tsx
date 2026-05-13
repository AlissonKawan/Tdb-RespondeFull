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
      {eyebrow && <p className="text-xs font-bold uppercase tracking-widest text-[#2563EB]">{eyebrow}</p>}
      <h2 className={`mt-2 text-3xl font-bold tracking-tight text-[#0F172A] sm:text-4xl ${centered ? 'mx-auto' : ''}`}>
        {title}
      </h2>
      {description && (
        <p className={`mt-3 max-w-3xl text-base leading-7 text-[#475569] ${centered ? 'mx-auto' : ''}`}>
          {description}
        </p>
      )}
    </div>
  );
}

export default SectionHeader;

