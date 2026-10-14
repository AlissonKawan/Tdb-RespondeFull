interface SectionTitleProps {
  title: string;
  description?: string;
}

function SectionTitle({ title, description }: SectionTitleProps) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-foreground">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}

export default SectionTitle;
