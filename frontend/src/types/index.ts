// src/types/index.ts
// Tipagens que espelham os models Java do backend

export type TipoPessoa = 'crianca' | 'mulher';
export type StatusAtendimento = 'Aberto' | 'Em andamento' | 'Aguardando' | 'Encerrado';
export type Prioridade = 1 | 2 | 3;
export type TipoUsuario = 'voluntario' | 'beneficiario';

export interface Voluntario {
  id: number;
  nome: string;
  usuario: string;
  senha: string;
  especialidade: string;
  disponivel: boolean;
  acessoSigilo: boolean;
}

export interface CriancaAdolescente {
  nomeCodificado: string;
  idade: number;
  responsavel: string;
  escola: string;
  telefone: string;
  email: string;
  gravidadeBucal: number; // 1-5
}

export interface MulherApolonia {
  codinome: string;
  nivelRisco: number;     // 1-5
  telefone: string;
  email: string;
  temBoletim: boolean;
  sigiloAbsoluto: boolean;
}

export interface Mensagem {
  de: 'voluntario' | 'pessoa';
  texto: string;
  hora: string;
}

export interface HistoricoStatus {
  statusAnterior: string;
  statusNovo: string;
  alteradoPor: string;
  dataHora: string;
}

export interface Atendimento {
  id: number;
  tipo: TipoPessoa;
  pessoa: CriancaAdolescente | MulherApolonia;
  canal: string;
  prioridade: Prioridade;
  status: StatusAtendimento;
  voluntarioId: number | null;
  dataAbertura: string;
  mensagens: Mensagem[];
  historico: HistoricoStatus[];
}

export interface AuthUser {
  id: number;
  nome: string;
  tipo: TipoUsuario;
  acessoSigilo?: boolean;
  especialidade?: string;
}

export interface SolicitacaoVoluntario {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  especialidade: string;
  motivacao: string;
  disponibilidade: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  dataSolicitacao: string;
}

export interface TDBState {
  nextId: number;
  voluntarios: Voluntario[];
  atendimentos: Atendimento[];
  solicitacoesVoluntario?: SolicitacaoVoluntario[];
}