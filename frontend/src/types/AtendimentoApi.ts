export type AtendimentoStatus =
  | 'SOLICITADO'
  | 'EM_ANDAMENTO'
  | 'FINALIZADO'
  | 'CANCELADO'
  | 'Aberto'
  | 'Em andamento'
  | 'Aguardando'
  | 'Encerrado';

export type AtendimentoPrioridade = 'BAIXA' | 'MEDIA' | 'ALTA' | 1 | 2 | 3 | 4;

export interface AtendimentoUsuarioResumo {
  id?: number;
  nome?: string;
  email?: string;
}

export interface AtendimentoApi {
  id: number;
  titulo?: string;
  descricao?: string;
  observacao?: string;
  status?: AtendimentoStatus;
  prioridade?: AtendimentoPrioridade;
  canal?: string;
  canalOrigem?: {
    id: number;
    nome: string;
  };
  dataCriacao?: string;
  dataAbertura?: string;
  dataAtualizacao?: string;
  dataEncerramento?: string | null;
  solicitanteNome?: string;
  beneficiarioNome?: string;
  pacienteNome?: string;
  nomeVoluntario?: string;
  pessoaAtendidaId?: number;
  pacienteId?: number;
  beneficiarioId?: number;
  voluntarioId?: number | null;
  voluntario?: AtendimentoUsuarioResumo | null;
  beneficiario?: AtendimentoUsuarioResumo | null;
  usuario?: AtendimentoUsuarioResumo | null;
}

export interface SolicitarAtendimentoRequest {
  beneficiarioId: number;
  prioridade: number;
  canalComunicacaoId: number;
  descricao: string;
}

export interface Mensagem {
  id: number;
  atendimentoId: number;
  conteudo: string;
  dataHora: string;
  enviadoPor: 'BENEFICIARIO' | 'VOLUNTARIO' | 'ADMIN' | string;
}

export interface MensagemRequest {
  conteudo: string;
  enviadoPor: 'BENEFICIARIO' | 'VOLUNTARIO';
}
