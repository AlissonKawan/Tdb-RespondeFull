import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';

export default function SystemLayout() {
  const { user, logout, isVoluntario, isBeneficiario, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl flex flex-col transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-blue-600">Turma do Bem</h2>
          {user && (
            <p className="text-sm text-gray-500 mt-1">Olá, {user.nome}</p>
          )}
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {isAdmin && (
            <>
              <Link 
                to="/admin" 
                onClick={() => setIsSidebarOpen(false)}
                className={`block px-4 py-2 rounded transition-colors ${location.pathname === '/admin' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-slate-50'}`}
              >
                Dashboard Admin
              </Link>
              <Link 
                to="/inscricoes-pendentes" 
                onClick={() => setIsSidebarOpen(false)}
                className={`block px-4 py-2 rounded transition-colors ${location.pathname === '/inscricoes-pendentes' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-slate-50'}`}
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
                className={`block px-4 py-2 rounded transition-colors ${location.pathname.includes('/portal-voluntario') ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-slate-50'}`}
              >
                Portal Voluntário
              </Link>
              <Link 
                to="/cronograma" 
                onClick={() => setIsSidebarOpen(false)}
                className={`block px-4 py-2 rounded transition-colors ${location.pathname === '/cronograma' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-slate-50'}`}
              >
                Cronograma
              </Link>
              <Link 
                to="/ranking" 
                onClick={() => setIsSidebarOpen(false)}
                className={`block px-4 py-2 rounded transition-colors ${location.pathname === '/ranking' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-slate-50'}`}
              >
                Ranking
              </Link>
            </>
          )}
          
          {(isBeneficiario || isAdmin) && (
            <>
              <Link 
                to="/portal-beneficiario" 
                onClick={() => setIsSidebarOpen(false)}
                className={`block px-4 py-2 rounded transition-colors ${location.pathname.includes('/portal-beneficiario') ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-slate-50'}`}
              >
                Portal Beneficiário
              </Link>
              <Link 
                to="/beneficiario/solicitar-atendimento" 
                onClick={() => setIsSidebarOpen(false)}
                className={`block px-4 py-2 rounded transition-colors ${location.pathname.includes('/solicitar-atendimento') ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-slate-50'}`}
              >
                Solicitar Atendimento
              </Link>
            </>
          )}
        </nav>

        <div className="p-4 border-t">
          <button 
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded font-medium transition-colors"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
        {/* Mobile Top Header (Only visible on small screens) */}
        <div className="md:hidden flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="text-gray-600 hover:text-blue-600 focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <h1 className="text-lg font-bold text-blue-600">Turma do Bem</h1>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
