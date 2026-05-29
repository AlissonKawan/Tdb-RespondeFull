// src/App.tsx
// Rotas atualizadas com sistema de autenticação.


import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import SystemLayout from './components/layout/SystemLayout';
import ProtectedRoute from './components/ui/ProtectedRoute';

// Páginas institucionais (Lazy Loaded)
const Home = React.lazy(() => import('./pages/Home'));
const Sobre = React.lazy(() => import('./pages/Sobre'));
const FAQ = React.lazy(() => import('./pages/FAQ'));
const Contato = React.lazy(() => import('./pages/Contato'));
const Integrantes = React.lazy(() => import('./pages/Integrantes'));
const Roadmap = React.lazy(() => import('./pages/Roadmap'));

// Páginas novas (Lazy Loaded)
const Login = React.lazy(() => import('./pages/Login'));
const DashboardAdmin = React.lazy(() => import('./pages/Dashboardadmin'));
const PortalBeneficiario = React.lazy(() => import('./pages/PortalBeneficiario'));
const CadastroVoluntario = React.lazy(() => import('./pages/CadastroVoluntario'));
const CadastroBeneficiario = React.lazy(() => import('./pages/CadastroBeneficiario'));
const PortalVoluntario = React.lazy(() => import('./pages/PortalVoluntario'));
const AprovacaoVoluntarios = React.lazy(() => import('./pages/AprovacaoVoluntarios'));
const SolicitarAtendimento = React.lazy(() => import('./pages/SolicitarAtendimento'));
const DetalheAtendimento = React.lazy(() => import('./pages/DetalheAtendimento'));
const RankingVoluntarios = React.lazy(() => import('./pages/RankingVoluntarios'));
const Cronograma = React.lazy(() => import('./pages/Cronograma'));

function App() {
  return (
    // AuthProvider envolve tudo — contexto disponível em qualquer componente
    <AuthProvider>
      <Router>
        <Suspense fallback={<div className="flex items-center justify-center h-screen text-blue-600">Carregando...</div>}>
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

            {/* Rotas protegidas (Sistema) usando SystemLayout */}
            <Route element={<SystemLayout />}>
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
                  <ProtectedRoute allowedRoles={['BENEFICIARIO', 'ADMIN']}>
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
                path="/cronograma"
                element={
                  <ProtectedRoute allowedRoles={['VOLUNTARIO', 'ADMIN']}>
                    <Cronograma />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/beneficiario/solicitar-atendimento"
                element={
                  <ProtectedRoute allowedRoles={['BENEFICIARIO', 'ADMIN']}>
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
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AprovacaoVoluntarios />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/inscricoes-voluntarios"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
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
            </Route>

          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
