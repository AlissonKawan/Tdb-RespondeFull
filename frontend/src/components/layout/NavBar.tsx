import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { useConfirm } from '../../hooks/useConfirm';
import Button from '../ui/Button';
import Container from '../ui/Container';

function NavBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isVoluntario, isBeneficiario, isAdmin } = useAuth();
  const { confirm, confirmDialog } = useConfirm();
  const [isOpen, setIsOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const isActive = (path: string) => path === '/'
    ? location.pathname === '/' || location.pathname === '/institucional'
    : location.pathname === path;

  const linkClass = (path: string) =>
    `block min-h-11 rounded-ui px-4 py-3 text-sm font-semibold transition-colors duration-fast ${
      isActive(path)
        ? 'bg-surface text-foreground shadow-sm ring-1 ring-border'
        : 'text-muted-foreground hover:bg-surface hover:text-foreground'
    }`;

  const linkProps = (path: string) => ({
    className: linkClass(path),
    'aria-current': isActive(path) ? ('page' as const) : undefined,
  });

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleLogout = () => {
    confirm({
      title: 'Sair da conta',
      message: 'Você realmente quer sair da conta?',
      confirmText: 'Sair',
      tone: 'danger',
      onConfirm: () => {
        logout();
        setIsOpen(false);
        navigate('/login');
      }
    });
  };

  const portalPath = isVoluntario
    ? '/portal-voluntario'
    : isBeneficiario
      ? '/portal-beneficiario'
      : '/admin';

  return (
    <nav aria-label="Navegação principal" className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur-xl">
      <Container className="py-3">
        <div className="flex items-center justify-between md:justify-center">
          {/* Logo or Platform Name on Mobile */}
          <div className="flex items-center gap-2 md:hidden">
            <span className="font-bold text-slate-800 text-sm">TDB Responde</span>
          </div>

          {/* Hamburger Menu Button */}
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex h-11 w-11 items-center justify-center rounded-ui border border-border bg-surface text-muted-foreground shadow-sm transition-colors hover:bg-muted md:hidden"
            aria-label={isOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
            aria-expanded={isOpen}
            aria-controls="menu-principal-mobile"
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
                <Link to="/" {...linkProps('/')}>Home</Link>
                <Link to="/sobre" {...linkProps('/sobre')}>Sobre</Link>
                <Link to="/faq" {...linkProps('/faq')}>FAQ</Link>
                <Link to="/contato" {...linkProps('/contato')}>Contato</Link>
                <Link to="/integrantes" {...linkProps('/integrantes')}>Integrantes</Link>
                <Link to="/roadmap" {...linkProps('/roadmap')}>Solução</Link>
                <Link to="/quero-ser-voluntario" {...linkProps('/quero-ser-voluntario')}>Seja voluntário</Link>
              </>
            )}

            {!user && <span className="mx-2 h-6 w-px bg-slate-200" />}

            {!user && <Button href="/login" size="sm">Entrar</Button>}
            {!user && <Button href="/cadastro-beneficiario" variant="secondary" size="sm">Criar conta beneficiário</Button>}
            {user && <span className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-muted-foreground ring-1 ring-border">{user.nome}</span>}
            {user && isBeneficiario && <Button href={portalPath} size="sm">Meu portal</Button>}
            {user && isBeneficiario && <Button href="/beneficiario/solicitar-atendimento" variant="secondary" size="sm">Solicitar atendimento</Button>}
            {user && isVoluntario && <Button href={portalPath} size="sm">Portal do voluntário</Button>}
            {user && isAdmin && (
              <Button type="button" onClick={() => navigate('/inscricoes-pendentes')} variant={isAdmin ? 'primary' : 'secondary'} size="sm">
                Inscrições pendentes
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
          <div id="menu-principal-mobile" className="mt-3 flex flex-col gap-2 border-t border-border pt-3 md:hidden">
            {!user && (
              <>
                <Link to="/" onClick={() => setIsOpen(false)} {...linkProps('/')}>Home</Link>
                <Link to="/sobre" onClick={() => setIsOpen(false)} {...linkProps('/sobre')}>Sobre</Link>
                <Link to="/faq" onClick={() => setIsOpen(false)} {...linkProps('/faq')}>FAQ</Link>
                <Link to="/contato" onClick={() => setIsOpen(false)} {...linkProps('/contato')}>Contato</Link>
                <Link to="/integrantes" onClick={() => setIsOpen(false)} {...linkProps('/integrantes')}>Integrantes</Link>
                <Link to="/roadmap" onClick={() => setIsOpen(false)} {...linkProps('/roadmap')}>Solução</Link>
                <Link to="/quero-ser-voluntario" onClick={() => setIsOpen(false)} {...linkProps('/quero-ser-voluntario')}>Seja voluntário</Link>
              </>
            )}

            {!user && <div className="my-1 border-t border-slate-200" />}

            {!user && (
              <div className="flex flex-col gap-2">
                <Button href="/login" size="sm" onClick={() => setIsOpen(false)}>Entrar</Button>
                <Button href="/cadastro-beneficiario" variant="secondary" size="sm" onClick={() => setIsOpen(false)}>Criar conta beneficiário</Button>
              </div>
            )}
            {user && <span className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-muted-foreground ring-1 ring-border block text-center mb-1">{user.nome}</span>}
            {user && isBeneficiario && (
              <div className="flex flex-col gap-2">
                <Button href={portalPath} size="sm" onClick={() => setIsOpen(false)}>Meu portal</Button>
                <Button href="/beneficiario/solicitar-atendimento" variant="secondary" size="sm" onClick={() => setIsOpen(false)}>Solicitar atendimento</Button>
              </div>
            )}
            {user && isVoluntario && <Button href={portalPath} size="sm" onClick={() => setIsOpen(false)}>Portal do voluntário</Button>}
            {user && isAdmin && (
              <Button type="button" onClick={() => { setIsOpen(false); navigate('/inscricoes-pendentes'); }} variant={isAdmin ? 'primary' : 'secondary'} size="sm">
                Inscrições pendentes
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
      {confirmDialog}
    </nav>
  );
}

export default NavBar;
