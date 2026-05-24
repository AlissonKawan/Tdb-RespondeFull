// src/App.tsx
// Rotas atualizadas com sistema de autenticação.

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/ui/ProtectedRoute';

// Páginas institucionais (já existiam)
import Home from './pages/Home';
import Sobre from './pages/Sobre';
import FAQ from './pages/FAQ';
import Contato from './pages/Contato';
import Integrantes from './pages/Integrantes';
import Roadmap from './pages/Roadmap';

// Páginas novas
import Login from './pages/Login';
import DashboardAdmin from './pages/Dashboardadmin';
import PortalBeneficiario from './pages/PortalBeneficiario';
import CadastroVoluntario from './pages/CadastroVoluntario';
import CadastroBeneficiario from './pages/CadastroBeneficiario';
import PortalVoluntario from './pages/PortalVoluntario';
import AprovacaoVoluntarios from './pages/AprovacaoVoluntarios';
import SolicitarAtendimento from './pages/SolicitarAtendimento';
import DetalheAtendimento from './pages/DetalheAtendimento';
import RankingVoluntarios from './pages/RankingVoluntarios';

function App() {
  return (
    // AuthProvider envolve tudo — contexto disponível em qualquer componente
    <AuthProvider>
      <Router>
        <Routes>

          {/* Rotas com Layout (Header + NavBar + Footer) */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="sobre" element={<Sobre />} />
            <Route path="faq" element={<FAQ />} />
            <Route path="contato" element={<Contato />} />
            <Route path="integrantes" element={<Integrantes />} />
            <Route path="roadmap" element={<Roadmap />} />
            <Route path="solucao" element={<Roadmap />} />
            <Route path="login" element={<Login />} />
            <Route path="cadastro" element={<CadastroVoluntario />} />
            <Route path="cadastro-voluntario" element={<CadastroVoluntario />} />
            <Route path="cadastro-beneficiario" element={<CadastroBeneficiario />} />
            <Route path="quero-ser-voluntario" element={<CadastroVoluntario />} />
          </Route>

          {/* Rotas protegidas — SEM o layout institucional (header/footer da ONG) */}
          {/* Voluntário: painel de administração */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireVoluntario>
                <DashboardAdmin />
              </ProtectedRoute>
            }
          />

          {/* Beneficiário: portal de acompanhamento */}
          <Route
            path="/portal"
            element={
              <ProtectedRoute>
                <PortalBeneficiario />
              </ProtectedRoute>
            }
          />

          <Route
            path="/portal/beneficiario"
            element={
              <ProtectedRoute allowedRoles={['BENEFICIARIO', 'ADMIN']}>
                <PortalBeneficiario />
              </ProtectedRoute>
            }
          />

          <Route
            path="/portal-beneficiario"
            element={
              <ProtectedRoute allowedRoles={['BENEFICIARIO']}>
                <PortalBeneficiario />
              </ProtectedRoute>
            }
          />

          <Route
            path="/portal/voluntario"
            element={
              <ProtectedRoute allowedRoles={['VOLUNTARIO', 'ADMIN']}>
                <PortalVoluntario />
              </ProtectedRoute>
            }
          />

          <Route
            path="/portal-voluntario"
            element={
              <ProtectedRoute allowedRoles={['VOLUNTARIO', 'ADMIN']}>
                <PortalVoluntario />
              </ProtectedRoute>
            }
          />

          <Route
            path="/beneficiario/solicitar-atendimento"
            element={
              <ProtectedRoute allowedRoles={['BENEFICIARIO']}>
                <SolicitarAtendimento />
              </ProtectedRoute>
            }
          />

          <Route
            path="/atendimentos/:id"
            element={
              <ProtectedRoute>
                <DetalheAtendimento />
              </ProtectedRoute>
            }
          />

          <Route
            path="/inscricoes-pendentes"
            element={
              <ProtectedRoute allowedRoles={['VOLUNTARIO', 'ADMIN']}>
                <AprovacaoVoluntarios />
              </ProtectedRoute>
            }
          />

          <Route
            path="/inscricoes-voluntarios"
            element={
              <ProtectedRoute allowedRoles={['VOLUNTARIO', 'ADMIN']}>
                <AprovacaoVoluntarios />
              </ProtectedRoute>
            }
          />

          <Route
            path="/ranking"
            element={
              <ProtectedRoute allowedRoles={['VOLUNTARIO', 'ADMIN']}>
                <RankingVoluntarios />
              </ProtectedRoute>
            }
          />

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
