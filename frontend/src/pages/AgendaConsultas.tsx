import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import PageHeader from '../components/ui/PageHeader';
import Container from '../components/ui/Container';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { useAuth } from '../context/useAuth';

// Dados Fixos que nunca somem ao recarregar
const MOCK_CONSULTAS = [
  {
    id: 1,
    paciente: 'Ana S.',
    tipo: 'Avaliação Inicial',
    data: 'Hoje',
    horario: '14:00 - 15:00',
    status: 'CONFIRMADO',
    tipoPessoa: 'MULHER_APOLONIA',
  },
  {
    id: 2,
    paciente: 'Lucas (Resp: Maria)',
    tipo: 'Tratamento de Cárie',
    data: 'Hoje',
    horario: '16:30 - 17:30',
    status: 'AGUARDANDO',
    tipoPessoa: 'CRIANCA_ADOLESCENTE',
  },
  {
    id: 3,
    paciente: 'Beatriz N.',
    tipo: 'Retorno',
    data: 'Amanhã',
    horario: '09:00 - 10:00',
    status: 'CONFIRMADO',
    tipoPessoa: 'MULHER_APOLONIA',
  },
  {
    id: 4,
    paciente: 'João Pedro',
    tipo: 'Limpeza',
    data: 'Amanhã',
    horario: '11:00 - 12:00',
    status: 'REAGENDAR',
    tipoPessoa: 'CRIANCA_ADOLESCENTE',
  }
];

export default function AgendaConsultas() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filtro, setFiltro] = useState<'Todos' | 'Hoje' | 'Amanhã'>('Todos');

  const consultasFiltradas = MOCK_CONSULTAS.filter(c => {
    if (filtro === 'Todos') return true;
    return c.data === filtro;
  });

  return (
    <PageShell>
      <header className="border-b border-[#E2E8F0] bg-white/90 backdrop-blur-xl">
        <Container className="flex items-center justify-between py-4">
          <div>
            <button onClick={() => navigate('/portal-voluntario')} className="text-sm font-semibold text-[#2563EB] hover:text-[#1E3A8A]">
              ← Voltar para o portal
            </button>
            <p className="mt-1 text-sm text-[#475569]">Agenda de {user?.nome || 'Voluntário'}</p>
          </div>
        </Container>
      </header>

      <PageHeader
        eyebrow="Agenda"
        title="Meus Horários"
        description="Acompanhe suas consultas marcadas com os beneficiários da ONG."
      />

      <Container className="py-8">
        <div className="flex gap-2 mb-8">
          <Button variant={filtro === 'Todos' ? 'primary' : 'secondary'} onClick={() => setFiltro('Todos')}>Todos</Button>
          <Button variant={filtro === 'Hoje' ? 'primary' : 'secondary'} onClick={() => setFiltro('Hoje')}>Hoje</Button>
          <Button variant={filtro === 'Amanhã' ? 'primary' : 'secondary'} onClick={() => setFiltro('Amanhã')}>Amanhã</Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {consultasFiltradas.map((consulta) => (
            <Card key={consulta.id} className="p-6 border-l-4 border-l-[#2563EB] hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <Badge tone={consulta.status === 'CONFIRMADO' ? 'success' : consulta.status === 'AGUARDANDO' ? 'warning' : 'danger'}>
                  {consulta.status}
                </Badge>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                  {consulta.data}
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-[#0F172A]">{consulta.paciente}</h3>
              <p className="text-sm text-[#475569] mt-1">{consulta.tipo}</p>
              
              <div className="mt-6 flex items-center gap-2 text-[#1E3A8A] font-semibold bg-blue-50 px-3 py-2 rounded-lg w-max">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {consulta.horario}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                <Button variant="ghost" size="small" onClick={() => alert('Na versão final, isso abrirá o prontuário do paciente!')}>
                  Ver Prontuário
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </PageShell>
  );
}
