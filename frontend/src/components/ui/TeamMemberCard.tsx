import Card from './Card';

interface TeamMemberCardProps {
  name: string;
  rm?: string;
  course?: string;
  image?: string;
  github?: string;
  linkedin?: string;
}

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('');
}

function TeamMemberCard({ name, rm, course, image, github, linkedin }: TeamMemberCardProps) {
  return (
    <Card className="group p-6 text-center transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10">
      <div className="mx-auto mb-5 flex h-32 w-32 items-center justify-center overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 to-surface text-3xl font-black text-primary shadow-sm">
        {image ? <img src={image} alt={name} width="320" height="320" loading="lazy" className="h-full w-full object-cover" /> : initials(name)}
      </div>
      <h2 className="text-xl font-bold text-foreground">{name}</h2>
      <div className="mt-2 min-h-11 text-sm text-muted-foreground">
        {rm && <p className="font-semibold text-primary">RM: {rm}</p>}
        {course && <p>{course}</p>}
      </div>
      {(github || linkedin) && (
        <div className="mt-5 flex justify-center gap-3">
          {github && (
            <a href={github} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-border px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:border-primary/30 hover:text-primary">
              GitHub
            </a>
          )}
          {linkedin && (
            <a href={linkedin} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-border px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:border-primary/30 hover:text-primary">
              LinkedIn
            </a>
          )}
        </div>
      )}
    </Card>
  );
}

export default TeamMemberCard;

