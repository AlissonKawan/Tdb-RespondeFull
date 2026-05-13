export interface EspecialidadeApi {
  id: number;
  nome: string;
  descricao?: string;
}

export interface VoluntarioApi {
  id: number;
  nome: string;
  usuario: string;
  senha?: string;
  especialidade?: EspecialidadeApi | null;
  disponivel: boolean;
  acessoSigilo: boolean;
}

export interface VoluntarioRequestApi {
  nome: string;
  usuario: string;
  senha: string;
  acessoSigilo: boolean;
  disponivel: boolean;
  especialidadeId?: number;
}

export type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};
