import { apiClient } from './apiClient';

export interface AgendaConsulta {
  id?: number;
  voluntarioId: number;
  atendimentoId?: number | null;
  paciente: string;
  tipo: string;
  dataConsulta: string; // YYYY-MM-DD
  horario: string;
  status: string;
  tipoPessoa: string;
}

export const agendaService = {
  buscarPorVoluntario: async (voluntarioId: number): Promise<AgendaConsulta[]> => {
    const response = await apiClient.get<AgendaConsulta[]>(`/agendas/voluntario/${voluntarioId}`);
    return response;
  },

  buscarPorAtendimento: async (atendimentoId: number): Promise<AgendaConsulta[]> => {
    const response = await apiClient.get<AgendaConsulta[]>(`/agendas/atendimento/${atendimentoId}`);
    return response;
  },

  buscarPorId: async (id: number): Promise<AgendaConsulta> => {
    const response = await apiClient.get<AgendaConsulta>(`/agendas/${id}`);
    return response;
  },

  criar: async (agenda: AgendaConsulta): Promise<AgendaConsulta> => {
    const response = await apiClient.post<AgendaConsulta>('/agendas', agenda);
    return response;
  },

  atualizar: async (id: number, agenda: AgendaConsulta): Promise<AgendaConsulta> => {
    const response = await apiClient.put<AgendaConsulta>(`/agendas/${id}`, agenda);
    return response;
  },

  excluir: async (id: number): Promise<void> => {
    await apiClient.delete(`/agendas/${id}`);
  }
};

