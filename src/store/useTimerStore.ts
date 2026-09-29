import { useCallback, useEffect, useState } from 'react'
import type { TimerPersistencePort } from './persistence/timerPersistencePort'
import { createLocalStorageTimerPersistence } from './persistence/localStorageTimerPersistence'
import type { TimerConfig, LaneRun } from './types'
import { DEFAULT_CONFIG } from './types'

// Adapter por defecto: localStorage. El día que haya una API en
// FastAPI, se crea un adapter que cumpla TimerPersistencePort y se
// lo pasa como parámetro (útil también para tests, con un adapter
// en memoria) — nada más de este archivo necesita cambiar.
const defaultPersistence = createLocalStorageTimerPersistence()

// Tiempo transcurrido de un andarivel, siempre a partir de
// performance.now(). Nunca se suma por setInterval: el intervalo
// del hook solo fuerza un re-render para que se vea avanzar.
function elapsedMs(lane: LaneRun): number {
  return lane.running ? lane.acc + performance.now() - lane.t0 : lane.acc
}

// Si se recarga la página con un andarivel corriendo, performance.now()
// arranca de nuevo desde 0. Reconstruimos t0 usando e0 (el Date.now()
// que se guardó junto con t0) para que el tiempo transcurrido real no
// se pierda.
function rehydrateRun(run: LaneRun[] | null): LaneRun[] | null {
  if (!run) return null
  return run.map((lane) =>
    lane.running ? { ...lane, t0: performance.now() - (Date.now() - lane.e0) } : lane,
  )
}

function buildRun(config: TimerConfig): LaneRun[] {
  return config.cfg.map((c, i) => ({
    team: c.team.trim() || `Andarivel ${i + 1}`,
    sw: c.sw.map((s, j) => s.trim() || `Nadador ${j + 1}`),
    per: c.per | 0,
    m: config.m || 50,
    running: false,
    acc: 0,
    t0: 0,
    e0: 0,
    cur: 0,
    sp: [],
  }))
}

