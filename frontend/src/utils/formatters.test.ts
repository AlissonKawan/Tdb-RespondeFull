import { describe, expect, it } from 'vitest';
import { formatStatusLabel } from './formatters';

describe('formatStatusLabel', () => {
  it.each([
    ['ABERTO', 'Aberto'], ['EM_ATENDIMENTO', 'Em andamento'], ['EM_ANDAMENTO', 'Em andamento'],
    ['AGUARDANDO', 'Aguardando'], ['CONFIRMADO', 'Confirmado'], ['CONCLUIDO', 'Concluído'],
    ['ENCERRADO', 'Encerrado'], ['CANCELADO', 'Cancelado'], ['AGUARDANDO_RESPOSTA', 'Aguardando resposta'],
    ['REAGENDAMENTO_SOLICITADO', 'Reagendamento solicitado'], ['NAO_COMPARECERA', 'Não comparecerá'],
    ['SEM_RESPOSTA', 'Sem resposta'], ['  em_atendimento  ', 'Em andamento'],
    ['Em Atendimento', 'Em andamento'], ['REVISAO_MANUAL', 'Revisao manual'], ['', 'Não informado'],
    ['   ', 'Não informado'], [undefined, 'Não informado'],
  ])('traduz %s para %s sem expor constantes', (status, label) => {
    expect(formatStatusLabel(status)).toBe(label);
  });
});
