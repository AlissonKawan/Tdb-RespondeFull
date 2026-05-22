export type AtendimentoStatus =
  | 'ABERTO'
  | 'EM_ATENDIMENTO'
  | 'ENCERRADO'
  | 'CANCELADO'
  | 'Aberto'
  | 'Em andamento'
  | 'Aguardando'
  | 'Encerrado';

export type AtendimentoPrioridade = 'BAIXA' | 'MEDIA' | 'ALTA' | 1 | 2 | 3 | 4 | 5;

export type StatusCheckin = 'NAO_ENVIADO' | 'AGUARDANDO_RESPOSTA' | 'CONFIRMADO' | 'NAO_COMPARECERA' | 'REAGENDAMENTO_SOLICITADO' | 'SEM_RESPOSTA';

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
  pessoaAtendidaNome?: string;
  pessoaAtendidaEmail?: string;
  pessoaAtendidaTelefone?: string;
  pacienteNome?: string;
  nomeVoluntario?: string;
  pessoaAtendidaId?: number;
  pacienteId?: number;
  beneficiarioId?: number;
  voluntarioId?: number | null;
  voluntario?: AtendimentoUsuarioResumo | null;
  beneficiario?: AtendimentoUsuarioResumo | null;
  usuario?: AtendimentoUsuarioResumo | null;
  statusCheckin?: StatusCheckin;
  horarioEnvioCheckin?: string;
  previsaoCheckin?: StatusCheckin | string;
  confiancaCheckin?: number;
}

export interface SolicitarAtendimentoRequest {
  beneficiarioId: number;
  prioridade: number;
  canalComunicacaoId: number;
  descricao: string;
}

export type TipoPessoaRelato = 'CRIANCA_ADOLESCENTE' | 'MULHER_APOLONIA' | 'OUTRO';

export interface CanalComunicacaoApi {
  id: number;
  nome: string;
  descricao?: string;
}

export interface RelatarCriancaAdolescentePayload {
  idade: number;
  nomeResponsavel: string;
  escola: string;
  gravidadeBucal: number;
}

export interface RelatarMulherApoloniaPayload {
  codinome: string;
  nivelRisco: number;
  temBoletimOcorrencia: boolean;
  necessitaSigiloAbsoluto: boolean;
}

export interface RelatarAtendimentoRequest {
  idContaBeneficiario?: number;
  nomeCodificado: string;
  telefone: string;
  email: string;
  tipo: TipoPessoaRelato;
  canalComunicacaoId: number;
  prioridade: number;
  descricao: string;
  idade?: number;
  nomeResponsavel?: string;
  escola?: string;
  gravidadeBucal?: number;
  codinome?: string;
  nivelRisco?: number;
  temBoletimOcorrencia?: boolean;
  necessitaSigiloAbsoluto?: boolean;
}

export interface RelatarAtendimentoResponse {
  atendimentoId: number;
  pessoaAtendidaId: number;
  status: string;
  mensagem: string;
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
  enviadoPor: 'BENEFICIARIO' | 'VOLUNTARIO' | 'ADMIN';
}
