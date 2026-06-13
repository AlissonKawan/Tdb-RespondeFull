import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import Button from '../ui/Button';
import Container from '../ui/Container';

function NavBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isVoluntario, isBeneficiario, isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const linkClass = (path: string) =>
    `block rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
      location.pathname === path
        ? 'bg-white text-[#0F172A] shadow-sm ring-1 ring-[#E2E8F0]'
        : 'text-[#475569] hover:bg-white hover:text-[#0F172A]'
    }`;

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/login');
  };

  const portalPath = isVoluntario
    ? '/portal-voluntario'
    : isBeneficiario
      ? '/portal-beneficiario'
      : '/admin';

  return (
    <nav className="sticky top-0 z-40 border-b border-[#E2E8F0]/80 bg-[#F8FAFC]/85 backdrop-blur-xl">
      <Container className="py-3">
        <div className="flex items-center justify-between md:justify-center">
          {/* Logo or Platform Name on Mobile */}
          <div className="flex items-center gap-2 md:hidden">
            <span className="font-bold text-slate-800 text-sm">TDB Responde</span>
          </div>

          {/* Hamburger Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 md:hidden"
            aria-label="Alternar menu de navegação"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {isOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>

          {/* Desktop Navigation Link Container */}
          <div className="hidden flex-wrap items-center justify-center gap-2 md:flex">
            {!user && (
              <>
                <Link to="/" className={linkClass('/')}>Home</Link>
                <Link to="/sobre" className={linkClass('/sobre')}>Sobre</Link>
                <Link to="/faq" className={linkClass('/faq')}>FAQ</Link>
                <Link to="/contato" className={linkClass('/contato')}>Contato</Link>
                <Link to="/integrantes" className={linkClass('/integrantes')}>Integrantes</Link>
                <Link to="/roadmap" className={linkClass('/roadmap')}>Solucao</Link>
                <Link to="/quero-ser-voluntario" className={linkClass('/quero-ser-voluntario')}>Seja voluntario</Link>
              </>
            )}

            {!user && <span className="mx-2 h-6 w-px bg-slate-200" />}

            {!user && <Button href="/login" size="sm">Entrar</Button>}
            {!user && <Button href="/cadastro-beneficiario" variant="secondary" size="sm">Criar conta beneficiario</Button>}
            {user && <span className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-[#475569] ring-1 ring-[#E2E8F0]">{user.nome}</span>}
            {user && isBeneficiario && <Button href={portalPath} size="sm">Meu portal</Button>}
            {user && isBeneficiario && <Button href="/beneficiario/solicitar-atendimento" variant="secondary" size="sm">Solicitar atendimento</Button>}
            {user && isVoluntario && <Button href={portalPath} size="sm">Portal do voluntario</Button>}
            {user && isAdmin && (
              <Button type="button" onClick={() => navigate('/inscricoes-pendentes')} variant={isAdmin ? 'primary' : 'secondary'} size="sm">
                Inscricoes pendentes
              </Button>
            )}
            {user && (
              <Button type="button" variant="ghost" size="sm" onClick={handleLogout}>
                Sair
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Dropdown Menu */}
        {isOpen && (
          <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3 md:hidden">
            {!user && (
              <>
                <Link to="/" onClick={() => setIsOpen(false)} className={linkClass('/')}>Home</Link>
                <Link to="/sobre" onClick={() => setIsOpen(false)} className={linkClass('/sobre')}>Sobre</Link>
                <Link to="/faq" onClick={() => setIsOpen(false)} className={linkClass('/faq')}>FAQ</Link>
                <Link to="/contato" onClick={() => setIsOpen(false)} className={linkClass('/contato')}>Contato</Link>
                <Link to="/integrantes" onClick={() => setIsOpen(false)} className={linkClass('/integrantes')}>Integrantes</Link>
                <Link to="/roadmap" onClick={() => setIsOpen(false)} className={linkClass('/roadmap')}>Solucao</Link>
                <Link to="/quero-ser-voluntario" onClick={() => setIsOpen(false)} className={linkClass('/quero-ser-voluntario')}>Seja voluntario</Link>
              </>
            )}

            {!user && <div className="my-1 border-t border-slate-200" />}

            {!user && (
              <div className="flex flex-col gap-2">
                <Button href="/login" size="sm" onClick={() => setIsOpen(false)}>Entrar</Button>
                <Button href="/cadastro-beneficiario" variant="secondary" size="sm" onClick={() => setIsOpen(false)}>Criar conta beneficiario</Button>
              </div>
            )}
            {user && <span className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-[#475569] ring-1 ring-[#E2E8F0] block text-center mb-1">{user.nome}</span>}
            {user && isBeneficiario && (
              <div className="flex flex-col gap-2">
                <Button href={portalPath} size="sm" onClick={() => setIsOpen(false)}>Meu portal</Button>
                <Button href="/beneficiario/solicitar-atendimento" variant="secondary" size="sm" onClick={() => setIsOpen(false)}>Solicitar atendimento</Button>
              </div>
            )}
            {user && isVoluntario && <Button href={portalPath} size="sm" onClick={() => setIsOpen(false)}>Portal do voluntario</Button>}
            {user && isAdmin && (
              <Button type="button" onClick={() => { setIsOpen(false); navigate('/inscricoes-pendentes'); }} variant={isAdmin ? 'primary' : 'secondary'} size="sm">
                Inscricoes pendentes
              </Button>
            )}
            {user && (
              <Button type="button" variant="ghost" size="sm" onClick={handleLogout}>
                Sair
              </Button>
            )}
          </div>
        )}
      </Container>
    </nav>
  );
}

export default NavBar;
