import type { LaneRun } from '../store/types'
import { formatElapsed } from './time'

function prevAmount(lane: LaneRun, k: number): number {
  return k > 0 ? lane.sp[k - 1].a : 0
}

// Texto plano compatible con WhatsApp — mismo formato que la
// versión vanilla. Con `withTeamHeader` en true (para "Copiar
// todo"), cada bloque arranca con "Equipo - Nombre" en vez de
// solo "Nombre".
export function laneToText(lane: LaneRun, withTeamHeader: boolean): string {
  const lines: string[] = []
  lane.sw.forEach((name, j) => {
    const rows = lane.sp.map((split, k) => ({ split, k })).filter((r) => r.split.s === j)
    if (rows.length === 0) return
    lines.push(withTeamHeader ? `${lane.team} - ${name}` : name)
    rows.forEach(({ split, k }) => {
      const partial = split.a - prevAmount(lane, k)
      lines.push(
        `${k + 1}      ${name} - ${formatElapsed(split.a)}      ${formatElapsed(partial)}`,
      )
    })
    lines.push('')
  })
  lines.push(`Total: ${lane.sp.length * (lane.m || 50)} m`)
  return lines.join('\n').trim()
}

export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    textarea.remove()
  }
}

const csvQuote = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`

export function buildCsv(run: LaneRun[]): string {
  const header = ['andarivel', 'equipo', 'nadador', 'n° parcial', 'acumulado', 'parcial', 'metros']
    .map(csvQuote)
    .join(';')
  const rows = [header]
  run.forEach((lane, i) => {
    lane.sp.forEach((split, k) => {
      const partial = split.a - prevAmount(lane, k)
      const meters = (k + 1) * (lane.m || 50)
      rows.push(
        [
          i + 1,
          csvQuote(lane.team),
          csvQuote(lane.sw[split.s]),
          k + 1,
          formatElapsed(split.a),
          formatElapsed(partial),
          meters,
        ].join(';'),
      )
    })
  })
  return rows.join('\r\n')
}

export function downloadCsv(run: LaneRun[], filename = 'parciales.csv'): void {
  const csv = buildCsv(run)
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(link.href)
}