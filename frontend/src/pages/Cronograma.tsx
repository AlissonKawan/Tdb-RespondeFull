import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import PageShell from '../components/layout/PageShell';
import Section from '../components/layout/Section';
import Container from '../components/ui/Container';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import PageHeader from '../components/ui/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/FeedbackState';
import { Field, Input, Select, Textarea } from '../components/ui/Input';
import { useAuth } from '../context/useAuth';
import { useConfirm } from '../hooks/useConfirm';
import { cronogramaService } from '../services/cronogramaService';
import type { TarefaCronograma } from '../services/cronogramaService';

const DIAS_SEMANA = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

function statusTone(status?: string): BadgeTone {
  if (!status) return 'neutral';
  if (['Concluído', 'Finalizado'].includes(status)) return 'success';
  if (['Pendente', 'Em andamento'].includes(status)) return 'warning';
  return 'neutral';
}

function prioridadeTone(prioridade?: string): BadgeTone {
  if (prioridade === 'Alta' || prioridade === 'Urgente') return 'danger';
  if (prioridade === 'Média' || prioridade === 'Media') return 'warning';
  return 'info';
}

function getErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) return fallback;
  const details = 'details' in error ? (error as Error & { details?: unknown }).details : undefined;
  return details ? `${error.message} Detalhes: ${JSON.stringify(details)}` : error.message;
}

function normalizeParaBackend(str: string) {
  if (!str) return str;
  if (str === 'Média') return 'Media';
  if (str === 'Terça-feira') return 'Terca-feira';
  if (str === 'Sábado') return 'Sabado';
  if (str === 'Concluído') return 'Concluido';
  return str;
}

function normalizeParaFrontend(str: string) {
  if (!str) return str;
  if (str === 'Media') return 'Média';
  if (str === 'Terca-feira') return 'Terça-feira';
  if (str === 'Sabado') return 'Sábado';
  if (str === 'Concluido') return 'Concluído';
  return str;
}

function getStatusVencimento(dataAtividade?: string, status?: string) {
  if (!dataAtividade) return null;
  if (status === 'Concluído' || status === 'Finalizado') return null;

  const [ano, mes, dia] = dataAtividade.split('-');
  if (!ano || !mes || !dia) return null;

  const dataTarefa = new Date(Number(ano), Number(mes) - 1, Number(dia));
  dataTarefa.setHours(0, 0, 0, 0);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const diffTime = dataTarefa.getTime() - hoje.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // usa Math.ceil para arredondar pra cima se houver fração, mas zeramos as horas

  if (diffDays < 0) return 'Vencido';
  if (diffDays <= 2) return 'Próximo';
  return null;
}

function formatarData(dataStr?: string) {
  if (!dataStr) return '';
  if (dataStr.includes('-')) {
    const parts = dataStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }
  return dataStr;
}

