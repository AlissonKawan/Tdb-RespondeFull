import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { useConfirm } from '../../hooks/useConfirm';

type NavigationGroup = 'GESTÃO & CONTROLE' | 'CLÍNICA & AGENDA' | 'COMUNICAÇÃO';
type IconName = 'dashboard' | 'inscricoes' | 'voluntario' | 'beneficiario' | 'cronograma' | 'agenda' | 'ranking' | 'mensagens' | 'atendimento';

interface NavigationItem {
  label: string;
  to: string;
  group: NavigationGroup;
  icon: IconName;
  activeWhen?: (pathname: string) => boolean;
}

const GROUPS: NavigationGroup[] = ['GESTÃO & CONTROLE', 'CLÍNICA & AGENDA', 'COMUNICAÇÃO'];

const ROUTE_LABELS: Array<{ matches: (pathname: string) => boolean; label: string }> = [
  { matches: (path) => path === '/admin', label: 'Painel do administrador' },
  { matches: (path) => path === '/inscricoes-pendentes' || path === '/inscricoes-voluntarios', label: 'Inscrições pendentes' },
  { matches: (path) => path === '/portal-voluntario' || path === '/portal/voluntario', label: 'Portal do voluntário' },
  { matches: (path) => path === '/portal-beneficiario' || path === '/portal/beneficiario', label: 'Portal do beneficiário' },
  { matches: (path) => path === '/beneficiario/solicitar-atendimento', label: 'Solicitar atendimento' },
  { matches: (path) => path.startsWith('/atendimentos/'), label: 'Detalhes do atendimento' },
  { matches: (path) => path === '/cronograma', label: 'Cronograma' },
  { matches: (path) => path === '/agenda', label: 'Minha agenda' },
  { matches: (path) => path === '/ranking', label: 'Ranking' },
  { matches: (path) => path === '/mensagens-contato', label: 'Mensagens de contato' },
];

function getRouteLabel(pathname: string) {
  return ROUTE_LABELS.find((route) => route.matches(pathname))?.label ?? 'Sistema';
}

function getRoleLabel(role?: string) {
  if (role === 'ADMIN') return 'ADMIN';
  if (role === 'VOLUNTARIO') return 'VOLUNTÁRIO';
  if (role === 'BENEFICIARIO') return 'BENEFICIÁRIO';
  return 'USUÁRIO';
}

