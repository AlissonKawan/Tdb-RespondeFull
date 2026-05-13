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
    <Card className="group p-6 text-center transition-all hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/10">
      <div className="mx-auto mb-5 flex h-32 w-32 items-center justify-center overflow-hidden rounded-3xl border border-[#E2E8F0] bg-gradient-to-br from-blue-50 to-white text-3xl font-black text-[#2563EB] shadow-sm">
        {image ? <img src={image} alt={name} className="h-full w-full object-cover" /> : initials(name)}
      </div>
      <h2 className="text-xl font-bold text-[#0F172A]">{name}</h2>
      <div className="mt-2 min-h-11 text-sm text-[#475569]">
        {rm && <p className="font-semibold text-[#2563EB]">RM: {rm}</p>}
        {course && <p>{course}</p>}
      </div>
      {(github || linkedin) && (
        <div className="mt-5 flex justify-center gap-3">
          {github && (
            <a href={github} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm font-semibold text-[#475569] transition hover:border-blue-200 hover:text-[#2563EB]">
              GitHub
            </a>
          )}
          {linkedin && (
            <a href={linkedin} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm font-semibold text-[#475569] transition hover:border-blue-200 hover:text-[#2563EB]">
              LinkedIn
            </a>
          )}
        </div>
      )}
    </Card>
  );
}

export default TeamMemberCard;

