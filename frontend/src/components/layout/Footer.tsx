import Container from '../ui/Container';

function Footer() {
  const links = [
    { name: 'GitHub', url: 'https://github.com/AlissonMarcoschalenge77' },
    {
      name: 'LinkedIn Alisson',
      url: 'https://www.linkedin.com/in/alisson-kawan-evangelista-silva-5a3355219/',
    },
    {
      name: 'LinkedIn Marcos',
      url: 'https://www.linkedin.com/in/marcos-vinicius-de-jesus-almeida/',
    },
  ];

  const team = ['Alisson Kawan', 'Marcos Vinicius', 'Eduardo Boni'];

  return (
    <footer className="border-t border-blue-950/20 bg-[#0B1220] text-white">
      <Container className="grid gap-8 py-10 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <div className="flex items-center gap-3">
            <span className="h-9 w-9 rounded-xl bg-[#2563EB] shadow-lg shadow-blue-600/30" />
            <div>
              <p className="font-bold">TDB Responde</p>
              <p className="text-xs text-slate-400">Atendimento social organizado</p>
            </div>
          </div>
          <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">
            Plataforma criada para centralizar canais, organizar historicos e apoiar voluntarios com uma operacao mais clara.
          </p>
          <p className="mt-3 text-sm font-semibold text-blue-200">
            Em colaboracao com a Turma do Bem.
          </p>
        </div>

        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-blue-300">Equipe</p>
          <div className="space-y-2">
            {team.map((name) => (
              <p key={name} className="text-sm text-slate-300">{name}</p>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-blue-300">Links</p>
          <div className="flex flex-col gap-2">
            {links.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-slate-300 transition hover:text-[#60A5FA]"
              >
                {link.name}
              </a>
            ))}
          </div>
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="py-4 text-sm text-slate-400">
          &copy; 2026 TDB Responde | Criado por Alisson Kawan, Marcos Vinicius e Eduardo Boni
        </Container>
      </div>
    </footer>
  );
}

export default Footer;
