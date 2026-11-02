// Formata uma data ISO como texto relativo em pt-BR.
// Fica fora do componente para poder ser testado sem renderizar React.
export function formatRelativeDate(iso) {
  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()

  // Segurança: se o relógio do banco/servidor estiver adiantado,
  // nunca mostramos "-1d atrás"
  if (diffMs < 0) return 'Agora'

  const minutes = Math.floor(diffMs / (1000 * 60))
  if (minutes < 1) return 'Agora'
  if (minutes < 60) return `${minutes}min atrás`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h atrás`

  const days = Math.floor(hours / 24)
  if (days === 1) return 'Ontem'
  if (days < 7) return `${days}d atrás`
  if (days < 30) return `${Math.floor(days / 7)}sem atrás`
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}
