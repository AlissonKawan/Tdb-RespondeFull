import { useDeferredValue, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/useAuth';
import { useConfirm } from '../hooks/useConfirm';
import { voluntariosService, type Voluntario } from '../services/voluntariosService';
import { atendimentoService } from '../services/atendimentoService';
import { usuarioService } from '../services/usuarioService';
import { formatStatusLabel, formatDate } from '../utils/formatters';
import type { VoluntarioApi, VoluntarioRequestApi } from '../types/api';
import type { AtendimentoApi, AtendimentoStatus } from '../types/AtendimentoApi';
import type { AuthUser } from '../types/auth';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { Dialog } from '../components/ui/ConfirmDialog';
import Container from '../components/ui/Container';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/FeedbackState';
import { Field, Input, Select } from '../components/ui/Input';
import PageHeader from '../components/ui/PageHeader';
import SectionTitle from '../components/ui/SectionTitle';
import StatCard from '../components/ui/StatCard';

type Aba = 'dashboard' | 'atendimentos' | 'voluntarios' | 'beneficiarios' | 'inscricoes';
type Feedback = { message: string; tone: 'success' | 'danger' };

const normalizeSearch = (value: string | null | undefined) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export default function DashboardAdmin() {
  const { user } = useAuth();
  const { confirm, confirmDialog } = useConfirm();

  const [aba, setAba] = useState<Aba>('dashboard');
  
  // States para APIs
  const [atendimentos, setAtendimentos] = useState<AtendimentoApi[]>([]);
  const [voluntarios, setVoluntarios] = useState<VoluntarioApi[]>([]);
  const [beneficiarios, setBeneficiarios] = useState<AuthUser[]>([]);
  const [inscricoes, setInscricoes] = useState<Voluntario[]>([]);

  // States de UI
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [buscaVoluntarios, setBuscaVoluntarios] = useState('');
  const [buscaBeneficiarios, setBuscaBeneficiarios] = useState('');
  
  // States de Edicao Admin
  const [editingVoluntario, setEditingVoluntario] = useState<VoluntarioApi | null>(null);
  const [editingBeneficiario, setEditingBeneficiario] = useState<AuthUser | null>(null);
  const primeiroInputVoluntarioRef = useRef<HTMLInputElement>(null);
  const primeiroInputBeneficiarioRef = useRef<HTMLInputElement>(null);

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
    } catch {
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

  const buscaVoluntariosDiferida = useDeferredValue(buscaVoluntarios);
  const buscaBeneficiariosDiferida = useDeferredValue(buscaBeneficiarios);
  const termoVoluntarios = normalizeSearch(buscaVoluntariosDiferida);
  const termoBeneficiarios = normalizeSearch(buscaBeneficiariosDiferida);
  const voluntariosFiltrados = voluntarios.filter((voluntario) =>
    normalizeSearch(`${voluntario.nome} ${voluntario.cro || ''}`).includes(termoVoluntarios),
  );
  const beneficiariosFiltrados = beneficiarios.filter((beneficiario) =>
    normalizeSearch(`${beneficiario.nome} ${beneficiario.email || ''}`).includes(termoBeneficiarios),
  );

  const mudarStatusAtendimento = async (id: number, novoStatus: AtendimentoStatus) => {
    try {
      await atendimentoService.atualizarStatusPrioridade(id, { status: novoStatus });
      setAtendimentos(atendimentos.map(a => a.id === id ? { ...a, status: novoStatus } : a));
    } catch {
      setFeedback({ message: 'Não foi possível atualizar o status.', tone: 'danger' });
    }
  };

  const handleSaveVoluntario = async () => {
    if(!editingVoluntario) return;
    try {
      const atualizacao = {
        nome: editingVoluntario.nome,
        especialidadeId: editingVoluntario.especialidade?.id,
        cro: editingVoluntario.cro,
        ufCro: editingVoluntario.ufCro,
        disponivel: editingVoluntario.disponivel
      };
      await voluntariosService.atualizar(
        editingVoluntario.id,
        atualizacao as unknown as VoluntarioRequestApi,
      );
      setFeedback({ message: 'Voluntário atualizado com sucesso!', tone: 'success' });
      setEditingVoluntario(null);
      await carregarDados();
    } catch {
      setFeedback({ message: 'Erro ao atualizar voluntário. Tente novamente.', tone: 'danger' });
    }
  };

  const handleSaveBeneficiario = async () => {
    if(!editingBeneficiario) return;
    try {
      await usuarioService.atualizar(editingBeneficiario.id, {
        nome: editingBeneficiario.nome,
        email: editingBeneficiario.email,
        ativo: editingBeneficiario.ativo,
        tipoUsuario: editingBeneficiario.tipoUsuario
      });
      setFeedback({ message: 'Beneficiário atualizado com sucesso!', tone: 'success' });
      setEditingBeneficiario(null);
      await carregarDados();
    } catch {
      setFeedback({ message: 'Erro ao atualizar beneficiário. Tente novamente.', tone: 'danger' });
    }
  };

  const aprovarInscricao = async (id: number) => {
    setFeedback(null);
    try {
      if (!user) return;
      await voluntariosService.aprovar(id, { aprovadorId: user.id });
      setFeedback({ message: 'Voluntário aprovado com sucesso.', tone: 'success' });
      await carregarDados();
    } catch {
      setFeedback({ message: 'Erro ao aprovar. Tente novamente.', tone: 'danger' });
    }
  };

  const rejeitarInscricao = async (id: number) => {
    setFeedback(null);
    try {
      await voluntariosService.excluir(id);
      setFeedback({ message: 'Inscrição rejeitada (excluída).', tone: 'success' });
      await carregarDados();
    } catch {
      setFeedback({ message: 'Erro ao rejeitar. Tente novamente.', tone: 'danger' });
    }
  };

  const abas: [Aba, string][] = [
    ['dashboard', 'Dashboard'],
    ['atendimentos', 'Atendimentos'],
    ['voluntarios', 'Voluntários'],
    ['beneficiarios', 'Beneficiários'],
    ['inscricoes', inscricoes.length ? `Inscrições (${inscricoes.length})` : 'Inscrições'],
  ];

  if (loading) return <div className="p-6 md:p-10"><LoadingState title="Carregando sistema..." count={4} className="md:grid-cols-2 xl:grid-cols-4" /></div>;

  return (
    <div className="min-h-full bg-muted/50">
      <PageHeader
        variant="compact"
        eyebrow="Administração"
        title="Painel do Administrador"
        description={`Visão geral e gestão da operação${user?.nome ? ` para ${user.nome}` : ''}.`}
      />

      <Container className="py-6 md:py-8">
        <div className="mb-6 flex flex-wrap gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {abas.map(([id, label]) => (
            <Button key={id} variant={aba === id ? 'primary' : 'secondary'} size="sm" onClick={() => setAba(id)}>
              {label}
            </Button>
          ))}
        </div>

        {feedback ? (
          <div
            role={feedback.tone === 'danger' ? 'alert' : 'status'}
            aria-live="polite"
            className={`mb-4 rounded-ui border px-4 py-3 text-sm font-medium ${
              feedback.tone === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {feedback.message}
          </div>
        ) : null}
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
                        const novoStatus = e.target.value as AtendimentoStatus;
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
            <Field label="Buscar voluntário">
              <Input
                type="search"
                value={buscaVoluntarios}
                onChange={(event) => setBuscaVoluntarios(event.target.value)}
                placeholder="Digite o nome ou CRO"
                autoComplete="off"
              />
            </Field>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {voluntariosFiltrados.length} {voluntariosFiltrados.length === 1 ? 'voluntário encontrado' : 'voluntários encontrados'}
            </p>
            {voluntariosFiltrados.length === 0 ? (
              <EmptyState
                title={voluntarios.length === 0 ? 'Nenhum voluntário cadastrado' : 'Nenhum voluntário encontrado'}
                description={voluntarios.length === 0 ? undefined : 'Tente buscar por outro nome ou CRO.'}
              />
            ) : (
              <Card className="overflow-hidden border-0 shadow-sm md:border md:shadow-none">
                <div className="overflow-x-auto w-full -mx-4 md:mx-0 px-4 md:px-0">
                  <table className="w-full text-sm min-w-[600px]">
                    <thead className="bg-muted/70 text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 text-left">Nome</th>
                        <th className="px-4 py-3 text-left">Usuário</th>
                        <th className="px-4 py-3 text-left">Especialidade</th>
                        <th className="px-4 py-3 text-left">CRO</th>
                        <th className="px-4 py-3 text-left">Disponível</th>
                        <th className="px-4 py-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {voluntariosFiltrados.map((vol) => (
                        <tr key={vol.id} className="border-t border-border transition-colors duration-fast hover:bg-muted/40">
                          <td className="px-4 py-3 font-semibold text-slate-800">{vol.nome}</td>
                          <td className="px-4 py-3 text-slate-500">{vol.usuario || 'N/A'}</td>
                          <td className="px-4 py-3"><Badge>{vol.especialidade?.nome || 'N/A'}</Badge></td>
                          <td className="px-4 py-3 text-slate-500">{vol.cro ? `${vol.cro} (${vol.ufCro || 'N/A'})` : 'N/A'}</td>
                          <td className="px-4 py-3">
                            <Badge tone={vol.disponivel ? 'success' : 'danger'}>{vol.disponivel ? 'Sim' : 'Não'}</Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button size="sm" variant="secondary" onClick={() => setEditingVoluntario(vol)}>Editar</Button>
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
            <Field label="Buscar beneficiário">
              <Input
                type="search"
                value={buscaBeneficiarios}
                onChange={(event) => setBuscaBeneficiarios(event.target.value)}
                placeholder="Digite o nome ou e-mail"
                autoComplete="off"
              />
            </Field>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {beneficiariosFiltrados.length} {beneficiariosFiltrados.length === 1 ? 'beneficiário encontrado' : 'beneficiários encontrados'}
            </p>
            {beneficiariosFiltrados.length === 0 ? (
              <EmptyState
                title={beneficiarios.length === 0 ? 'Nenhum beneficiário cadastrado' : 'Nenhum beneficiário encontrado'}
                description={beneficiarios.length === 0 ? undefined : 'Tente buscar por outro nome ou e-mail.'}
              />
            ) : (
              <Card className="overflow-hidden border-0 shadow-sm md:border md:shadow-none">
                <div className="overflow-x-auto w-full -mx-4 md:mx-0 px-4 md:px-0">
                  <table className="w-full text-sm min-w-[600px]">
                    <thead className="bg-muted/70 text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 text-left">ID</th>
                        <th className="px-4 py-3 text-left">Nome</th>
                        <th className="px-4 py-3 text-left">E-mail</th>
                        <th className="px-4 py-3 text-left">Data de Criação</th>
                        <th className="px-4 py-3 text-left">Status Conta</th>
                        <th className="px-4 py-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {beneficiariosFiltrados.map((ben) => (
                        <tr key={ben.id} className="border-t border-border transition-colors duration-fast hover:bg-muted/40">
                          <td className="px-4 py-3 font-semibold text-slate-800">#{ben.id}</td>
                          <td className="px-4 py-3 text-slate-800">{ben.nome}</td>
                          <td className="px-4 py-3 text-slate-500">{ben.email}</td>
                          <td className="px-4 py-3 text-slate-500">{formatDate(ben.dataCriacao)}</td>
                          <td className="px-4 py-3">
                            <Badge tone={ben.ativo ? 'success' : 'danger'}>{ben.ativo ? 'Ativo' : 'Inativo'}</Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button size="sm" variant="secondary" onClick={() => setEditingBeneficiario(ben)}>Editar</Button>
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

      {/* Modais de Edicao */}
      {editingVoluntario && (
        <Dialog
          title="Editar Voluntário"
          description="Atualize os dados profissionais e a disponibilidade."
          onClose={() => setEditingVoluntario(null)}
          initialFocusRef={primeiroInputVoluntarioRef}
          footer={(
            <>
              <Button variant="secondary" onClick={() => setEditingVoluntario(null)}>Cancelar</Button>
              <Button onClick={() => confirm({
                title: 'Confirmar Alterações',
                message: 'Você tem certeza de que deseja forçar estas alterações neste voluntário?',
                onConfirm: handleSaveVoluntario,
                confirmText: 'Salvar'
              })}>Salvar Alterações</Button>
            </>
          )}
        >
          <div className="grid gap-4">
            <Field label="Nome">
              <Input ref={primeiroInputVoluntarioRef} value={editingVoluntario.nome} onChange={e => setEditingVoluntario({...editingVoluntario, nome: e.target.value})} />
            </Field>
            <Field label="CRO">
              <Input value={editingVoluntario.cro || ''} onChange={e => setEditingVoluntario({...editingVoluntario, cro: e.target.value})} />
            </Field>
            <Field label="UF CRO">
              <Input value={editingVoluntario.ufCro || ''} onChange={e => setEditingVoluntario({...editingVoluntario, ufCro: e.target.value})} />
            </Field>
            <Field label="Disponível">
              <Select value={editingVoluntario.disponivel ? 'true' : 'false'} onChange={e => setEditingVoluntario({...editingVoluntario, disponivel: e.target.value === 'true'})}>
                <option value="true">Sim</option>
                <option value="false">Não</option>
              </Select>
            </Field>
          </div>
        </Dialog>
      )}

      {editingBeneficiario && (
        <Dialog
          title="Editar Beneficiário"
          description="Atualize os dados da conta e o status de acesso."
          onClose={() => setEditingBeneficiario(null)}
          initialFocusRef={primeiroInputBeneficiarioRef}
          footer={(
            <>
              <Button variant="secondary" onClick={() => setEditingBeneficiario(null)}>Cancelar</Button>
              <Button onClick={() => confirm({
                title: 'Confirmar Alterações',
                message: 'Você tem certeza de que deseja forçar estas alterações neste beneficiário?',
                onConfirm: handleSaveBeneficiario,
                confirmText: 'Salvar'
              })}>Salvar Alterações</Button>
            </>
          )}
        >
          <div className="grid gap-4">
            <Field label="Nome">
              <Input ref={primeiroInputBeneficiarioRef} value={editingBeneficiario.nome} onChange={e => setEditingBeneficiario({...editingBeneficiario, nome: e.target.value})} />
            </Field>
            <Field label="E-mail">
              <Input type="email" value={editingBeneficiario.email} onChange={e => setEditingBeneficiario({...editingBeneficiario, email: e.target.value})} />
            </Field>
            <Field label="Status (Ativo)">
              <Select value={editingBeneficiario.ativo ? 'true' : 'false'} onChange={e => setEditingBeneficiario({...editingBeneficiario, ativo: e.target.value === 'true'})}>
                <option value="true">Sim (Ativo)</option>
                <option value="false">Não (Inativo)</option>
              </Select>
            </Field>
          </div>
        </Dialog>
      )}

      {confirmDialog}
    </div>
  );
}
