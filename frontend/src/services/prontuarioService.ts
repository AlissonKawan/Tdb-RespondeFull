import { apiClient } from './apiClient';

export interface Prontuario {
  id?: number;
  voluntarioId: number;
  agendaId: number;
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

  registrarEvolucao: async (prontuario: Prontuario): Promise<Prontuario> => {
    const response = await apiClient.post<Prontuario>('/prontuarios', prontuario);
    return response;
  }
};
