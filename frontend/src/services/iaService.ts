import { IA_API_URL } from '../config/api';

export type CategoriaIA = 'elogio' | 'informativo' | 'reclamacao' | 'sugestao' | 'urgencia' | string;
export type EnviadoPorIA = 'BENEFICIARIO' | 'VOLUNTARIO' | 'PESSOA_ATENDIDA';
export type CanalIA = 'email' | 'whatsapp' | 'telefone' | 'presencial';
export type StatusAtendimentoIA = 'ABERTO' | 'EM_ATENDIMENTO' | 'ENCERRADO' | 'SOLICITADO';
export type TipoPessoaIA = 'CRIANCA_ADOLESCENTE' | 'MULHER_APOLONIA' | 'OUTRO';

export interface ClassificarMensagemIARequest {
  conteudo: string;
  enviado_por: EnviadoPorIA;
  canal: CanalIA;
  prioridade_atendimento: number;
  status_atendimento: StatusAtendimentoIA;
  tipo_pessoa: TipoPessoaIA;
  gravidade: number;
}

export interface ClassificarMensagemIAResponse {
  categoria_prevista: CategoriaIA;
  probabilidades: Record<string, number>;
  confianca: number;
}

export async function classificarMensagemIA(
  payload: ClassificarMensagemIARequest,
  signal?: AbortSignal,
): Promise<ClassificarMensagemIAResponse | null> {
  try {
    const response = await fetch(`${IA_API_URL}/predict`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok) {
      const corpo = await response.text();
      console.error('Erro ao classificar mensagem com IA', {
        status: response.status,
        corpo,
        payload,
      });
      return null;
    }

    return (await response.json()) as ClassificarMensagemIAResponse;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return null;
    console.error('Erro ao classificar mensagem com IA', {
      status: 'network_error',
      corpo: error,
      payload,
    });
    return null;
  }
}
