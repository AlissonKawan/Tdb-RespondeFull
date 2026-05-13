import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { loadTDBState, saveTDBState } from '../context/tdbStorage';
import { getEspecialidades } from '../services/especialidadesService';
import { voluntariosService } from '../services/voluntariosService';
import type { EspecialidadeApi, VoluntarioApi } from '../types/api';
import type { Atendimento, CriancaAdolescente, MulherApolonia, SolicitacaoVoluntario, TDBState, TipoPessoa, Voluntario } from '../types';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Container from '../components/ui/Container';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/FeedbackState';
import { Field, Input, Select, Textarea } from '../components/ui/Input';
import SectionTitle from '../components/ui/SectionTitle';
import StatCard from '../components/ui/StatCard';

type Aba = 'dashboard' | 'atendimentos' | 'novo' | 'voluntarios' | 'inscricoes';

const especialidadesFallback: EspecialidadeApi[] = [
  { id: -1, nome: 'Odontologia' },
  { id: -2, nome: 'Assistencia Social' },
  { id: -3, nome: 'Psicologia' },
  { id: -4, nome: 'Direito' },
  { id: -5, nome: 'Geral' },
];

function nomePessoa(atendimento: Atendimento) {
  return atendimento.tipo === 'crianca'
    ? (atendimento.pessoa as CriancaAdolescente).nomeCodificado
    : (atendimento.pessoa as MulherApolonia).codinome;
}

function nomeEspecialidade(valor?: string | null) {
  return valor?.replace(/\s+\d+$/, '').trim() || 'Sem especialidade';
}

function mapVoluntarioApi(v: VoluntarioApi): Voluntario {
  return {
    id: v.id,
    nome: v.nome,
    usuario: v.usuario,
    senha: v.senha ?? '',
    especialidade: nomeEspecialidade(v.especialidade?.nome),
    disponivel: v.disponivel,
    acessoSigilo: v.acessoSigilo,
  };
}

