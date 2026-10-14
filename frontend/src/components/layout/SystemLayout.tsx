import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { useConfirm } from '../../hooks/useConfirm';

interface NavigationItem {
  label: string;
  to: string;
  activeWhen?: (pathname: string) => boolean;
}

export default function SystemLayout() {
  const { user, logout, isVoluntario, isBeneficiario, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { confirm, confirmDialog } = useConfirm();
  const sidebarRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const navigation: NavigationItem[] = [
    ...(isAdmin ? [
      { label: 'Dashboard Admin', to: '/admin' },
      { label: 'Inscrições Pendentes', to: '/inscricoes-pendentes' },
    ] : []),
    ...(isVoluntario || isAdmin ? [
      { label: 'Portal Voluntário', to: '/portal-voluntario', activeWhen: (path: string) => path.includes('/portal-voluntario') },
      { label: 'Cronograma', to: '/cronograma' },
      { label: 'Minha Agenda', to: '/agenda' },
      { label: 'Ranking', to: '/ranking' },
      { label: 'Mensagens de Contato', to: '/mensagens-contato' },
    ] : []),
    ...(isBeneficiario || isAdmin ? [
      { label: 'Portal Beneficiário', to: '/portal-beneficiario', activeWhen: (path: string) => path.includes('/portal-beneficiario') },
      { label: 'Solicitar Atendimento', to: '/beneficiario/solicitar-atendimento', activeWhen: (path: string) => path.includes('/solicitar-atendimento') },
    ] : []),
  ];

  useEffect(() => {
    if (!isSidebarOpen) return;
    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    sidebar.querySelector<HTMLElement>('button, a')?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsSidebarOpen(false);
        menuButtonRef.current?.focus();
        return;
      }

      if (event.key !== 'Tab') return;
      const focusable = Array.from(sidebar.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]'));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSidebarOpen]);

  const closeSidebar = () => setIsSidebarOpen(false);

  const handleLogout = () => {
    confirm({
      title: 'Sair da conta',
      message: 'Você realmente quer sair da conta?',
      confirmText: 'Sair',
      tone: 'danger',
      onConfirm: () => {
        logout();
        navigate('/login');
      },
    });
  };

  const linkClass = (active: boolean) =>
    `block min-h-11 rounded-ui px-4 py-3 text-sm font-semibold transition-[color,background-color,box-shadow] duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
      active
        ? 'bg-blue-50 text-blue-800 ring-1 ring-blue-100'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    }`;

  return (
    <div className="flex min-h-dvh overflow-hidden bg-muted">
      {isSidebarOpen ? (
        <button
          type="button"
          tabIndex={-1}
          aria-label="Fechar menu lateral"
          className="fixed inset-0 z-40 cursor-default bg-slate-950/55 backdrop-blur-sm md:hidden"
          onClick={closeSidebar}
        />
      ) : null}

      <aside
        ref={sidebarRef}
        id="menu-sistema"
        aria-label="Navegação do sistema"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[88vw] transform flex-col border-r border-border bg-surface shadow-xl transition-transform duration-normal ease-out md:relative md:w-64 md:translate-x-0 md:shadow-none ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border p-5">
          <div className="min-w-0">
            <p className="text-lg font-bold tracking-tight text-primary">Turma do Bem</p>
            {user ? <p className="mt-1 truncate text-sm text-muted-foreground">Olá, {user.nome}</p> : null}
          </div>
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={closeSidebar}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-ui text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto overscroll-contain p-4">
          {navigation.map((item) => {
            const active = item.activeWhen ? item.activeWhen(location.pathname) : location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={closeSidebar}
                aria-current={active ? 'page' : undefined}
                className={linkClass(active)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border bg-muted/45 p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="min-h-11 w-full rounded-ui px-4 py-3 text-left text-sm font-semibold text-danger transition-colors duration-fast hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
          >
            Sair
          </button>
        </div>
      </aside>

      <main id="conteudo-principal" className="flex min-w-0 flex-1 flex-col bg-background">
        <header className="z-10 flex items-center border-b border-border bg-surface px-4 py-3 md:hidden">
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Abrir menu do sistema"
            aria-expanded={isSidebarOpen}
            aria-controls="menu-sistema"
            className="flex h-11 w-11 items-center justify-center rounded-ui text-muted-foreground transition-colors duration-fast hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <p className="ml-3 text-lg font-bold tracking-tight text-primary">Turma do Bem</p>
        </header>

        <div className="min-h-0 flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
      {confirmDialog}
    </div>
  );
}
