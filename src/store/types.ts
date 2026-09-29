// Tipos de dominio, sin nada de UI ni de persistencia mezclado acá.

export interface LaneConfig {
  team: string
  per: number // parciales por nadador antes de rotar (0 = manual)
  sw: string[] // nombres de los nadadores, en orden de turno
}

export interface TimerConfig {
  m: number // metros por parcial, valor global por defecto
  cfg: LaneConfig[] // 1 a 10 andariveles
}

export interface Split {
  a: number // tiempo acumulado en ms al tomar el parcial
  s: number // índice del nadador que hizo esa vuelta
}

export interface LaneRun {
  team: string
  sw: string[]
  per: number
  m: number // metros por parcial de este andarivel (copiado de config al arrancar)
  running: boolean
  acc: number // tiempo acumulado en ms mientras está pausado/entre inicios
  t0: number // performance.now() al último "iniciar"
  e0: number // Date.now() equivalente a t0, para reconstruir tras recargar
  cur: number // índice del nadador actual
  sp: Split[]
}

export const DEFAULT_CONFIG: TimerConfig = {
  m: 50,
  cfg: [
    { team: '', per: 1, sw: ['', ''] },
    { team: '', per: 1, sw: ['', ''] },
  ],
}
