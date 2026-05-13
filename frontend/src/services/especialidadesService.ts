import { apiClient } from './apiClient';
import type { EspecialidadeApi } from '../types/api';

export const especialidadesService = {
  listar: () => apiClient.get<EspecialidadeApi[]>('/especialidades'),
  buscarPorId: (id: number) => apiClient.get<EspecialidadeApi>(`/especialidades/${id}`),
};

export const getEspecialidades = especialidadesService.listar;
