export type TipoUsuario = "VOLUNTARIO" | "BENEFICIARIO" | "ADMIN";
export type TipoPessoaAtendida = "CRIANCA_ADOLESCENTE" | "MULHER_APOLONIA";

export interface RegisterPayload {
  nome: string;
  email: string;
  senha: string;
  tipoUsuario: TipoUsuario;
  usuario?: string;
  modoIdentificacao?: 'NOME' | 'CODINOME' | 'GERADO';
  telefone?: string;
  idade?: number;
  nomeResponsavel?: string;
  escola?: string;
  gravidadeBucal?: number;
  codinome?: string;
  nivelRisco?: number;
  temBoletimOcorrencia?: boolean;
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
  telefone?: string | null;
  idade?: number | null;
  nomeResponsavel?: string | null;
  escola?: string | null;
  codinome?: string | null;
  tipoUsuario: TipoUsuario;
  ativo: boolean;
  dataCriacao?: string;

  voluntarioId?: number;
  beneficiarioId?: number;
  pessoaAtendidaId?: number;
  statusCro?: string;
}
