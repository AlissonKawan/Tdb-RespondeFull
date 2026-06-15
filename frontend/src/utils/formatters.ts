export function formatStatusLabel(status?: string): string {
  if (!status) return 'Não informado';
  const labels: Record<string, string> = {
    ABERTO: 'Aberto',
    EM_ATENDIMENTO: 'Em Atendimento',
    ENCERRADO: 'Encerrado',
    CANCELADO: 'Cancelado',
    AGUARDANDO_RESPOSTA: 'Aguardando Resposta',
    REAGENDAMENTO_SOLICITADO: 'Reagendamento Solicitado',
    NAO_COMPARECERA: 'Não Comparecerá',
    SEM_RESPOSTA: 'Sem Resposta',
    CONFIRMADO: 'Confirmado'
  };
  return labels[status.toUpperCase()] || status;
}


export function formatDate(value?: string | null | number[] | any): string {
  if (!value) return '';
  try {
    if (Array.isArray(value)) {
      if (value.length >= 3) {
        const [y, m, d, h = 0, min = 0, s = 0] = value;
        // O backend (Azure) costuma enviar como array de inteiros em UTC.
        // Criando a data em UTC garante que o toLocaleString converta para o fuso local (-3 BR).
        return new Date(Date.UTC(y, m - 1, d, h, min, s)).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
      }
      return '';
    }
    const dateStr = typeof value === 'string' && !value.endsWith('Z') && value.includes('T') ? `${value}Z` : value;
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return String(value);
  }
}
