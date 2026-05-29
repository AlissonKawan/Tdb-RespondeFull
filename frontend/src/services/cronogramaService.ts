import { apiClient } from './apiClient';

export interface TarefaCronograma {
  id_tarefa?: number;
  id_voluntario?: number;
  tipo: string;
  dia_semana: string;
  titulo: string;
  descricao?: string;
  status: string;
  prioridade: string;
  data_atividade?: string;
  hora_inicio?: string;
  hora_fim?: string;
}

export interface TarefasResponse {
  voluntario_id: number;
  total: number;
  tarefas: TarefaCronograma[];
}

export interface ResumoResponse {
  voluntario_id: number;
  resumo: Record<string, Record<string, number>>;
}

export const cronogramaService = {
  listarTarefas: (voluntarioId: number, params?: { dia_semana?: string; status?: string; prioridade?: string }) => {
    let query = '';
    if (params) {
      const q = new URLSearchParams();
      if (params.dia_semana) q.append('dia_semana', params.dia_semana);
      if (params.status) q.append('status', params.status);
      if (params.prioridade) q.append('prioridade', params.prioridade);
      query = q.toString() ? `?${q.toString()}` : '';
    }
    return apiClient.get<TarefasResponse>(`/api/cronograma/tarefas/voluntario/${voluntarioId}${query}`);
  },

  buscarTarefa: (idTarefa: number) => 
    apiClient.get<TarefaCronograma>(`/api/cronograma/tarefas/${idTarefa}`),

  criarTarefa: (data: TarefaCronograma) => 
    apiClient.post<{ mensagem: string; id_tarefa: number }>('/api/cronograma/tarefas', data),

  atualizarTarefa: (idTarefa: number, data: TarefaCronograma) => 
    apiClient.put<{ mensagem: string; id_tarefa: number }>(`/api/cronograma/tarefas/${idTarefa}`, data),

  excluirTarefa: (idTarefa: number) => 
    apiClient.delete<{ mensagem: string; id_tarefa: number }>(`/api/cronograma/tarefas/${idTarefa}`),

  resumoSemanal: (voluntarioId: number) => 
    apiClient.get<ResumoResponse>(`/api/cronograma/tarefas/voluntario/${voluntarioId}/resumo`),
};
