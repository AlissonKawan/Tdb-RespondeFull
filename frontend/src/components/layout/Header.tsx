import { Link } from "react-router-dom";
import Container from "../ui/Container";

function Header() {
  return (
    <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
      <Container className="flex min-h-24 items-center justify-between gap-8 py-4">
        {/* Logo principal */}
        <Link
          to="/"
          className="flex items-center gap-4 transition hover:opacity-90"
          aria-label="Ir para a página inicial"
        >
          <img
            src="/img/logo-header.png"
            alt="TDB Responde"
            className="h-[72px] w-auto object-contain lg:h-[88px]"
          />

          <div className="hidden border-l border-slate-200 pl-4 md:block">
            <p className="max-w-48 text-sm font-semibold leading-5 text-slate-600">
              Atendimento social com inteligência operacional
            </p>
          </div>
        </Link>

        {/* Logo Turma do Bem */}
        <a
          href="https://turmadobem.org.br/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-300 hover:text-blue-600 hover:shadow-md sm:flex"
        >
          <span className="whitespace-nowrap">Em colaboração com</span>

          <img
            src="/img/turmadobem.png"
            alt="Turma do Bem"
            className="h-12 w-auto object-contain"
          />
        </a>
      </Container>
    </header>
  );
}

export default Header;
