export type TipoUsuario = "VOLUNTARIO" | "BENEFICIARIO" | "ADMIN";
export type TipoPessoaAtendida = "CRIANCA_ADOLESCENTE" | "MULHER_APOLONIA";

export interface RegisterPayload {
  nome: string;
  email: string;
  senha: string;
  tipoUsuario: TipoUsuario;
  usuario?: string;
  modoIdentificacao?: 'NOME' | 'CODINOME' | 'GERADO';
  especialidadeId?: number;
  motivoVoluntariado?: string;
  tipoPessoaAtendida?: TipoPessoaAtendida;
  tipoBeneficiario?: TipoPessoaAtendida;
  codigoIndicacao?: string;
  cro?: string;
  ufCro?: string;
}

export type RegisterRequest = RegisterPayload;

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface AuthUser {
  id: number;
  nome: string;
  email: string | null;
  usuario?: string;
  tipoBeneficiario?: TipoPessoaAtendida;
  modoIdentificacao?: 'NOME' | 'CODINOME' | 'GERADO';
  tipoUsuario: TipoUsuario;
  ativo: boolean;
  dataCriacao?: string;

  voluntarioId?: number;
  beneficiarioId?: number;
  pessoaAtendidaId?: number;
  statusCro?: string;
}