export default function Cronograma() {
  const { user } = useAuth();
  const { confirm, confirmDialog } = useConfirm();
  const [tarefas, setTarefas] = useState<TarefaCronograma[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionFeedback, setActionFeedback] = useState<{ tone: 'success' | 'danger'; message: string } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [tarefaEmEdicao, setTarefaEmEdicao] = useState<TarefaCronograma | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<TarefaCronograma>({ mode: 'onBlur' });

  const carregarTarefas = async () => {
    const targetId = user?.voluntarioId ?? (user?.tipoUsuario === 'ADMIN' ? user?.id : undefined);

    if (!targetId) {
      setLoading(false);
      setError(user?.tipoUsuario === 'ADMIN' ? 'Não foi possível carregar cronograma do admin.' : 'Sua conta não está vinculada a um voluntário.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await cronogramaService.listarTarefas(targetId);
      const tarefasNormalizadas = (response.tarefas || []).map(t => ({
        ...t,
        dia_semana: normalizeParaFrontend(t.dia_semana),
        prioridade: normalizeParaFrontend(t.prioridade),
        status: normalizeParaFrontend(t.status || '')
      }));
      setTarefas(tarefasNormalizadas);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar cronograma.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void carregarTarefas();
  }, [user]);

  const onSubmit = async (data: TarefaCronograma) => {
    const targetId = user?.voluntarioId ?? (user?.tipoUsuario === 'ADMIN' ? user?.id : undefined);
    if (!targetId) return;

    const acao = tarefaEmEdicao ? 'editar' : 'criar';
    confirm({
      title: tarefaEmEdicao ? 'Editar Tarefa' : 'Criar Tarefa',
      message: `Deseja realmente ${acao} esta tarefa no seu cronograma?`,
      confirmText: tarefaEmEdicao ? 'Editar' : 'Criar',
      tone: 'primary',
      onConfirm: async () => {
        try {
          let diaCalculado = 'Segunda-feira'; // Fallback
          if (data.data_atividade) {
            const [ano, mes, dia] = data.data_atividade.split('-');
            if (ano && mes && dia) {
              const date = new Date(Number(ano), Number(mes) - 1, Number(dia), 12, 0, 0);
              const diasSemanaMap = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
              diaCalculado = diasSemanaMap[date.getDay()];
            }
          }

          const payload = { 
            id_tarefa: tarefaEmEdicao?.id_tarefa,
            id_voluntario: targetId,
            tipo: data.tipo,
            titulo: data.titulo,
            descricao: data.descricao,
            data_atividade: data.data_atividade,
            dia_semana: normalizeParaBackend(diaCalculado),
            prioridade: normalizeParaBackend(data.prioridade),
            status: data.status ? normalizeParaBackend(data.status) : 'Pendente'
          };
          if (tarefaEmEdicao?.id_tarefa) {
            await cronogramaService.atualizarTarefa(tarefaEmEdicao.id_tarefa, payload);
          } else {
            await cronogramaService.criarTarefa(payload);
          }
          setModalOpen(false);
          reset();
          setTarefaEmEdicao(null);
          setActionFeedback({ tone: 'success', message: tarefaEmEdicao ? 'Tarefa atualizada com sucesso.' : 'Tarefa criada com sucesso.' });
          await carregarTarefas();
        } catch (err) {
          console.error('Erro na API:', err);
          setActionFeedback({ tone: 'danger', message: getErrorMessage(err, 'Erro ao salvar tarefa.') });
        }
      }
    });
  };

  const excluirTarefa = async (id: number) => {
    confirm({
      title: 'Excluir Tarefa',
      message: 'Deseja realmente excluir esta tarefa?',
      confirmText: 'Excluir',
      tone: 'danger',
      onConfirm: async () => {
        try {
          await cronogramaService.excluirTarefa(id);
          setActionFeedback({ tone: 'success', message: 'Tarefa excluída com sucesso.' });
          await carregarTarefas();
        } catch (err) {
          setActionFeedback({ tone: 'danger', message: getErrorMessage(err, 'Erro ao excluir tarefa.') });
        }
      }
    });
  };

  const confirmarTarefa = async (tarefa: TarefaCronograma) => {
    confirm({
      title: 'Confirmar Tarefa',
      message: 'Deseja confirmar que esta tarefa foi realizada?',
      confirmText: 'Confirmar',
      tone: 'success',
      onConfirm: async () => {
        try {
          const payload = {
            id_tarefa: tarefa.id_tarefa,
            id_voluntario: user?.voluntarioId || tarefa.id_voluntario,
            tipo: tarefa.tipo,
            titulo: tarefa.titulo,
            descricao: tarefa.descricao,
            data_atividade: tarefa.data_atividade,
            status: 'Concluido',
            dia_semana: normalizeParaBackend(tarefa.dia_semana),
            prioridade: normalizeParaBackend(tarefa.prioridade || 'Média')
          };
          if (tarefa.id_tarefa) {
            await cronogramaService.atualizarTarefa(tarefa.id_tarefa, payload);
            setActionFeedback({ tone: 'success', message: 'Tarefa marcada como concluída.' });
            await carregarTarefas();
          }
        } catch (err) {
          console.error(err);
          setActionFeedback({ tone: 'danger', message: getErrorMessage(err, 'Erro ao confirmar tarefa.') });
        }
      }
    });
  };

  const abrirModalNova = () => {
    setActionFeedback(null);
    setTarefaEmEdicao(null);
    reset({ tipo: 'Atividade Social', dia_semana: 'Segunda-feira', status: 'Pendente', prioridade: 'Média', data_atividade: '' });
    setModalOpen(true);
  };

  const abrirModalEdicao = (t: TarefaCronograma) => {
    setActionFeedback(null);
    setTarefaEmEdicao(t);
    // Garantir que o form mostre os valores com acento
    reset({
      ...t,
      prioridade: normalizeParaFrontend(t.prioridade)
    });
    setModalOpen(true);
  };

  const tarefasPorDia = DIAS_SEMANA.map(dia => ({
    dia,
    itens: tarefas.filter(t => t.dia_semana === dia)
  }));

  return (
    <PageShell>
      <PageHeader
        eyebrow="Planejamento"
        title="Meu Cronograma"
        description="Organize suas tarefas semanais de voluntariado e atividades."
      />

      <Section tone="white">
        <Container>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Tarefas da Semana</h2>
            <Button onClick={abrirModalNova} variant="primary">
              + Nova Tarefa
            </Button>
          </div>

          {loading && <LoadingState title="Carregando seu cronograma..." count={3} />}
          {error && <ErrorState title="Oops!" description={error} />}
          {actionFeedback && (
            <div
              role={actionFeedback.tone === 'danger' ? 'alert' : 'status'}
              className={`mb-5 rounded-xl border px-4 py-3 text-sm font-semibold ${actionFeedback.tone === 'danger' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}
            >
              {actionFeedback.message}
            </div>
          )}
          {!loading && !error && tarefas.length === 0 && (
            <EmptyState title="Seu cronograma está vazio." description="Clique no botão acima para adicionar tarefas à sua semana." />
          )}

          {!loading && !error && tarefas.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {tarefasPorDia.map(({ dia, itens }) => {
                if (itens.length === 0) return null;
                return (
                  <Card key={dia} className="p-4 bg-slate-50 border border-slate-200">
                    <h3 className="mb-3 flex items-center justify-between font-bold text-slate-700">
                      {dia}
                      <Badge tone="neutral">{itens.length}</Badge>
                    </h3>
                    <div className="flex flex-col gap-3">
                      {itens.map(tarefa => (
                        <div key={tarefa.id_tarefa} className="rounded-lg bg-white p-3 shadow-sm border border-slate-100 hover:shadow-md transition">
                          <div className="mb-1 flex items-start justify-between">
                            <h4 className="font-bold text-slate-900">{tarefa.titulo}</h4>
                            <div className="flex gap-2">
                              {tarefa.status !== 'Concluído' && tarefa.status !== 'Finalizado' && (
                                <button title="Marcar como concluída" onClick={() => confirmarTarefa(tarefa)} className="text-green-500 hover:text-green-700 bg-green-50 hover:bg-green-100 p-1 rounded transition">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                </button>
                              )}
                              <button title="Editar tarefa" onClick={() => abrirModalEdicao(tarefa)} className="text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 p-1 rounded transition">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                              </button>
                              <button title="Excluir tarefa" onClick={() => excluirTarefa(tarefa.id_tarefa!)} className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1 rounded transition">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                              </button>
                            </div>
                          </div>
                           {tarefa.descricao && <p className="text-sm text-slate-500 mb-2">{tarefa.descricao}</p>}
                           
                           {tarefa.data_atividade && (() => {
                             const aviso = getStatusVencimento(tarefa.data_atividade, tarefa.status);
                             let corBg = 'bg-slate-50 border-slate-100 text-slate-500';
                             let corIcone = 'text-slate-400';
                             let labelSecundario = '';
                             
                             if (aviso === 'Vencido') {
                               corBg = 'bg-red-50 border-red-100 text-red-600';
                               corIcone = 'text-red-500';
                               labelSecundario = ' (Vencida)';
                             } else if (aviso === 'Próximo') {
                               corBg = 'bg-amber-50 border-amber-200 text-amber-700';
                               corIcone = 'text-amber-500';
                               labelSecundario = ' (Vence em breve)';
                             }

                             return (
                               <div className={`mt-1 mb-2.5 flex items-center gap-1.5 text-[11px] font-medium border rounded-md py-1 px-2.5 w-fit ${corBg}`}>
                                 <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={corIcone}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                                 <span>Previsão: {formatarData(tarefa.data_atividade)}{labelSecundario}</span>
                               </div>
                             );
                           })()}

                           <div className="mt-2 flex flex-wrap gap-2 text-xs">
                             <Badge tone={statusTone(tarefa.status)}>{tarefa.status}</Badge>
                             <Badge tone={prioridadeTone(tarefa.prioridade)}>{tarefa.prioridade}</Badge>
                             <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-800">
                               {tarefa.tipo}
                             </span>
                           </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </Container>
      </Section>

      {/* Modal Nova/Editar Tarefa */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-xl font-bold text-slate-900">
              {tarefaEmEdicao ? 'Editar Tarefa' : 'Nova Tarefa'}
            </h3>
            
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <Field label="Título da Tarefa" error={errors.titulo?.message}>
                <Input
                  autoFocus
                  {...register('titulo', { required: 'Informe o título da tarefa.' })}
                  placeholder="Ex: Reunião com equipe"
                />
              </Field>

              <Field label="Descrição">
                <Textarea {...register('descricao')} rows={3} />
              </Field>

              <Field label="Data Prevista" error={errors.data_atividade?.message}>
                <Input
                  type="date"
                  {...register('data_atividade', { required: 'Informe a data prevista.' })}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Prioridade">
                  <Select {...register('prioridade')}>
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                  </Select>
                </Field>
                <Field label="Tipo">
                  <Select {...register('tipo')}>
                    <option value="Atividade Social">Atividade Social</option>
                    <option value="Treinamento">Treinamento</option>
                    <option value="Reunião">Reunião</option>
                    <option value="Outros">Outros</option>
                  </Select>
                </Field>
              </div>

              {tarefaEmEdicao && (
                <Field label="Status">
                  <Select {...register('status')}>
                    <option value="Pendente">Pendente</option>
                    <option value="Concluído">Concluído</option>
                  </Select>
                </Field>
              )}

              <div className="mt-4 flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setModalOpen(false)} type="button">
                  Cancelar
                </Button>
                <Button variant="primary" disabled={isSubmitting} type="submit">
                  {isSubmitting ? 'Salvando...' : 'Salvar Tarefa'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {confirmDialog}
    </PageShell>
  );
}
