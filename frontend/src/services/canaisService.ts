import { apiClient } from './apiClient';
import type { CanalComunicacaoApi } from '../types/AtendimentoApi';

const CANAIS_FALLBACK: CanalComunicacaoApi[] = [
  { id: 1, nome: 'WhatsApp', descricao: 'Contato rapido por mensagem.' },
  { id: 2, nome: 'Telefone', descricao: 'Ligação da equipe responsável.' },
  { id: 3, nome: 'Email', descricao: 'Comunicação por correio eletrônico.' },
];

function normalizarCanais(data: unknown): CanalComunicacaoApi[] {
  if (!Array.isArray(data)) return [];

  return data.reduce<CanalComunicacaoApi[]>((canais, item) => {
    if (!item || typeof item !== 'object') return canais;
    const canal = item as Record<string, unknown>;
    const id = Number(canal.id);
    const nome = String(canal.nome ?? '').trim();

    if (!Number.isFinite(id) || !nome) return canais;

    canais.push({
      id,
      nome,
      descricao: canal.descricao ? String(canal.descricao) : undefined,
    });

    return canais;
  }, []);
}

export async function listarCanais(): Promise<CanalComunicacaoApi[]> {
  try {
    const canais = normalizarCanais(await apiClient.get<unknown>('/canais'));
    return canais.length > 0 ? canais : CANAIS_FALLBACK;
  } catch {
    return CANAIS_FALLBACK;
  }
}
