import { apiClient } from './apiClient';

export interface Prontuario {
  id?: number;
  voluntarioId: number;
  agendaId?: number | null;
  atendimentoId?: number | null;
  paciente: string;
  historicoMedico: string;
  tratamentoAtual: string;
  dataRegistro?: string; // retornado pelo banco
}

export const prontuarioService = {
  buscarPorAgenda: async (agendaId: number): Promise<Prontuario[]> => {
    const response = await apiClient.get<Prontuario[]>(`/prontuarios/agenda/${agendaId}`);
    return response;
  },

  buscarPorAtendimento: async (atendimentoId: number): Promise<Prontuario[]> => {
    const response = await apiClient.get<Prontuario[]>(`/prontuarios/atendimento/${atendimentoId}`);
    return response;
  },

  registrarEvolucao: async (prontuario: Prontuario): Promise<Prontuario> => {
    const response = await apiClient.post<Prontuario>('/prontuarios', prontuario);
    return response;
  }
};

