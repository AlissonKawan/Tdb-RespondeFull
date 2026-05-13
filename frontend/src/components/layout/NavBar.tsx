import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import Button from '../ui/Button';
import Container from '../ui/Container';

function NavBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isVoluntario, isBeneficiario, isAdmin } = useAuth();

  const linkClass = (path: string) =>
    `rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
      location.pathname === path
        ? 'bg-white text-[#0F172A] shadow-sm ring-1 ring-[#E2E8F0]'
        : 'text-[#475569] hover:bg-white hover:text-[#0F172A]'
    }`;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const portalPath = isVoluntario
    ? '/portal-voluntario'
    : isBeneficiario
      ? '/portal-beneficiario'
      : '/admin';

  return (
    <nav className="sticky top-0 z-40 border-b border-[#E2E8F0]/80 bg-[#F8FAFC]/85 backdrop-blur-xl">
      <Container className="flex flex-wrap items-center justify-center gap-2 py-3">
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

        {!user && <span className="mx-2 hidden h-6 w-px bg-slate-200 sm:block" />}

        {!user && <Button href="/login" size="sm">Entrar</Button>}
        {!user && <Button href="/cadastro-beneficiario" variant="secondary" size="sm">Criar conta beneficiario</Button>}
        {user && <span className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-[#475569] ring-1 ring-[#E2E8F0]">{user.nome}</span>}
        {user && isBeneficiario && <Button href={portalPath} size="sm">Meu portal</Button>}
        {user && isBeneficiario && <Button href="/beneficiario/solicitar-atendimento" variant="secondary" size="sm">Solicitar atendimento</Button>}
        {user && isVoluntario && <Button href={portalPath} size="sm">Portal do voluntario</Button>}
        {user && (isVoluntario || isAdmin) && (
          <Button type="button" onClick={() => navigate('/inscricoes-pendentes')} variant={isAdmin ? 'primary' : 'secondary'} size="sm">
            Inscricoes pendentes
          </Button>
        )}
        {user && (
          <Button type="button" variant="ghost" size="sm" onClick={handleLogout}>
            Sair
          </Button>
        )}
      </Container>
    </nav>
  );
}

export default NavBar;
