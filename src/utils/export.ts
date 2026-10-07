import type { LaneRun } from '../store/types'
import { formatElapsed } from './time'

function prevAmount(lane: LaneRun, k: number): number {
  return k > 0 ? lane.sp[k - 1].a : 0
}

// Una tirada de un nadador puntual: su tiempo de parcial (no el
// acumulado del andarivel), y la diferencia contra SU tirada
// anterior (null en la primera, porque no hay con qué comparar).
export interface SwimmerSplitRow {
  index: number // posición de este parcial dentro de lane.sp (para csv/UI)
  cumulative: number // split.a — tiempo acumulado del andarivel en ese momento
  partial: number // tiempo de esta tirada puntual
  diffMs: number | null // partial - partial de la tirada anterior del mismo nadador
}

// Todas las tiradas de un nadador (swimmerIndex = su posición en
// lane.sw), en el orden en que ocurrieron, con la comparación contra
// la tirada inmediata anterior ya calculada.
export function swimmerRows(lane: LaneRun, swimmerIndex: number): SwimmerSplitRow[] {
  const base = lane.sp
    .map((split, k) => ({ split, k }))
    .filter((r) => r.split.s === swimmerIndex)
    .map(({ split, k }) => ({
      index: k,
      cumulative: split.a,
      partial: split.a - prevAmount(lane, k),
    }))

  return base.map((row, idx) => ({
    ...row,
    diffMs: idx === 0 ? null : row.partial - base[idx - 1].partial,
  }))
}

// Mismas diferencias que swimmerRows, pero indexadas por la posición
// del parcial dentro de lane.sp — para poder recorrer lane.sp en su
// orden original (como hace buildCsv) y de todos modos saber la
// comparación de cada parcial contra la tirada anterior de ESE
// nadador en particular.
function diffsBySplitIndex(lane: LaneRun): Map<number, number | null> {
  const map = new Map<number, number | null>()
  lane.sw.forEach((_, j) => {
    swimmerRows(lane, j).forEach((row) => map.set(row.index, row.diffMs))
  })
  return map
}

// Texto corto para el diff en el formato copiable, ej: " (mejoró
// -2.10s)" / " (empeoró +1.30s)" / " (igual)". Vacío si no hay
// comparación posible (primera tirada del nadador).
function diffText(diffMs: number | null): string {
  if (diffMs === null) return ''
  const diffSec = diffMs / 1000
  if (diffMs < 0) return ` (mejoró ${diffSec.toFixed(2)}s)`
  if (diffMs > 0) return ` (empeoró +${diffSec.toFixed(2)}s)`
  return ' (igual)'
}

// Texto plano compatible con WhatsApp — mismo formato que la
// versión vanilla, con la comparación contra la tirada anterior
// agregada al final de cada línea. Con `withTeamHeader` en true
// (para "Copiar todo"), cada bloque arranca con "Equipo - Nombre"
// en vez de solo "Nombre".
export function laneToText(lane: LaneRun, withTeamHeader: boolean): string {
  const lines: string[] = []
  lane.sw.forEach((name, j) => {
    const rows = swimmerRows(lane, j)
    if (rows.length === 0) return
    lines.push(withTeamHeader ? `${lane.team} - ${name}` : name)
    rows.forEach((row) => {
      lines.push(
        `${row.index + 1}      ${name} - ${formatElapsed(row.cumulative)}      ${formatElapsed(row.partial)}${diffText(row.diffMs)}`,
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

// CSV con ; como separador, para que Excel en español lo abra ya
// separado en columnas. "diferencia_vs_anterior" va en segundos,
// con signo, y vacío en la primera tirada de cada nadador.
export function buildCsv(run: LaneRun[]): string {
  const header = [
    'andarivel',
    'equipo',
    'nadador',
    'n° parcial',
    'acumulado',
    'parcial',
    'metros',
    'diferencia_vs_anterior',
  ]
    .map(csvQuote)
    .join(';')
  const rows = [header]
  run.forEach((lane, i) => {
    const diffs = diffsBySplitIndex(lane)
    lane.sp.forEach((split, k) => {
      const partial = split.a - prevAmount(lane, k)
      const meters = (k + 1) * (lane.m || 50)
      const diffMs = diffs.get(k) ?? null
      const diffSeconds = diffMs === null ? '' : (diffMs / 1000).toFixed(2)
      rows.push(
        [
          i + 1,
          csvQuote(lane.team),
          csvQuote(lane.sw[split.s]),
          k + 1,
          formatElapsed(split.a),
          formatElapsed(partial),
          meters,
          diffSeconds,
        ].join(';'),
      )
    })
  })
  return rows.join('\r\n')
}

// BOM UTF-8 (\ufeff) al principio, para que Excel detecte bien la
// codificación y no rompa las tildes.
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