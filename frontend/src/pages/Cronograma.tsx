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
import { useAuth } from '../context/useAuth';
import { cronogramaService } from '../services/cronogramaService';
import type { TarefaCronograma } from '../services/cronogramaService';

const DIAS_SEMANA = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

function statusTone(status?: string) {
  if (!status) return 'neutral';
  if (['Concluído', 'Finalizado'].includes(status)) return 'success';
  if (['Pendente', 'Em andamento'].includes(status)) return 'warning';
  return 'neutral';
}

function prioridadeTone(prioridade?: string) {
  if (prioridade === 'Alta' || prioridade === 'Urgente') return 'danger';
  if (prioridade === 'Média' || prioridade === 'Media') return 'warning';
  return 'info';
}

function normalizeParaBackend(str: string) {
  if (str === 'Média') return 'Media';
  if (str === 'Terça-feira') return 'Terca-feira';
  if (str === 'Sábado') return 'Sabado';
  return str;
}

function normalizeParaFrontend(str: string) {
  if (str === 'Media') return 'Média';
  if (str === 'Terca-feira') return 'Terça-feira';
  if (str === 'Sabado') return 'Sábado';
  return str;
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
  const [tarefas, setTarefas] = useState<TarefaCronograma[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [tarefaEmEdicao, setTarefaEmEdicao] = useState<TarefaCronograma | null>(null);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<TarefaCronograma>();

  const carregarTarefas = async () => {
    if (!user?.voluntarioId) {
      setLoading(false);
      setError('Sua conta não está vinculada a um voluntário.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await cronogramaService.listarTarefas(user.voluntarioId);
      const tarefasNormalizadas = (response.tarefas || []).map(t => ({
        ...t,
        dia_semana: normalizeParaFrontend(t.dia_semana),
        prioridade: normalizeParaFrontend(t.prioridade)
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
    if (!user?.voluntarioId) return;

    const acao = tarefaEmEdicao ? 'editar' : 'criar';
    if (!confirm(`Deseja realmente ${acao} esta tarefa no seu cronograma?`)) {
      return;
    }

    try {
      const payload = { 
        ...data, 
        id_voluntario: user.voluntarioId,
        dia_semana: normalizeParaBackend(data.dia_semana),
        prioridade: normalizeParaBackend(data.prioridade)
      };
      if (tarefaEmEdicao?.id_tarefa) {
        await cronogramaService.atualizarTarefa(tarefaEmEdicao.id_tarefa, payload);
      } else {
        await cronogramaService.criarTarefa(payload);
      }
      setModalOpen(false);
      reset();
      setTarefaEmEdicao(null);
      await carregarTarefas();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao salvar tarefa');
    }
  };

  const excluirTarefa = async (id: number) => {
    if (!confirm('Deseja realmente excluir esta tarefa?')) return;
    try {
      await cronogramaService.excluirTarefa(id);
      await carregarTarefas();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir');
    }
  };

  const abrirModalNova = () => {
    setTarefaEmEdicao(null);
    reset({ tipo: 'Atividade Social', dia_semana: 'Segunda-feira', status: 'Pendente', prioridade: 'Média', data_atividade: '' });
    setModalOpen(true);
  };

  const abrirModalEdicao = (t: TarefaCronograma) => {
    setTarefaEmEdicao(t);
    // Garantir que o form mostre os valores com acento
    reset({
      ...t,
      dia_semana: normalizeParaFrontend(t.dia_semana),
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

          {loading && <LoadingState title="Carregando seu cronograma..." />}
          {error && <ErrorState title="Oops!" description={error} />}
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
                            <div className="flex gap-1">
                              <button onClick={() => abrirModalEdicao(tarefa)} className="text-blue-500 hover:text-blue-700">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                              </button>
                              <button onClick={() => excluirTarefa(tarefa.id_tarefa!)} className="text-red-500 hover:text-red-700">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                              </button>
                            </div>
                          </div>
                           {tarefa.descricao && <p className="text-sm text-slate-500 mb-2">{tarefa.descricao}</p>}
                           
                           {tarefa.data_atividade && (
                             <div className="mt-1 mb-2.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-100 rounded-md py-1 px-2.5 w-fit">
                               <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                               <span>Previsão: {formatarData(tarefa.data_atividade)}</span>
                             </div>
                           )}

                           <div className="mt-2 flex flex-wrap gap-2 text-xs">
                             <Badge tone={statusTone(tarefa.status) as any}>{tarefa.status}</Badge>
                             <Badge tone={prioridadeTone(tarefa.prioridade) as any}>{tarefa.prioridade}</Badge>
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
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Título da Tarefa</label>
                <input 
                  {...register('titulo', { required: true })} 
                  className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                  placeholder="Ex: Reunião com equipe"
                />
              </div>

               <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Descrição</label>
                <textarea 
                  {...register('descricao')} 
                  className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                  rows={3}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Data Prevista</label>
                <input 
                  type="date"
                  {...register('data_atividade')} 
                  className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Dia da Semana</label>
                  <select {...register('dia_semana')} className="w-full rounded-lg border border-slate-300 p-2 text-sm">
                    {DIAS_SEMANA.map(dia => <option key={dia} value={dia}>{dia}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Prioridade</label>
                  <select {...register('prioridade')} className="w-full rounded-lg border border-slate-300 p-2 text-sm">
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                  </select>
                </div>
              </div>

              <div className={tarefaEmEdicao ? "grid grid-cols-2 gap-4" : ""}>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Tipo</label>
                  <select {...register('tipo')} className="w-full rounded-lg border border-slate-300 p-2 text-sm">
                    <option value="Atividade Social">Atividade Social</option>
                    <option value="Treinamento">Treinamento</option>
                    <option value="Reunião">Reunião</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                {tarefaEmEdicao && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
                    <select {...register('status')} className="w-full rounded-lg border border-slate-300 p-2 text-sm">
                      <option value="Pendente">Pendente</option>
                      <option value="Concluído">Concluído</option>
                    </select>
                  </div>
                )}
              </div>

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
    </PageShell>
  );
}
