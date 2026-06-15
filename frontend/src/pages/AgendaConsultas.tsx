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
                  <Badge tone={consulta.status === 'CONFIRMADO' ? 'success' : consulta.status === 'AGUARDANDO' ? 'warning' : 'danger'}>
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
                  <Button variant="ghost" onClick={() => alert('Na versão final, isso abrirá o prontuário do paciente!')}>
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
                  <option value="REAGENDAR">Reagendar</option>
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
      
      <ConfirmModal />
    </PageShell>
  );
}
