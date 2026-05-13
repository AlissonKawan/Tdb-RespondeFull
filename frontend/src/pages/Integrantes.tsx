import Section from '../components/layout/Section';
import PageShell from '../components/layout/PageShell';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import TeamMemberCard from '../components/ui/TeamMemberCard';

interface Member {
  name: string;
  rm?: string;
  course?: string;
  image?: string;
  github?: string;
  linkedin?: string;
}

function Integrantes() {
  const members: Member[] = [
    {
      name: 'Alisson Kawan',
      rm: '567598',
      course: '1TDSPS',
      image: '/img/alisson.jpeg',
      github: 'https://github.com/AlissonKawan',
      linkedin: 'https://www.linkedin.com/in/alisson-kawan-evangelista-silva-5a3355219/',
    },
    {
      name: 'Marcos Vinicius',
      rm: '567214',
      course: '1TDSPS',
      image: '/img/marcos.jpeg',
      github: 'https://github.com/marcos-thebest',
      linkedin: 'https://www.linkedin.com/in/marcos-vinicius-de-jesus-almeida/',
    },
    {
      name: 'Eduardo Boni',
      course: '1TDSPS',
    },
  ];

  return (
    <PageShell>
      <PageHeader
        eyebrow="Equipe"
        title="Integrantes do projeto"
        description="Pessoas responsaveis pela criacao, evolucao e apresentacao do TDB Responde."
      />

      <Section tone="white">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {members.map((member) => (
            <TeamMemberCard key={member.name} {...member} />
          ))}
        </div>
      </Section>

      <Section tone="blue">
        <Card className="flex flex-col gap-6 p-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#2563EB]">Contato</p>
            <h2 className="mt-2 text-3xl font-bold text-[#0F172A]">Vamos conversar?</h2>
            <p className="mt-2 text-[#475569]">Entre em contato com a equipe do projeto.</p>
          </div>
          <Button href="/contato" size="large">Fale conosco</Button>
        </Card>
      </Section>
    </PageShell>
  );
}

export default Integrantes;

