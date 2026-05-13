export type TipoUsuario = 'voluntario' | 'beneficiario';

export interface Usuario {
  id: number;
  nome: string;
  tipo: TipoUsuario;
  acessoSigilo?: boolean;
  especialidade?: string;
}