function DashboardAdmin() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<TDBState>(() => loadTDBState());
  const [aba, setAba] = useState<Aba>('dashboard');
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [especialidades, setEspecialidades] = useState<EspecialidadeApi[]>(especialidadesFallback);
  const [volLoading, setVolLoading] = useState(true);
  const [volErroApi, setVolErroApi] = useState('');
  const [feedback, setFeedback] = useState('');
  const [erro, setErro] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [volForm, setVolForm] = useState({
    nome: '',
    usuario: '',
    senha: '',
    especialidadeId: String(especialidadesFallback[0].id),
    especialidade: especialidadesFallback[0].nome,
    disponivel: 'true',
    acessoSigilo: 'false',
  });
  const [novoAtendimento, setNovoAtendimento] = useState({
    tipo: 'crianca' as TipoPessoa,
    codigo: '',
    canal: 'WhatsApp',
    prioridade: '2',
    voluntarioId: '',
    mensagem: '',
  });

  const saveState = (next: TDBState) => {
    setState(next);
    saveTDBState(next);
  };

  useEffect(() => {
    let ativo = true;

    getEspecialidades()
      .then((items) => {
        if (!ativo || items.length === 0) return;
        setEspecialidades(items);
        setVolForm((prev) => ({
          ...prev,
          especialidadeId: String(items[0].id),
          especialidade: items[0].nome,
        }));
      })
      .catch(() => setEspecialidades(especialidadesFallback));

    voluntariosService
      .listar()
      .then((items) => {
        if (!ativo) return;
        const voluntarios = items.map(mapVoluntarioApi);
        saveState({ ...loadTDBState(), voluntarios });
        setVolErroApi('');
      })
      .catch((error) => {
        if (!ativo) return;
        setVolErroApi(error instanceof Error ? error.message : 'Erro ao carregar dados');
      })
      .finally(() => {
        if (ativo) setVolLoading(false);
      });

    return () => {
      ativo = false;
    };
  }, []);

  const atendimentosFiltrados = useMemo(() => {
    return state.atendimentos.filter((atendimento) => {
      const passaStatus = filtroStatus === 'todos' || atendimento.status === filtroStatus;
      const texto = `${nomePessoa(atendimento)} ${atendimento.canal}`.toLowerCase();
      return passaStatus && texto.includes(busca.toLowerCase());
    });
  }, [busca, filtroStatus, state.atendimentos]);

  const solicitacoes: SolicitacaoVoluntario[] = state.solicitacoesVoluntario ?? [];
  const pendentes = solicitacoes.filter((item) => item.status === 'pendente');

  const limparVolForm = () => {
    const primeira = especialidades[0] ?? especialidadesFallback[0];
    setEditandoId(null);
    setVolForm({
      nome: '',
      usuario: '',
      senha: '',
      especialidadeId: String(primeira.id),
      especialidade: primeira.nome,
      disponivel: 'true',
      acessoSigilo: 'false',
    });
  };

  const submitVoluntario = async () => {
    setErro('');
    setFeedback('');

    if (!volForm.nome.trim() || !volForm.usuario.trim() || volForm.senha.length < 6) {
      setErro('Preencha nome, usuario e senha com no minimo 6 caracteres.');
      return;
    }

    if (state.voluntarios.some((v) => v.usuario === volForm.usuario.trim() && v.id !== editandoId)) {
      setErro('Usuario ja cadastrado.');
      return;
    }

    const especialidadeId = Number(volForm.especialidadeId);
    const payload = {
      nome: volForm.nome.trim(),
      usuario: volForm.usuario.trim(),
      senha: volForm.senha,
      disponivel: volForm.disponivel === 'true',
      acessoSigilo: volForm.acessoSigilo === 'true',
      ...(especialidadeId > 0 ? { especialidadeId } : {}),
    };

    try {
      setSubmitting(true);
      const salvo = editandoId
        ? await voluntariosService.atualizar(editandoId, payload)
        : await voluntariosService.criar(payload);
      const voluntario = mapVoluntarioApi(salvo);
      const voluntarios = editandoId
        ? state.voluntarios.map((item) => (item.id === editandoId ? voluntario : item))
        : [...state.voluntarios, voluntario];
      saveState({ ...state, voluntarios });
      setFeedback(editandoId ? 'Registro atualizado com sucesso.' : 'Registro criado com sucesso.');
      limparVolForm();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Nao foi possivel salvar o registro.');
    } finally {
      setSubmitting(false);
    }
  };

  const editarVoluntario = (voluntario: Voluntario) => {
    const especialidade = especialidades.find((item) => item.nome === nomeEspecialidade(voluntario.especialidade));
    setEditandoId(voluntario.id);
    setErro('');
    setFeedback('');
    setVolForm({
      nome: voluntario.nome,
      usuario: voluntario.usuario,
      senha: voluntario.senha || '123456',
      especialidadeId: String(especialidade?.id ?? -1),
      especialidade: nomeEspecialidade(voluntario.especialidade),
      disponivel: String(voluntario.disponivel),
      acessoSigilo: String(voluntario.acessoSigilo),
    });
  };

  const excluirVoluntario = async (id: number) => {
    setErro('');
    setFeedback('');
    try {
      setSubmitting(true);
      await voluntariosService.excluir(id);
      saveState({
        ...state,
        voluntarios: state.voluntarios.filter((item) => item.id !== id),
        atendimentos: state.atendimentos.map((item) =>
          item.voluntarioId === id ? { ...item, voluntarioId: null } : item,
        ),
      });
      setFeedback('Registro excluido com sucesso.');
      if (editandoId === id) limparVolForm();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Nao foi possivel excluir o registro.');
    } finally {
      setSubmitting(false);
    }
  };

  const criarAtendimento = () => {
    setErro('');
    setFeedback('');
    if (!novoAtendimento.codigo.trim()) {
      setErro('Informe o codigo ou codinome do atendimento.');
      return;
    }

    const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const pessoa =
      novoAtendimento.tipo === 'crianca'
        ? { nomeCodificado: novoAtendimento.codigo.trim(), idade: 0, responsavel: '', escola: '', telefone: '', email: '', gravidadeBucal: 1 }
        : { codinome: novoAtendimento.codigo.trim(), nivelRisco: 1, telefone: '', email: '', temBoletim: false, sigiloAbsoluto: false };
    const atendimento: Atendimento = {
      id: state.nextId,
      tipo: novoAtendimento.tipo,
      pessoa,
      canal: novoAtendimento.canal,
      prioridade: Number(novoAtendimento.prioridade) as 1 | 2 | 3,
      status: 'Aberto',
      voluntarioId: novoAtendimento.voluntarioId ? Number(novoAtendimento.voluntarioId) : null,
      dataAbertura: new Date().toISOString().slice(0, 10),
      mensagens: novoAtendimento.mensagem ? [{ de: 'pessoa', texto: novoAtendimento.mensagem, hora }] : [],
      historico: [],
    };

    saveState({ ...state, nextId: state.nextId + 1, atendimentos: [atendimento, ...state.atendimentos] });
    setFeedback('Atendimento criado com sucesso.');
    setNovoAtendimento({ tipo: 'crianca', codigo: '', canal: 'WhatsApp', prioridade: '2', voluntarioId: '', mensagem: '' });
    setAba('atendimentos');
  };

  const mudarStatus = (id: number, status: Atendimento['status']) => {
    saveState({
      ...state,
      atendimentos: state.atendimentos.map((item) =>
        item.id === id ? { ...item, status } : item,
      ),
    });
  };

  const aprovar = (id: number) => {
    const solicitacao = solicitacoes.find((item) => item.id === id);
    if (!solicitacao) return;
    const novoId = Math.max(...state.voluntarios.map((v) => v.id), 0) + 1;
    const usuario = solicitacao.nome.toLowerCase().replace(/\s+/g, '.').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const voluntario: Voluntario = {
      id: novoId,
      nome: solicitacao.nome,
      usuario,
      senha: '123456',
      especialidade: solicitacao.especialidade,
      disponivel: true,
      acessoSigilo: false,
    };
    saveState({
      ...state,
      voluntarios: [...state.voluntarios, voluntario],
      solicitacoesVoluntario: solicitacoes.map((item) => item.id === id ? { ...item, status: 'aprovado' } : item),
    });
  };

  const rejeitar = (id: number) => {
    saveState({
      ...state,
      solicitacoesVoluntario: solicitacoes.map((item) => item.id === id ? { ...item, status: 'rejeitado' } : item),
    });
  };

  const abas: [Aba, string][] = [
    ['dashboard', 'Dashboard'],
    ['atendimentos', 'Atendimentos'],
    ['novo', 'Novo'],
    ['voluntarios', 'Voluntarios'],
    ['inscricoes', pendentes.length ? `Inscricoes (${pendentes.length})` : 'Inscricoes'],
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="border-b border-[#E2E8F0] bg-white/90 backdrop-blur-xl">
        <Container className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button onClick={() => navigate('/')} className="text-sm font-semibold text-[#2563EB] hover:text-[#1E3A8A]">
              Voltar para o site
            </button>
            <h1 className="mt-2 text-3xl font-black text-[#0F172A]">Painel do Voluntario</h1>
            <p className="text-sm text-[#475569]">{user?.nome}</p>
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
            {[
              ['Total', state.atendimentos.length, 'Protocolos registrados', 'blue'],
              ['Abertos', state.atendimentos.filter((a) => a.status === 'Aberto').length, 'Aguardando resposta', 'orange'],
              ['Em andamento', state.atendimentos.filter((a) => a.status === 'Em andamento').length, 'Em acompanhamento', 'blue'],
              ['Voluntarios', state.voluntarios.length, 'Equipe cadastrada', 'slate'],
            ].map(([label, value, description, tone]) => (
              <StatCard key={label} label={String(label)} value={String(value)} description={String(description)} tone={tone as 'blue' | 'green' | 'orange' | 'slate'} />
            ))}
          </div>
        )}

        {aba === 'atendimentos' && (
          <div className="space-y-5">
            <SectionTitle title="Atendimentos" description="Lista local de protocolos usados no painel e portal do beneficiario." />
            <Card className="grid gap-3 p-4 md:grid-cols-2">
              <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por codigo ou canal" />
              <Select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
                <option value="todos">Todos os status</option>
                <option value="Aberto">Aberto</option>
                <option value="Em andamento">Em andamento</option>
                <option value="Aguardando">Aguardando</option>
                <option value="Encerrado">Encerrado</option>
              </Select>
            </Card>
            {atendimentosFiltrados.length === 0 ? <EmptyState /> : (
              <div className="grid gap-4">
                {atendimentosFiltrados.map((item) => (
                  <Card key={item.id} className="p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-slate-900">#{item.id} {nomePessoa(item)}</h3>
                          <Badge tone={item.status === 'Encerrado' ? 'success' : item.status === 'Aberto' ? 'info' : 'warning'}>{item.status}</Badge>
                          {item.prioridade === 3 && <Badge tone="danger">Urgente</Badge>}
                        </div>
                        <p className="mt-1 text-sm text-slate-500">Canal {item.canal} | Aberto em {item.dataAbertura}</p>
                      </div>
                      <Select value={item.status} onChange={(e) => mudarStatus(item.id, e.target.value as Atendimento['status'])} className="md:w-48">
                        <option value="Aberto">Aberto</option>
                        <option value="Em andamento">Em andamento</option>
                        <option value="Aguardando">Aguardando</option>
                        <option value="Encerrado">Encerrado</option>
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
            <SectionTitle title="Novo atendimento" description="Cadastro local para manter compatibilidade com o portal da Sprint 4." />
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Tipo">
                <Select value={novoAtendimento.tipo} onChange={(e) => setNovoAtendimento({ ...novoAtendimento, tipo: e.target.value as TipoPessoa })}>
                  <option value="crianca">Crianca / Adolescente</option>
                  <option value="mulher">Mulher Apolonia</option>
                </Select>
              </Field>
              <Field label="Codigo ou codinome">
                <Input value={novoAtendimento.codigo} onChange={(e) => setNovoAtendimento({ ...novoAtendimento, codigo: e.target.value })} />
              </Field>
              <Field label="Canal">
                <Select value={novoAtendimento.canal} onChange={(e) => setNovoAtendimento({ ...novoAtendimento, canal: e.target.value })}>
                  {['WhatsApp', 'E-mail', 'Instagram', 'Telefone', 'Presencial'].map((canal) => <option key={canal}>{canal}</option>)}
                </Select>
              </Field>
              <Field label="Prioridade">
                <Select value={novoAtendimento.prioridade} onChange={(e) => setNovoAtendimento({ ...novoAtendimento, prioridade: e.target.value })}>
                  <option value="1">Baixa</option>
                  <option value="2">Media</option>
                  <option value="3">Alta</option>
                </Select>
              </Field>
              <Field label="Voluntario responsavel">
                <Select value={novoAtendimento.voluntarioId} onChange={(e) => setNovoAtendimento({ ...novoAtendimento, voluntarioId: e.target.value })}>
                  <option value="">Nao atribuido</option>
                  {state.voluntarios.filter((v) => v.disponivel).map((v) => <option key={v.id} value={v.id}>{v.nome}</option>)}
                </Select>
              </Field>
              <Field label="Mensagem inicial">
                <Textarea value={novoAtendimento.mensagem} onChange={(e) => setNovoAtendimento({ ...novoAtendimento, mensagem: e.target.value })} rows={3} />
              </Field>
            </div>
            <Button className="mt-5" onClick={criarAtendimento}>Abrir atendimento</Button>
          </Card>
        )}

        {aba === 'voluntarios' && (
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <div className="space-y-4">
              <SectionTitle title="Voluntarios" description="Gerencie a equipe cadastrada, suas especialidades e disponibilidade." />
              {volLoading && <LoadingState title="Carregando voluntarios..." />}
              {volErroApi && <ErrorState title="Erro ao carregar dados" description={`${volErroApi} Exibindo dados locais quando existirem.`} />}
              {state.voluntarios.length === 0 ? <EmptyState /> : (
                <Card className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                        <tr>
                          <th className="px-4 py-3 text-left">Nome</th>
                          <th className="px-4 py-3 text-left">Usuario</th>
                          <th className="px-4 py-3 text-left">Especialidade</th>
                          <th className="px-4 py-3 text-left">Status</th>
                          <th className="px-4 py-3 text-right">Acoes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {state.voluntarios.map((voluntario) => (
                          <tr key={voluntario.id} className="border-t border-slate-100">
                            <td className="px-4 py-3 font-semibold text-slate-800">{voluntario.nome}</td>
                            <td className="px-4 py-3 text-slate-500">{voluntario.usuario}</td>
                            <td className="px-4 py-3"><Badge>{nomeEspecialidade(voluntario.especialidade)}</Badge></td>
                            <td className="px-4 py-3">
                              <Badge tone={voluntario.disponivel ? 'success' : 'danger'}>{voluntario.disponivel ? 'Disponivel' : 'Indisponivel'}</Badge>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="secondary" onClick={() => editarVoluntario(voluntario)}>Editar</Button>
                                <Button size="sm" variant="danger" disabled={submitting} onClick={() => excluirVoluntario(voluntario.id)}>Excluir</Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </div>

            <Card className="p-5">
              <SectionTitle title={editandoId ? 'Editar voluntario' : 'Cadastrar voluntario'} />
              <div className="space-y-3">
                <Field label="Nome completo"><Input value={volForm.nome} onChange={(e) => setVolForm({ ...volForm, nome: e.target.value })} /></Field>
                <Field label="Usuario"><Input value={volForm.usuario} onChange={(e) => setVolForm({ ...volForm, usuario: e.target.value })} /></Field>
                <Field label="Senha"><Input type="password" value={volForm.senha} onChange={(e) => setVolForm({ ...volForm, senha: e.target.value })} /></Field>
                <Field label="Especialidade">
                  <Select value={volForm.especialidadeId} onChange={(e) => {
                    const especialidade = especialidades.find((item) => String(item.id) === e.target.value);
                    setVolForm({ ...volForm, especialidadeId: e.target.value, especialidade: especialidade?.nome ?? '' });
                  }}>
                    {especialidades.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
                  </Select>
                </Field>
                <Field label="Disponivel">
                  <Select value={volForm.disponivel} onChange={(e) => setVolForm({ ...volForm, disponivel: e.target.value })}>
                    <option value="true">Sim</option>
                    <option value="false">Nao</option>
                  </Select>
                </Field>
                <Field label="Acesso a sigilo">
                  <Select value={volForm.acessoSigilo} onChange={(e) => setVolForm({ ...volForm, acessoSigilo: e.target.value })}>
                    <option value="false">Nao</option>
                    <option value="true">Sim</option>
                  </Select>
                </Field>
                <div className="flex gap-2 pt-2">
                  <Button onClick={submitVoluntario} disabled={submitting}>{submitting ? 'Salvando...' : 'Salvar'}</Button>
                  {editandoId && <Button variant="secondary" onClick={limparVolForm}>Cancelar</Button>}
                </div>
              </div>
            </Card>
          </div>
        )}

        {aba === 'inscricoes' && (
          <div className="space-y-4">
            <SectionTitle title="Inscricoes de voluntarios" description="Solicitacoes preenchidas no formulario publico." />
            {solicitacoes.length === 0 ? <EmptyState title="Nenhuma inscricao recebida ainda" /> : solicitacoes.map((item) => (
              <Card key={item.id} className="p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-900">{item.nome}</h3>
                      <Badge tone={item.status === 'pendente' ? 'warning' : item.status === 'aprovado' ? 'success' : 'neutral'}>{item.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{item.email} | {item.telefone} | {item.especialidade}</p>
                    <p className="mt-3 text-sm text-slate-600">{item.motivacao}</p>
                  </div>
                  {item.status === 'pendente' && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => aprovar(item.id)}>Aprovar</Button>
                      <Button size="sm" variant="danger" onClick={() => rejeitar(item.id)}>Rejeitar</Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}

export default DashboardAdmin;
