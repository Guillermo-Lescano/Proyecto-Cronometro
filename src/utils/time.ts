// src/utils/time.ts
export function formatElapsed(ms: number): string {
  const centis = Math.floor(Math.max(0, ms) / 10)
  const mm = Math.floor(centis / 6000)
  const ss = Math.floor(centis / 100) % 60
  const cc = centis % 100
  const p2 = (n: number) => String(n).padStart(2, '0')
  return `${p2(mm)}:${p2(ss)}.${p2(cc)}`
}