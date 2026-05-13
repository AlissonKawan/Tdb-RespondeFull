export type TipoPaciente = 'crianca' | 'mulher';

export interface CriancaAdolescentePaciente {
  nomeCodificado: string;
  idade: number;
  responsavel: string;
  escola: string;
  telefone: string;
  email: string;
  gravidadeBucal: number;
}

export interface MulherApoloniaPaciente {
  codinome: string;
  nivelRisco: number;
  telefone: string;
  email: string;
  temBoletim: boolean;
  sigiloAbsoluto: boolean;
}

export type Paciente = CriancaAdolescentePaciente | MulherApoloniaPaciente;

