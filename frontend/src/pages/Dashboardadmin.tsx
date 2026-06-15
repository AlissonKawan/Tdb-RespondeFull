import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useConfirm } from '../hooks/useConfirm';
import { voluntariosService, type Voluntario } from '../services/voluntariosService';
import { atendimentoService } from '../services/atendimentoService';
import { usuarioService } from '../services/usuarioService';
import { formatStatusLabel, formatDate } from '../utils/formatters';
import type { VoluntarioApi } from '../types/api';
import type { AtendimentoApi } from '../types/AtendimentoApi';
import type { AuthUser } from '../types/auth';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Container from '../components/ui/Container';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/FeedbackState';
import { Input, Select } from '../components/ui/Input';
import SectionTitle from '../components/ui/SectionTitle';
import StatCard from '../components/ui/StatCard';

type Aba = 'dashboard' | 'atendimentos' | 'voluntarios' | 'inscricoes';

export default function DashboardAdmin() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { confirm, ConfirmModal } = useConfirm();

  const [aba, setAba] = useState<Aba>('dashboard');
  
  // States para APIs
  const [atendimentos, setAtendimentos] = useState<AtendimentoApi[]>([]);
  const [voluntarios, setVoluntarios] = useState<VoluntarioApi[]>([]);
  const [beneficiarios, setBeneficiarios] = useState<AuthUser[]>([]);
  const [inscricoes, setInscricoes] = useState<Voluntario[]>([]);

  // States de UI
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [feedback, setFeedback] = useState('');
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');

  const carregarDados = async () => {
    setLoading(true);
    setErro('');
    try {
      const [
        atends, 
        vols, 
        users, 
        pends
      ] = await Promise.all([
        atendimentoService.listarTodos().catch(() => []),
        voluntariosService.listar().catch(() => []),
        usuarioService.listar().catch(() => []),
        voluntariosService.listarPendentes().catch(() => [])
      ]);

      setAtendimentos(atends);
      setVoluntarios(vols);
      setBeneficiarios(users.filter(u => u.tipoUsuario === 'BENEFICIARIO'));
      setInscricoes(pends);
    } catch (e) {
      setErro('Ocorreu um erro ao carregar os dados. Verifique a conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void carregarDados();
  }, []);

  const atendimentosFiltrados = atendimentos.filter((a) => {
    const passaStatus = filtroStatus === 'todos' || a.status === filtroStatus;
    const texto = `${a.pessoaAtendidaNome || a.beneficiarioNome || ''} ${a.canal || ''}`.toLowerCase();
    return passaStatus && texto.includes(busca.toLowerCase());
  });

  const mudarStatusAtendimento = async (id: number, novoStatus: string) => {
    try {
      await atendimentoService.atualizarStatusPrioridade(id, { status: novoStatus });
      setAtendimentos(atendimentos.map(a => a.id === id ? { ...a, status: novoStatus as any } : a));
    } catch {
      alert('Não foi possível atualizar o status.');
    }
  };

  const aprovarInscricao = async (id: number) => {
    setFeedback('');
    try {
      if (!user) return;
      await voluntariosService.aprovar(id, { aprovadorId: user.id });
      setFeedback('Voluntário aprovado com sucesso.');
      await carregarDados();
    } catch {
      setFeedback('Erro ao aprovar.');
    }
  };

  const rejeitarInscricao = async (id: number) => {
    setFeedback('');
    try {
      await voluntariosService.excluir(id);
      setFeedback('Inscrição rejeitada (excluída).');
      await carregarDados();
    } catch {
      setFeedback('Erro ao rejeitar.');
    }
  };

  const abas: [Aba, string][] = [
    ['dashboard', 'Dashboard'],
    ['atendimentos', 'Atendimentos'],
    ['voluntarios', 'Voluntários'],
    ['inscricoes', inscricoes.length ? `Inscrições (${inscricoes.length})` : 'Inscrições'],
  ];

  if (loading) return <div className="p-10"><LoadingState title="Carregando sistema..." /></div>;

  return (
    <div className="min-h-full bg-[#F8FAFC]">
      <header className="border-b border-[#E2E8F0] bg-white/90 backdrop-blur-xl">
        <Container className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mt-2 text-3xl font-black text-[#0F172A]">Painel do Administrador</h1>
            <p className="text-sm text-[#475569]">Logado como {user?.nome}</p>
          </div>
          <Button variant="secondary" onClick={() => {
            confirm({
              title: 'Sair da conta',
              message: 'Tem certeza que deseja encerrar a sua sessão?',
              confirmText: 'Sair',
              tone: 'danger',
              onConfirm: () => { logout(); navigate('/login'); }
            });
          }}>
            Sair
          </Button>
        </Container>
      </header>

      <Container className="py-4 md:py-8">
        <div className="mb-6 flex flex-wrap gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {abas.map(([id, label]) => (
            <Button key={id} variant={aba === id ? 'primary' : 'secondary'} size="sm" onClick={() => setAba(id)}>
              {label}
            </Button>
          ))}
        </div>

        {feedback && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{feedback}</div>}
        {erro && <ErrorState title={erro} />}

        {aba === 'dashboard' && (
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard label="Total" value={String(atendimentos.length)} description="Protocolos registrados" tone="blue" />
            <StatCard label="Abertos" value={String(atendimentos.filter(a => a.status === 'ABERTO' || a.status === 'Aberto').length)} description="Aguardando resposta" tone="orange" />
            <StatCard label="Voluntários" value={String(voluntarios.length)} description="Equipe cadastrada" tone="green" />
            <StatCard label="Beneficiários" value={String(beneficiarios.length)} description="Atendidos ativos" tone="slate" />
          </div>
        )}

        {aba === 'atendimentos' && (
          <div className="space-y-5">
            <SectionTitle title="Atendimentos" description="Acompanhe os protocolos reais." />
            <Card className="grid gap-3 p-4 md:grid-cols-2">
              <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou canal" />
              <Select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
                <option value="todos">Todos os status</option>
                <option value="ABERTO">ABERTO</option>
                <option value="EM_ATENDIMENTO">EM_ATENDIMENTO</option>
                <option value="ENCERRADO">ENCERRADO</option>
              </Select>
            </Card>
            {atendimentosFiltrados.length === 0 ? <EmptyState /> : (
              <div className="grid gap-4">
                {atendimentosFiltrados.map((item) => (
                  <Card key={item.id} className="p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-slate-900">#{item.id} {item.pessoaAtendidaNome || item.beneficiarioNome || 'Sem Nome'}</h3>
                          <Badge tone={item.status === 'ENCERRADO' ? 'success' : item.status === 'ABERTO' ? 'info' : 'warning'}>{formatStatusLabel(item.status)}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">Canal: {(item.canal === 'Sistema Web' || item.canal === 'sistemas web' || item.canal === 'sistema web' || item.canal === 'Sistemas Web') ? 'TDB - Responde' : (item.canal || 'Padrão')} | Criado em {formatDate(item.dataCriacao)}</p>
                        <p className="mt-1 text-sm text-slate-600">Responsável: {item.nomeVoluntario || 'Não atribuído'}</p>
                      </div>
                      <Select value={item.status || 'ABERTO'} onChange={(e) => {
                        const novoStatus = e.target.value;
                        confirm({
                          title: 'Alterar Status',
                          message: `Deseja realmente alterar o status deste atendimento para ${novoStatus}?`,
                          onConfirm: () => mudarStatusAtendimento(item.id, novoStatus)
                        });
                      }} className="md:w-48">
                        <option value="ABERTO">ABERTO</option>
                        <option value="EM_ATENDIMENTO">EM ATENDIMENTO</option>
                        <option value="ENCERRADO">ENCERRADO</option>
                      </Select>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {aba === 'voluntarios' && (
          <div className="space-y-4">
            <SectionTitle title="Voluntários Aprovados" description="Equipe cadastrada no sistema." />
            {voluntarios.length === 0 ? <EmptyState /> : (
              <Card className="overflow-hidden border-0 shadow-sm md:border md:shadow-none">
                <div className="overflow-x-auto w-full -mx-4 md:mx-0 px-4 md:px-0">
                  <table className="w-full text-sm min-w-[600px]">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-3 text-left">Nome</th>
                        <th className="px-4 py-3 text-left">Usuário</th>
                        <th className="px-4 py-3 text-left">Especialidade</th>
                        <th className="px-4 py-3 text-left">CRO</th>
                        <th className="px-4 py-3 text-left">Disponível</th>
                      </tr>
                    </thead>
                    <tbody>
                      {voluntarios.map((vol) => (
                        <tr key={vol.id} className="border-t border-slate-100">
                          <td className="px-4 py-3 font-semibold text-slate-800">{vol.nome}</td>
                          <td className="px-4 py-3 text-slate-500">{vol.usuario || 'N/A'}</td>
                          <td className="px-4 py-3"><Badge>{vol.especialidade?.nome || 'N/A'}</Badge></td>
                          <td className="px-4 py-3 text-slate-500">{vol.cro ? `${vol.cro} (${vol.ufCro || 'N/A'})` : 'N/A'}</td>
                          <td className="px-4 py-3">
                            <Badge tone={vol.disponivel ? 'success' : 'danger'}>{vol.disponivel ? 'Sim' : 'Não'}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}

        {aba === 'inscricoes' && (
          <div className="space-y-4">
            <SectionTitle title="Inscrições de voluntários Pendentes" description="Solicitações recebidas através da API." />
            {inscricoes.length === 0 ? <EmptyState title="Nenhuma inscrição recebida." /> : inscricoes.map((item) => (
              <Card key={item.id} className="p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-900">{item.nome}</h3>
                      <Badge tone="warning">Pendente</Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.usuario || 'Sem email'} | {item.especialidade?.nome || 'Sem especialidade'}
                      {item.cro && ` | CRO: ${item.cro} (${item.ufCro || 'N/A'})`}
                    </p>
                    {item.motivoVoluntariado && (
                      <p className="mt-3 text-sm text-slate-600 italic">"{item.motivoVoluntariado}"</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => {
                      confirm({
                        title: 'Aprovar Voluntário',
                        message: 'Deseja aprovar a inscrição deste voluntário?',
                        confirmText: 'Aprovar',
                        tone: 'primary',
                        onConfirm: () => aprovarInscricao(item.id)
                      });
                    }}>Aprovar</Button>
                    <Button size="sm" variant="danger" onClick={() => {
                      confirm({
                        title: 'Rejeitar Inscrição',
                        message: 'Deseja rejeitar e excluir esta inscrição?',
                        confirmText: 'Rejeitar',
                        tone: 'danger',
                        onConfirm: () => rejeitarInscricao(item.id)
                      });
                    }}>Rejeitar</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

      </Container>
      <ConfirmModal />
    </div>
  );
}
