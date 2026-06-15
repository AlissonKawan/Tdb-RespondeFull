import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import PageHeader from '../components/ui/PageHeader';
import Container from '../components/ui/Container';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { Field, Input, Select } from '../components/ui/Input';
import { useAuth } from '../context/useAuth';
import { useConfirm } from '../hooks/useConfirm';
import { agendaService } from '../services/agendaService';
import type { AgendaConsulta } from '../services/agendaService';
import { prontuarioService } from '../services/prontuarioService';
import type { Prontuario } from '../services/prontuarioService';

// Utils para Datas
const getTodayStr = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

const getTomorrowStr = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

const formatDateLabel = (dateStr: string) => {
  if (dateStr === getTodayStr()) return 'Hoje';
  if (dateStr === getTomorrowStr()) return 'Amanhã';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  }
  return dateStr;
};

export default function AgendaConsultas() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { confirm, ConfirmModal } = useConfirm();
  
  const [filtro, setFiltro] = useState<'Todos' | 'Hoje' | 'Amanhã'>('Todos');
  const [consultas, setConsultas] = useState<AgendaConsulta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  // Modal Prontuario State
  const [selectedProntuarioAgenda, setSelectedProntuarioAgenda] = useState<AgendaConsulta | null>(null);
  const [prontuariosList, setProntuariosList] = useState<Prontuario[]>([]);
  const [isProntuarioLoading, setIsProntuarioLoading] = useState(false);
  
  const [prontuarioForm, setProntuarioForm] = useState({
    historicoMedico: '',
    tratamentoAtual: ''
  });

  const [formData, setFormData] = useState<Omit<AgendaConsulta, 'id' | 'voluntarioId'>>({
    paciente: '',
    tipo: 'Avaliação Inicial',
    dataConsulta: getTodayStr(),
    horario: '08:00',
    status: 'AGUARDANDO',
    tipoPessoa: 'OUTRO'
  });

  const carregarAgendas = async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      const data = await agendaService.buscarPorVoluntario(user.id);
      setConsultas(data);
    } catch (error) {
      console.error("Erro ao carregar agenda", error);
      alert("Falha ao conectar com o servidor para buscar sua agenda.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarAgendas();
  }, [user?.id]);

  const consultasFiltradas = consultas.filter(c => {
    if (filtro === 'Todos') return true;
    if (filtro === 'Hoje') return c.dataConsulta === getTodayStr();
    if (filtro === 'Amanhã') return c.dataConsulta === getTomorrowStr();
    return true;
  });

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData({ paciente: '', tipo: 'Avaliação Inicial', dataConsulta: getTodayStr(), horario: '08:00', status: 'AGUARDANDO', tipoPessoa: 'OUTRO' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: AgendaConsulta) => {
    if (!c.id) return;
    setEditingId(c.id);
    setFormData({
      paciente: c.paciente,
      tipo: c.tipo,
      dataConsulta: c.dataConsulta,
      horario: c.horario,
      status: c.status,
      tipoPessoa: c.tipoPessoa || 'OUTRO'
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    confirm({
      title: 'Excluir Agendamento',
      message: 'Você tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.',
      confirmText: 'Excluir',
      tone: 'danger',
      onConfirm: async () => {
        try {
          await agendaService.excluir(id);
          setConsultas(prev => prev.filter(c => c.id !== id));
        } catch (error) {
          console.error(error);
          alert("Erro ao excluir agendamento.");
        }
      }
    });
  };

  const handleSave = async () => {
    if (!formData.paciente.trim()) {
      alert("O nome do paciente é obrigatório!");
      return;
    }
    if (!formData.dataConsulta) {
      alert("A data é obrigatória!");
      return;
    }
    if (!user?.id) return;

    try {
      setIsSaving(true);
      const agendaPayload: AgendaConsulta = {
        ...formData,
        voluntarioId: user.id
      };

      if (editingId) {
        const atualizada = await agendaService.atualizar(editingId, agendaPayload);
        setConsultas(prev => prev.map(c => c.id === editingId ? atualizada : c));
      } else {
        const nova = await agendaService.criar(agendaPayload);
        setConsultas(prev => [...prev, nova]);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar agendamento.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- Lógica de Prontuário ---
  const handleOpenProntuario = async (agenda: AgendaConsulta) => {
    setSelectedProntuarioAgenda(agenda);
    setProntuarioForm({ historicoMedico: '', tratamentoAtual: '' });
    if (!agenda.id) return;
    try {
      setIsProntuarioLoading(true);
      const data = await prontuarioService.buscarPorAgenda(agenda.id);
      setProntuariosList(data);
    } catch (e) {
      console.error(e);
      alert("Erro ao carregar prontuário.");
    } finally {
      setIsProntuarioLoading(false);
    }
  };

  const handleSaveProntuario = async () => {
    if (!selectedProntuarioAgenda?.id || !user?.id) return;
    if (!prontuarioForm.tratamentoAtual.trim()) {
      alert("Descreva o tratamento atual para salvar no prontuário.");
      return;
    }

    try {
      setIsProntuarioLoading(true);
      const novo: Prontuario = {
        voluntarioId: user.id,
        agendaId: selectedProntuarioAgenda.id,
        paciente: selectedProntuarioAgenda.paciente,
        historicoMedico: prontuarioForm.historicoMedico,
        tratamentoAtual: prontuarioForm.tratamentoAtual
      };
      const criado = await prontuarioService.registrarEvolucao(novo);
      setProntuariosList(prev => [criado, ...prev]); // Adiciona no topo
      setProntuarioForm({ historicoMedico: '', tratamentoAtual: '' }); // limpa
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar evolução.");
    } finally {
      setIsProntuarioLoading(false);
    }
  };

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
          <Button onClick={handleOpenNew}>+ Nova Consulta</Button>
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

        {isLoading ? (
          <div className="text-center py-12 text-slate-500">Carregando sua agenda...</div>
        ) : consultasFiltradas.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200">
            <p>Nenhuma consulta encontrada para este filtro.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {consultasFiltradas.sort((a,b) => a.dataConsulta.localeCompare(b.dataConsulta) || a.horario.localeCompare(b.horario)).map((consulta) => (
              <Card key={consulta.id} className="p-6 border-l-4 border-l-[#2563EB] hover:shadow-lg transition-shadow relative group">
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenEdit(consulta)} className="p-2 text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100" title="Editar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button onClick={() => consulta.id && handleDelete(consulta.id)} className="p-2 text-red-600 bg-red-50 rounded-full hover:bg-red-100" title="Excluir">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  </button>
                </div>

                <div className="flex justify-between items-start mb-4 pr-16">
                  <Badge tone={consulta.status === 'CONCLUIDO' ? 'success' : consulta.status === 'CONFIRMADO' ? 'neutral' : consulta.status === 'AGUARDANDO' ? 'warning' : 'danger'}>
                    {consulta.status}
                  </Badge>
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                    {formatDateLabel(consulta.dataConsulta)}
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
                  <Button variant="ghost" onClick={() => handleOpenProntuario(consulta)}>
                    Ver Prontuário
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Container>

      {/* Modal de Criar/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#0F172A]">{editingId ? 'Editar Consulta' : 'Nova Consulta'}</h2>
              <button onClick={() => !isSaving && setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <Field label="Nome do Paciente">
                <Input disabled={isSaving} value={formData.paciente} onChange={e => setFormData({...formData, paciente: e.target.value})} placeholder="Ex: Maria Silva" />
              </Field>
              <Field label="Tipo de Atendimento">
                <Input disabled={isSaving} value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})} placeholder="Ex: Avaliação Inicial" />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Data">
                  <Input disabled={isSaving} type="date" min={getTodayStr()} value={formData.dataConsulta} onChange={e => setFormData({...formData, dataConsulta: e.target.value})} />
                </Field>
                <Field label="Horário">
                  <Input disabled={isSaving} type="time" value={formData.horario} onChange={e => setFormData({...formData, horario: e.target.value})} />
                </Field>
              </div>
              <Field label="Status">
                <Select disabled={isSaving} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option value="AGUARDANDO">Aguardando</option>
                  <option value="CONFIRMADO">Confirmado</option>
                  <option value="CONCLUIDO">Concluído (Atendido)</option>
                  <option value="REAGENDAR">Reagendar / Faltou</option>
                </Select>
              </Field>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <Button disabled={isSaving} variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button disabled={isSaving} onClick={handleSave}>{isSaving ? 'Salvando...' : 'Salvar'}</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal Prontuário Premium */}
      {selectedProntuarioAgenda && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Header do Prontuário */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white shrink-0">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="M9 15h6"/></svg>
                    Prontuário Clínico
                  </h2>
                  <p className="mt-1 text-slate-300">Paciente: <strong className="text-white">{selectedProntuarioAgenda.paciente}</strong></p>
                </div>
                <button onClick={() => setSelectedProntuarioAgenda(null)} className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-full transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-8 flex-1 bg-slate-50">
              
              {/* Form de Nova Evolução */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-600 p-1.5 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </span>
                  Nova Evolução ({formatDateLabel(selectedProntuarioAgenda.dataConsulta)})
                </h3>
                
                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Alertas Médicos / Anamnese (Tags separadas por vírgula)</label>
                    <Input 
                      disabled={isProntuarioLoading}
                      placeholder="Ex: Alérgico a Penicilina, Hipertenso" 
                      value={prontuarioForm.historicoMedico}
                      onChange={e => setProntuarioForm({...prontuarioForm, historicoMedico: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Procedimento Realizado Hoje <span className="text-red-500">*</span></label>
                    <textarea 
                      disabled={isProntuarioLoading}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                      placeholder="Descreva detalhadamente a evolução clínica, dentes tratados, etc..."
                      value={prontuarioForm.tratamentoAtual}
                      onChange={e => setProntuarioForm({...prontuarioForm, tratamentoAtual: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button disabled={isProntuarioLoading} onClick={handleSaveProntuario}>
                    {isProntuarioLoading ? 'Salvando...' : 'Salvar Evolução'}
                  </Button>
                </div>
              </div>

              {/* Histórico da Timeline */}
              <div>
                <h3 className="font-bold text-slate-800 mb-4 px-1">Histórico Clínico</h3>
                {isProntuarioLoading && prontuariosList.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-sm">Carregando histórico...</div>
                ) : prontuariosList.length === 0 ? (
                  <div className="text-center py-8 bg-white border border-dashed border-slate-300 rounded-xl text-slate-500">
                    Nenhuma evolução registrada para esta consulta ainda.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {prontuariosList.map((p, index) => (
                      <div key={p.id || index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-blue-500 mt-1.5 shadow-[0_0_0_4px_#eff6ff]"></div>
                          {index !== prontuariosList.length - 1 && <div className="w-0.5 h-full bg-blue-100 my-1"></div>}
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 flex-1 shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                              {p.dataRegistro ? new Date(p.dataRegistro).toLocaleString('pt-BR') : 'Agora'}
                            </span>
                          </div>
                          
                          {p.historicoMedico && (
                            <div className="mb-3 flex flex-wrap gap-1.5">
                              {p.historicoMedico.split(',').map((tag, i) => tag.trim() ? (
                                <Badge key={i} tone="danger">{tag.trim()}</Badge>
                              ) : null)}
                            </div>
                          )}
                          
                          <p className="text-slate-700 text-sm whitespace-pre-wrap">{p.tratamentoAtual}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </Card>
        </div>
      )}
      
      <ConfirmModal />
    </PageShell>
  );
}
