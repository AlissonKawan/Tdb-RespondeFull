import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { getEspecialidades } from '../services/especialidadesService';
import { voluntariosService, type Voluntario } from '../services/voluntariosService';
import { atendimentoService } from '../services/atendimentoService';
import { usuarioService } from '../services/usuarioService';
import type { EspecialidadeApi, VoluntarioApi } from '../types/api';
import type { AtendimentoApi } from '../types/AtendimentoApi';
import type { AuthUser } from '../types/auth';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Container from '../components/ui/Container';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/FeedbackState';
import { Field, Input, Select, Textarea } from '../components/ui/Input';
import SectionTitle from '../components/ui/SectionTitle';
import StatCard from '../components/ui/StatCard';

type Aba = 'dashboard' | 'atendimentos' | 'novo' | 'voluntarios' | 'beneficiarios' | 'inscricoes';

export default function DashboardAdmin() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
  const [submitting, setSubmitting] = useState(false);

  // States para Novo Atendimento
  const [novoAtendimento, setNovoAtendimento] = useState({
    beneficiarioId: '',
    prioridade: '2',
    canalComunicacaoId: '1',
    descricao: '',
  });

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

  const criarAtendimento = async () => {
    setErro('');
    setFeedback('');
    if (!novoAtendimento.beneficiarioId || !novoAtendimento.descricao) {
      setErro('Preencha o beneficiário e a descrição.');
      return;
    }
    
    try {
      setSubmitting(true);
      await atendimentoService.solicitar({
        beneficiarioId: Number(novoAtendimento.beneficiarioId),
        prioridade: Number(novoAtendimento.prioridade),
        canalComunicacaoId: Number(novoAtendimento.canalComunicacaoId),
        descricao: novoAtendimento.descricao
      });
      setFeedback('Atendimento criado com sucesso.');
      setNovoAtendimento({ beneficiarioId: '', prioridade: '2', canalComunicacaoId: '1', descricao: '' });
      await carregarDados();
      setAba('atendimentos');
    } catch {
      setErro('Não foi possível criar o atendimento.');
    } finally {
      setSubmitting(false);
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
    ['novo', 'Novo Atendimento'],
    ['voluntarios', 'Voluntários'],
    ['beneficiarios', 'Beneficiários'],
    ['inscricoes', inscricoes.length ? `Inscrições (${inscricoes.length})` : 'Inscrições'],
  ];

  if (loading) return <div className="p-10"><LoadingState title="Carregando sistema..." /></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="border-b border-[#E2E8F0] bg-white/90 backdrop-blur-xl">
        <Container className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mt-2 text-3xl font-black text-[#0F172A]">Painel do Administrador</h1>
            <p className="text-sm text-[#475569]">Logado como {user?.nome}</p>
          </div>
          <Button variant="secondary" onClick={() => { logout(); navigate('/login'); }}>
            Sair
          </Button>
        </Container>
      </header>

      <Container className="py-8">
        <div className="mb-6 flex flex-wrap gap-2">
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
                          <Badge tone={item.status === 'ENCERRADO' ? 'success' : item.status === 'ABERTO' ? 'info' : 'warning'}>{item.status}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">Canal: {item.canal || 'Padrão'} | Criado em {new Date(item.dataCriacao || '').toLocaleDateString()}</p>
                        <p className="mt-1 text-sm text-slate-600">Responsável: {item.nomeVoluntario || 'Não atribuído'}</p>
                      </div>
                      <Select value={item.status || 'ABERTO'} onChange={(e) => mudarStatusAtendimento(item.id, e.target.value)} className="md:w-48">
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

        {aba === 'novo' && (
          <Card className="max-w-2xl p-6">
            <SectionTitle title="Novo atendimento (Via API)" description="Abre protocolo direto pela API conectando ao beneficiário." />
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Selecione o Beneficiário">
                <Select value={novoAtendimento.beneficiarioId} onChange={(e) => setNovoAtendimento({ ...novoAtendimento, beneficiarioId: e.target.value })}>
                  <option value="">Selecione...</option>
                  {beneficiarios.map((b) => <option key={b.id} value={b.id}>{b.nome}</option>)}
                </Select>
              </Field>
              <Field label="Prioridade">
                <Select value={novoAtendimento.prioridade} onChange={(e) => setNovoAtendimento({ ...novoAtendimento, prioridade: e.target.value })}>
                  <option value="1">Baixa</option>
                  <option value="2">Média</option>
                  <option value="3">Alta</option>
                </Select>
              </Field>
              <Field label="Canal de Comunicação (ID)">
                <Input type="number" value={novoAtendimento.canalComunicacaoId} onChange={(e) => setNovoAtendimento({ ...novoAtendimento, canalComunicacaoId: e.target.value })} />
              </Field>
              <div className="md:col-span-2">
                <Field label="Descrição">
                  <Textarea value={novoAtendimento.descricao} onChange={(e) => setNovoAtendimento({ ...novoAtendimento, descricao: e.target.value })} rows={3} />
                </Field>
              </div>
            </div>
            <Button className="mt-5" onClick={criarAtendimento} disabled={submitting}>Abrir atendimento</Button>
          </Card>
        )}

        {aba === 'voluntarios' && (
          <div className="space-y-4">
            <SectionTitle title="Voluntários Aprovados" description="Equipe cadastrada no sistema." />
            {voluntarios.length === 0 ? <EmptyState /> : (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-3 text-left">Nome</th>
                        <th className="px-4 py-3 text-left">Usuário</th>
                        <th className="px-4 py-3 text-left">Especialidade</th>
                        <th className="px-4 py-3 text-left">Disponível</th>
                      </tr>
                    </thead>
                    <tbody>
                      {voluntarios.map((vol) => (
                        <tr key={vol.id} className="border-t border-slate-100">
                          <td className="px-4 py-3 font-semibold text-slate-800">{vol.nome}</td>
                          <td className="px-4 py-3 text-slate-500">{vol.usuario || 'N/A'}</td>
                          <td className="px-4 py-3"><Badge>{vol.especialidade?.nome || 'N/A'}</Badge></td>
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

        {aba === 'beneficiarios' && (
          <div className="space-y-4">
            <SectionTitle title="Beneficiários Cadastrados" description="Pessoas assistidas que criaram conta na plataforma." />
            {beneficiarios.length === 0 ? <EmptyState /> : (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-3 text-left">ID</th>
                        <th className="px-4 py-3 text-left">Nome</th>
                        <th className="px-4 py-3 text-left">E-mail</th>
                        <th className="px-4 py-3 text-left">Data de Criação</th>
                        <th className="px-4 py-3 text-left">Status Conta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {beneficiarios.map((ben) => (
                        <tr key={ben.id} className="border-t border-slate-100">
                          <td className="px-4 py-3 font-semibold text-slate-800">#{ben.id}</td>
                          <td className="px-4 py-3 text-slate-800">{ben.nome}</td>
                          <td className="px-4 py-3 text-slate-500">{ben.email}</td>
                          <td className="px-4 py-3 text-slate-500">{new Date(ben.dataCriacao || '').toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            <Badge tone={ben.ativo ? 'success' : 'danger'}>{ben.ativo ? 'Ativo' : 'Inativo'}</Badge>
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
                    <p className="mt-1 text-sm text-slate-500">{item.usuario || 'Sem email'} | {item.especialidade?.nome || 'Sem especialidade'}</p>
                    {item.motivoVoluntariado && (
                      <p className="mt-3 text-sm text-slate-600 italic">"{item.motivoVoluntariado}"</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => aprovarInscricao(item.id)}>Aprovar</Button>
                    <Button size="sm" variant="danger" onClick={() => rejeitarInscricao(item.id)}>Rejeitar</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

      </Container>
    </div>
  );
}
