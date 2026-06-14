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
