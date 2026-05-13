interface SectionTitleProps {
  title: string;
  description?: string;
}

function SectionTitle({ title, description }: SectionTitleProps) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-[#0F172A]">{title}</h2>
      {description && <p className="mt-1 text-sm text-[#475569]">{description}</p>}
    </div>
  );
}

export default SectionTitle;
