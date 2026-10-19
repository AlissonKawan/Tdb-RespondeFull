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
    {
      name: 'LinkedIn Eduardo',
      url: 'https://www.linkedin.com/in/eduardo-boni-b6b851310',
    },
  ];

  const team = ['Alisson Kawan', 'Marcos Vinicius', 'Eduardo Boni'];

  return (
    <footer className="border-t border-blue-950/20 bg-foreground text-white">
      <Container className="grid gap-8 py-10 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <div className="w-fit max-w-full rounded-2xl bg-white p-3">
            <img
              src="/img/logo-completa.png"
              alt="TDB Responde — Unificando atendimentos que fazem o bem."
              width="840"
              height="672"
              loading="lazy"
              className="h-auto w-56 max-w-full object-contain md:w-64"
            />
          </div>
          <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">
            Plataforma criada para centralizar canais, organizar históricos e apoiar voluntários com uma operação mais clara.
          </p>
          <p className="mt-3 text-sm font-semibold text-blue-200">
            Em colaboração com a Turma do Bem.
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
                className="text-sm font-medium text-slate-300 transition hover:text-accent"
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