function getInitials(name?: string) {
  if (!name?.trim()) return 'US';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function NavIcon({ name }: { name: IconName }) {
  let content: ReactNode;

  switch (name) {
    case 'dashboard':
      content = <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>;
      break;
    case 'inscricoes':
      content = <><path d="M9 6h11M9 12h11M9 18h7" strokeLinecap="round" /><path d="m3.5 6 .8.8L6 5m-2.5 7 .8.8L6 11m-2.5 7 .8.8L6 17" strokeLinecap="round" strokeLinejoin="round" /></>;
      break;
    case 'voluntario':
      content = <><path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.7A4 4 0 0 1 19 11c0 5.6-7 10-7 10Z" strokeLinejoin="round" /><path d="M12 8.5v6M9 11.5h6" strokeLinecap="round" /></>;
      break;
    case 'beneficiario':
      content = <><circle cx="12" cy="8" r="3" /><path d="M5 20a7 7 0 0 1 14 0M4 13H2m20 0h-2" strokeLinecap="round" /></>;
      break;
    case 'cronograma':
      content = <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4m8-4v4M3 10h18M8 14h3m-3 3h7" strokeLinecap="round" /></>;
      break;
    case 'agenda':
      content = <><rect x="4" y="4" width="16" height="17" rx="2" /><path d="M8 2v4m8-4v4M8 11h8m-8 4h5" strokeLinecap="round" /></>;
      break;
    case 'ranking':
      content = <><path d="M8 21v-7H4v7m12 0V9h4v12m-10 0V3h4v18" strokeLinecap="round" strokeLinejoin="round" /></>;
      break;
    case 'mensagens':
      content = <path d="M5 18.5 3 21v-5a8 8 0 1 1 3 3.1" strokeLinecap="round" strokeLinejoin="round" />;
      break;
    case 'atendimento':
      content = <><path d="M4 20V8l8-4 8 4v12" strokeLinejoin="round" /><path d="M9 13h6M12 10v6" strokeLinecap="round" /></>;
      break;
  }

  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      {content}
    </svg>
  );
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
      { label: 'Dashboard Admin', to: '/admin', group: 'GESTÃO & CONTROLE' as const, icon: 'dashboard' as const },
      { label: 'Inscrições Pendentes', to: '/inscricoes-pendentes', group: 'GESTÃO & CONTROLE' as const, icon: 'inscricoes' as const },
    ] : []),
    ...(isVoluntario || isAdmin ? [
      { label: 'Portal Voluntário', to: '/portal-voluntario', group: 'GESTÃO & CONTROLE' as const, icon: 'voluntario' as const, activeWhen: (path: string) => path.includes('/portal-voluntario') },
      { label: 'Cronograma', to: '/cronograma', group: 'CLÍNICA & AGENDA' as const, icon: 'cronograma' as const },
      { label: 'Minha Agenda', to: '/agenda', group: 'CLÍNICA & AGENDA' as const, icon: 'agenda' as const },
      { label: 'Ranking', to: '/ranking', group: 'CLÍNICA & AGENDA' as const, icon: 'ranking' as const },
      { label: 'Mensagens de Contato', to: '/mensagens-contato', group: 'COMUNICAÇÃO' as const, icon: 'mensagens' as const },
    ] : []),
    ...(isBeneficiario || isAdmin ? [
      { label: 'Portal Beneficiário', to: '/portal-beneficiario', group: 'GESTÃO & CONTROLE' as const, icon: 'beneficiario' as const, activeWhen: (path: string) => path.includes('/portal-beneficiario') },
      { label: 'Solicitar Atendimento', to: '/beneficiario/solicitar-atendimento', group: 'CLÍNICA & AGENDA' as const, icon: 'atendimento' as const, activeWhen: (path: string) => path.includes('/solicitar-atendimento') },
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
  const currentRouteLabel = getRouteLabel(location.pathname);

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
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[88vw] transform flex-col border-r border-blue-100 bg-white shadow-2xl transition-transform duration-normal ease-out md:relative md:translate-x-0 md:transform-none md:shadow-none ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="border-b border-blue-100 bg-gradient-to-b from-blue-50/80 to-white p-5">
          <div className="flex items-start justify-between gap-3">
            <img src="/img/logo-header.png" alt="Turma do Bem" className="h-12 w-auto max-w-40 object-contain object-left" />
            <button
              type="button"
              aria-label="Fechar menu"
              onClick={closeSidebar}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-ui text-muted-foreground transition-colors hover:bg-white hover:text-foreground md:hidden"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" d="m6 6 12 12M18 6 6 18" />
              </svg>
            </button>
          </div>

          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-blue-100 bg-white p-3 shadow-sm">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-black text-white ring-4 ring-blue-50" aria-hidden="true">
              {getInitials(user?.nome)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-950">{user?.nome ?? 'Usuário'}</p>
              <span className="mt-1 inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[0.625rem] font-extrabold tracking-wide text-blue-700 ring-1 ring-blue-100">
                {getRoleLabel(user?.tipoUsuario)}
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-5">
          {GROUPS.map((group, groupIndex) => {
            const items = navigation.filter((item) => item.group === group);
            if (items.length === 0) return null;

            return (
              <div key={group} className={groupIndex > 0 ? 'mt-5 border-t border-slate-100 pt-5' : ''}>
                <p className="mb-2 px-3 text-[0.625rem] font-extrabold tracking-[0.14em] text-slate-400">{group}</p>
                <div className="space-y-1">
                  {items.map((item) => {
                    const active = item.activeWhen ? item.activeWhen(location.pathname) : location.pathname === item.to;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={closeSidebar}
                        aria-current={active ? 'page' : undefined}
                        className={`relative flex min-h-11 items-center gap-3 rounded-r-xl rounded-l-md px-3 py-2.5 text-sm transition-[color,background-color] duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          active
                            ? 'bg-primary/10 font-semibold text-primary before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-r-full before:bg-primary'
                            : 'font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                        }`}
                      >
                        <NavIcon name={item.icon} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-600 transition-colors duration-fast hover:bg-red-50 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M10 5H5v14h5M14 8l4 4-4 4m4-4H9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Sair da conta
          </button>
        </div>
      </aside>

      <main id="conteudo-principal" className="flex min-w-0 flex-1 flex-col bg-background">
        <header className="z-10 flex h-16 shrink-0 items-center border-b border-border bg-white/95 px-4 backdrop-blur md:h-20 md:px-6 lg:px-8">
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Abrir menu do sistema"
            aria-expanded={isSidebarOpen}
            aria-controls="menu-sistema"
            className="mr-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-ui text-muted-foreground transition-colors duration-fast hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.6875rem] font-semibold text-muted-foreground">Área restrita</p>
            <p className="truncate text-base font-bold tracking-tight text-foreground md:text-lg">{currentRouteLabel}</p>
          </div>

          <div className="ml-4 hidden items-center gap-2 rounded-full border border-blue-100 bg-blue-50/70 py-1.5 pl-2 pr-3 md:flex">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[0.625rem] font-black text-white" aria-hidden="true">{getInitials(user?.nome)}</span>
            <span className="max-w-44 truncate text-xs font-semibold text-slate-700">{user?.nome ?? 'Usuário'}</span>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
      {confirmDialog}
    </div>
  );
}
