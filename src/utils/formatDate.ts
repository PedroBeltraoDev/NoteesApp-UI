const timeFormat = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

// "Hoje, 17:30", "Ontem, 17:30", "20 de out." (este ano) ou "20 de out. de 2025"
export function formatNoteDate(iso: string, now: Date = new Date()): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''

  if (sameDay(date, now)) return `Hoje, ${timeFormat.format(date)}`

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (sameDay(date, yesterday)) return `Ontem, ${timeFormat.format(date)}`

  return date.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short',
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' })
  })
}
