import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';

export default function SystemLayout() {
  const { user, logout, isVoluntario, isBeneficiario, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-blue-600">Turma do Bem</h2>
          {user && (
            <p className="text-sm text-gray-500 mt-1">Olá, {user.nome}</p>
          )}
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {isAdmin && (
            <Link 
              to="/admin" 
              className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded transition-colors"
            >
              Dashboard Admin
            </Link>
          )}
          
          {(isVoluntario || isAdmin) && (
            <>
              <Link 
                to="/portal-voluntario" 
                className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded transition-colors"
              >
                Portal Voluntário
              </Link>
              <Link 
                to="/inscricoes-pendentes" 
                className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded transition-colors"
              >
                Inscrições Pendentes
              </Link>
              <Link 
                to="/ranking" 
                className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded transition-colors"
              >
                Ranking
              </Link>
            </>
          )}
          
          {(isBeneficiario || isAdmin) && (
            <>
              <Link 
                to="/portal-beneficiario" 
                className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded transition-colors"
              >
                Portal Beneficiário
              </Link>
              <Link 
                to="/beneficiario/solicitar-atendimento" 
                className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded transition-colors"
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
      <main className="flex-1 overflow-auto bg-gray-50">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
