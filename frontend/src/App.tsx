// src/App.tsx
// Rotas atualizadas com sistema de autenticação.


import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import SystemLayout from './components/layout/SystemLayout';
import ProtectedRoute from './components/ui/ProtectedRoute';
import SessionGate from './components/ui/SessionGate';
import { AccountRedirect, GuestOnly } from './components/ui/AccountRedirect';
import { LoadingState } from './components/ui/FeedbackState';

// Páginas institucionais (Lazy Loaded)
const Home = React.lazy(() => import('./pages/Home'));
const Sobre = React.lazy(() => import('./pages/Sobre'));
const FAQ = React.lazy(() => import('./pages/FAQ'));
const Contato = React.lazy(() => import('./pages/Contato'));
const Integrantes = React.lazy(() => import('./pages/Integrantes'));
const Solucao = React.lazy(() => import('./pages/Solucao'));

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
const MensagensContato = React.lazy(() => import('./pages/MensagensContato'));
const AgendaConsultas = React.lazy(() => import('./pages/AgendaConsultas'));

function App() {
  return (
    // AuthProvider envolve tudo — contexto disponível em qualquer componente
    <AuthProvider>
      <Router>
        <SessionGate>
        <Suspense fallback={<div className="min-h-dvh bg-background p-6 md:p-10"><LoadingState title="Carregando página..." count={3} /></div>}>
          <Routes>
            <Route element={<GuestOnly />}>
              <Route path="login" element={<Login />} />
            </Route>

            {/* Rotas públicas com Layout (Header + NavBar + Footer) */}
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="institucional" element={<Home />} />
              <Route path="sobre" element={<Sobre />} />
              <Route path="faq" element={<FAQ />} />
              <Route path="contato" element={<Contato />} />
              <Route path="integrantes" element={<Integrantes />} />
              <Route path="roadmap" element={<Navigate to="/solucao" replace />} />
              <Route path="solucao" element={<Solucao />} />
              <Route path="cadastro" element={<CadastroVoluntario />} />
              <Route path="cadastro-voluntario" element={<CadastroVoluntario />} />
              <Route path="cadastro-beneficiario" element={<CadastroBeneficiario />} />
              <Route path="quero-ser-voluntario" element={<CadastroVoluntario />} />
            </Route>
            {/* Rotas protegidas (Sistema) usando SystemLayout */}
            <Route element={<ProtectedRoute><SystemLayout /></ProtectedRoute>}>
              {/* Voluntário: painel de administração */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <DashboardAdmin />
                  </ProtectedRoute>
                }
              />

              {/* Beneficiário: portal de acompanhamento */}
              <Route
                path="/portal"
                element={
                  <ProtectedRoute>
                    <AccountRedirect />
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

              <Route
                path="/mensagens-contato"
                element={
                  <ProtectedRoute allowedRoles={['VOLUNTARIO', 'ADMIN']}>
                    <MensagensContato />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/agenda"
                element={
                  <ProtectedRoute allowedRoles={['VOLUNTARIO', 'ADMIN']}>
                    <AgendaConsultas />
                  </ProtectedRoute>
                }
              />
            </Route>

            <Route path="*" element={<AccountRedirect />} />
          </Routes>
        </Suspense>
        </SessionGate>
      </Router>
    </AuthProvider>
  );
}

export default App;
