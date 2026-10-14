import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { useConfirm } from '../../hooks/useConfirm';

export default function SystemLayout() {
  const { user, logout, isVoluntario, isBeneficiario, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { confirm, ConfirmModal } = useConfirm();

  const handleLogout = () => {
    confirm({
      title: 'Sair da conta',
      message: 'Você realmente quer sair da conta?',
      confirmText: 'Sair',
      tone: 'danger',
      onConfirm: () => {
        logout();
        navigate('/login');
      }
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 flex w-64 transform flex-col border-r border-slate-200/80 bg-white shadow-xl shadow-slate-950/5 transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="border-b border-slate-200/80 bg-gradient-to-br from-white to-blue-50/50 p-5">
          <h2 className="text-xl font-bold tracking-tight text-blue-700">Turma do Bem</h2>
          {user && (
            <p className="mt-1 text-sm font-medium text-slate-600">Olá, {user.nome}</p>
          )}
        </div>
        
        <nav className="flex-1 space-y-1.5 overflow-y-auto p-4">
          {isAdmin && (
            <>
              <Link 
                to="/admin" 
                onClick={() => setIsSidebarOpen(false)}
                className={`block rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${location.pathname === '/admin' ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                Dashboard Admin
              </Link>
              <Link 
                to="/inscricoes-pendentes" 
                onClick={() => setIsSidebarOpen(false)}
                className={`block rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${location.pathname === '/inscricoes-pendentes' ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                Inscrições Pendentes
              </Link>
            </>
          )}
          
          {(isVoluntario || isAdmin) && (
            <>
              <Link 
                to="/portal-voluntario" 
                onClick={() => setIsSidebarOpen(false)}
                className={`block rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${location.pathname.includes('/portal-voluntario') ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                Portal Voluntário
              </Link>
              <Link 
                to="/cronograma" 
                onClick={() => setIsSidebarOpen(false)}
                className={`block rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${location.pathname === '/cronograma' ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                Cronograma
              </Link>
              <Link 
                to="/agenda" 
                onClick={() => setIsSidebarOpen(false)}
                className={`block rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${location.pathname === '/agenda' ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                Minha Agenda
              </Link>
              <Link 
                to="/ranking" 
                onClick={() => setIsSidebarOpen(false)}
                className={`block rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${location.pathname === '/ranking' ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                Ranking
              </Link>
              <Link 
                to="/mensagens-contato" 
                onClick={() => setIsSidebarOpen(false)}
                className={`block rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${location.pathname === '/mensagens-contato' ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                Mensagens de Contato
              </Link>
            </>
          )}
          
          {(isBeneficiario || isAdmin) && (
            <>
              <Link 
                to="/portal-beneficiario" 
                onClick={() => setIsSidebarOpen(false)}
                className={`block rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${location.pathname.includes('/portal-beneficiario') ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                Portal Beneficiário
              </Link>
              <Link 
                to="/beneficiario/solicitar-atendimento" 
                onClick={() => setIsSidebarOpen(false)}
                className={`block rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${location.pathname.includes('/solicitar-atendimento') ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                Solicitar Atendimento
              </Link>
            </>
          )}
        </nav>

        <div className="border-t border-slate-200/80 bg-slate-50/70 p-4">
          <button 
            onClick={handleLogout}
            className="w-full rounded-xl px-4 py-2.5 text-left text-sm font-semibold text-red-600 transition-all hover:bg-red-50 active:scale-[0.98]"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
        {/* Mobile Top Header (Only visible on small screens) */}
        <div className="z-10 flex items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-xl md:hidden">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="rounded-xl p-2 text-slate-600 transition hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <h1 className="text-lg font-bold tracking-tight text-blue-700">Turma do Bem</h1>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
      <ConfirmModal />
    </div>
  );
}