export function useTimerStore(persistence: TimerPersistencePort = defaultPersistence) {
  const [config, setConfig] = useState<TimerConfig>(DEFAULT_CONFIG)
  const [run, setRun] = useState<LaneRun[] | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [, forceTick] = useState(0)

  // Carga inicial desde la capa de persistencia (hoy localStorage,
  // mañana quizás un fetch — el hook no distingue).
  useEffect(() => {
    let cancelled = false
    persistence.load().then((saved) => {
      if (cancelled) return
      if (saved) {
        setConfig(saved.config ?? DEFAULT_CONFIG)
        setRun(rehydrateRun(saved.run))
      }
      setIsReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [persistence])

  // Persiste cada cambio, pero solo después de que terminó la carga
  // inicial — si no, el primer render (con los valores por defecto)
  // pisaría lo que ya estaba guardado antes de leerlo.
  useEffect(() => {
    if (!isReady) return
    persistence.save({ config, run })
  }, [config, run, isReady, persistence])

  // Repinta cada 50ms mientras haya al menos un andarivel corriendo.
  // El tiempo real siempre sale de performance.now() (ver elapsedMs);
  // esto solo dispara el re-render para que el número se vea avanzar.
  useEffect(() => {
    if (!run || !run.some((l) => l.running)) return
    const id = setInterval(() => forceTick((t) => t + 1), 50)
    return () => clearInterval(id)
  }, [run])

  // --- Configuración -------------------------------------------------

  // Updater "a la useState": recibe el config anterior y devuelve el
  // nuevo, o directamente el config nuevo. Así ConfigScreen puede
  // implementar agregar/quitar andarivel o nadador, reordenar, etc.
  // sin que este hook necesite una función para cada caso puntual.
  const updateConfig = useCallback(
    (updater: TimerConfig | ((prev: TimerConfig) => TimerConfig)) => {
      setConfig((prev) => (typeof updater === 'function' ? updater(prev) : updater))
    },
    [],
  )

  // --- Carrera ---------------------------------------------------------

  // Arranca una carrera nueva a partir de la configuración actual.
  // Si ya había una carrera con parciales cargados, se pisa: la
  // confirmación ("¿estás seguro?") es responsabilidad de la pantalla,
  // no de este hook.
  const startRace = useCallback(() => {
    setRun(buildRun(config))
  }, [config])

  const toggleLane = useCallback((index: number) => {
    setRun((prev) => {
      if (!prev) return prev
      return prev.map((lane, i) => {
        if (i !== index) return lane
        if (lane.running) return { ...lane, acc: elapsedMs(lane), running: false }
        return { ...lane, t0: performance.now(), e0: Date.now(), running: true }
      })
    })
  }, [])

  // Bonus (no lo pediste explícitamente, pero hacen falta para
  // "Iniciar todos" / "Frenar todos" de la pantalla de cronometraje):
  const startAllLanes = useCallback(() => {
    setRun((prev) => {
      if (!prev) return prev
      const t0 = performance.now()
      const e0 = Date.now()
      return prev.map((lane) => (lane.running ? lane : { ...lane, t0, e0, running: true }))
    })
  }, [])

  const stopAllLanes = useCallback(() => {
    setRun((prev) => {
      if (!prev) return prev
      const now = performance.now()
      return prev.map((lane) =>
        lane.running ? { ...lane, acc: lane.acc + now - lane.t0, running: false } : lane,
      )
    })
  }, [])

  const splitLane = useCallback((index: number) => {
    setRun((prev) => {
      if (!prev) return prev
      return prev.map((lane, i) => {
        if (i !== index || !lane.running) return lane
        const a = elapsedMs(lane)
        const sp = [...lane.sp, { a, s: lane.cur }]
        let cur = lane.cur
        // per=1 (caso normal): rota al siguiente nadador en cada parcial.
        // per=0: cambio manual (ver nextSwimmer). per>1: rota cada N parciales.
        if (lane.per > 0 && sp.filter((p) => p.s === lane.cur).length % lane.per === 0) {
          cur = (lane.cur + 1) % lane.sw.length
        }
        return { ...lane, sp, cur }
      })
    })
  }, [])

  const undoSplit = useCallback((index: number) => {
    setRun((prev) => {
      if (!prev) return prev
      return prev.map((lane, i) => {
        if (i !== index || lane.sp.length === 0) return lane
        const sp = lane.sp.slice(0, -1)
        const last = lane.sp[lane.sp.length - 1]
        return { ...lane, sp, cur: last.s }
      })
    })
  }, [])

  const nextSwimmer = useCallback((index: number) => {
    setRun((prev) => {
      if (!prev) return prev
      return prev.map((lane, i) =>
        i !== index ? lane : { ...lane, cur: (lane.cur + 1) % lane.sw.length },
      )
    })
  }, [])

  const resetLane = useCallback((index: number) => {
    setRun((prev) => {
      if (!prev) return prev
      return prev.map((lane, i) =>
        i !== index ? lane : { ...lane, running: false, acc: 0, cur: 0, sp: [] },
      )
    })
  }, [])

  // Reinicia todos los cronómetros y parciales, pero conserva equipos
  // y nadadores — equivalente al "Reiniciar todo" de la pantalla de
  // cronometraje.
  const resetAll = useCallback(() => {
    setRun((prev) =>
      prev ? prev.map((lane) => ({ ...lane, running: false, acc: 0, cur: 0, sp: [] })) : prev,
    )
  }, [])

  // Bonus: vuelve todo a cero (config por defecto, sin carrera) —
  // equivalente al "Reiniciar todo" de la pantalla de configuración.
  const resetEverything = useCallback(() => {
    setConfig(DEFAULT_CONFIG)
    setRun(null)
  }, [])

  return {
    isReady, // false hasta que se resuelve la carga inicial (útil si el futuro adapter de API tarda)
    config,
    run,
    getElapsedMs: elapsedMs,
    updateConfig,
    startRace,
    toggleLane,
    startAllLanes,
    stopAllLanes,
    splitLane,
    undoSplit,
    nextSwimmer,
    resetLane,
    resetAll,
    resetEverything,
  }
}
