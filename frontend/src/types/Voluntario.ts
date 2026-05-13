import type { Especialidade } from './Especialidade';

export interface Voluntario {
  id: number;
  nome: string;
  usuario: string;
  senha?: string;
  especialidade?: Especialidade | null;
  disponivel: boolean;
  acessoSigilo: boolean;
}

export interface VoluntarioRequest {
  nome: string;
  usuario: string;
  senha: string;
  acessoSigilo: boolean;
  disponivel: boolean;
  especialidadeId?: number;
}

