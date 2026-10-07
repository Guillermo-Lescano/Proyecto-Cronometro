import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { LaneRun } from '../store/types'
import { formatElapsed } from './time'
import { swimmerRows, bestPartialMs } from './export'

function diffCellText(diffMs: number | null): string {
  if (diffMs === null) return '—'
  const diffSec = diffMs / 1000
  if (diffMs < 0) return `Mejoró ${diffSec.toFixed(2)}s`
  if (diffMs > 0) return `Empeoró +${diffSec.toFixed(2)}s`
  return 'Igual'
}

export function exportResultsPdf(run: LaneRun[], filename = 'resultados.pdf'): void {
  const doc = new jsPDF()
  const pageHeight = doc.internal.pageSize.getHeight()

  doc.setFontSize(18)
  doc.setTextColor(20)
  doc.text('Resultados — Crono Natación', 14, 18)

  doc.setFontSize(10)
  doc.setTextColor(110)
  const fecha = new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  doc.text(`Generado el ${fecha}`, 14, 24)

  let cursorY = 32

  run.forEach((lane, i) => {
    const totalMeters = lane.sp.length * (lane.m || 50)
    const total = lane.sp.length ? lane.sp[lane.sp.length - 1].a : 0

    if (cursorY > pageHeight - 35) {
      doc.addPage()
      cursorY = 20
    }

    doc.setFontSize(13)
    doc.setTextColor(20)
    doc.text(`Andarivel ${i + 1} · ${lane.team}`, 14, cursorY)
    doc.setFontSize(10)
    doc.setTextColor(110)
    doc.text(`${totalMeters} m total · ${formatElapsed(total)}`, 14, cursorY + 5)
    cursorY += 10

    const body: string[][] = []
    const bestRowIndexes = new Set<number>()
    // Primera fila de cada nadador — con 10 a 12 tiradas por persona
    // en 30-40 minutos, conviene marcar bien dónde empieza cada uno
    // en vez de depender solo de releer el nombre repetido.
    const swimmerStartRowIndexes = new Set<number>()
    lane.sw.forEach((name, j) => {
      const rows = swimmerRows(lane, j)
      if (rows.length === 0) return
      swimmerStartRowIndexes.add(body.length)
      const bestMs = bestPartialMs(rows)
      rows.forEach((row) => {
        const isBest = bestMs !== null && row.partial === bestMs
        if (isBest) bestRowIndexes.add(body.length)
        body.push([
          name,
          String(row.index + 1),
          formatElapsed(row.cumulative),
          formatElapsed(row.partial) + (isBest ? ' (mejor tiempo)' : ''),
          diffCellText(row.diffMs),
        ])
      })
    })

    autoTable(doc, {
      startY: cursorY,
      head: [['Nadador', 'N°', 'Acumulado', 'Parcial', 'Comparación']],
      body,
      styles: { fontSize: 9, cellPadding: 2.5 },
      headStyles: { fillColor: [20, 20, 20], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 14, right: 14 },
      didParseCell: (data) => {
        if (data.section === 'body' && bestRowIndexes.has(data.row.index)) {
          data.cell.styles.fillColor = [255, 230, 0]
          data.cell.styles.textColor = [20, 20, 20]
          data.cell.styles.fontStyle = 'bold'
        }
       if (data.section === 'body' && swimmerStartRowIndexes.has(data.row.index)) {
          ;(data.cell.styles as unknown as { lineWidth: { top: number; right: number; bottom: number; left: number } }).lineWidth = {
            top: 0.75,
            right: 0,
            bottom: 0,
            left: 0,
          }
          data.cell.styles.lineColor = [20, 20, 20]
        }
      },
    })

    const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY
    cursorY = (finalY ?? cursorY) + 10
  })

  doc.save(filename)
}