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
            <a href={github} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`GitHub de ${name}`}>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .7a11.5 11.5 0 0 0-3.64 22.4c.58.1.79-.25.79-.56v-2.23c-3.22.7-3.9-1.37-3.9-1.37-.52-1.34-1.28-1.7-1.28-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.57-.29-5.27-1.28-5.27-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.16 1.18a10.9 10.9 0 0 1 5.76 0c2.19-1.49 3.16-1.18 3.16-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.42-2.71 5.39-5.29 5.68.42.36.79 1.06.79 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z"/></svg>
              GitHub
            </a>
          )}
          {linkedin && (
            <a href={linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`LinkedIn de ${name}`}>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.47-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.32 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13ZM7.1 20.45H3.54V9H7.1v11.45Z"/></svg>
              LinkedIn
            </a>
          )}
        </div>
      )}
    </Card>
  );
}

export default TeamMemberCard;

