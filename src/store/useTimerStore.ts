import { useCallback, useEffect, useState } from 'react'
import type { TimerPersistencePort } from './persistence/timerPersistencePort'
import { createLocalStorageTimerPersistence } from './persistence/localStorageTimerPersistence'
import type { TimerConfig, LaneRun } from './types'
import { DEFAULT_CONFIG } from './types'

const defaultPersistence = createLocalStorageTimerPersistence()

function elapsedMs(lane: LaneRun): number {
  return lane.running ? lane.acc + performance.now() - lane.t0 : lane.acc
}

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

export function useTimerStoreImpl(persistence: TimerPersistencePort = defaultPersistence) {
  const [config, setConfig] = useState<TimerConfig>(DEFAULT_CONFIG)
  const [run, setRun] = useState<LaneRun[] | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [, forceTick] = useState(0)

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

  useEffect(() => {
    if (!isReady) return
    persistence.save({ config, run })
  }, [config, run, isReady, persistence])

  useEffect(() => {
    if (!run || !run.some((l) => l.running)) return
    const id = setInterval(() => forceTick((t) => t + 1), 50)
    return () => clearInterval(id)
  }, [run])

  const updateConfig = useCallback(
    (updater: TimerConfig | ((prev: TimerConfig) => TimerConfig)) => {
      setConfig((prev) => (typeof updater === 'function' ? updater(prev) : updater))
    },
    [],
  )

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

  const resetAll = useCallback(() => {
    setRun((prev) =>
      prev ? prev.map((lane) => ({ ...lane, running: false, acc: 0, cur: 0, sp: [] })) : prev,
    )
  }, [])

  const resetEverything = useCallback(() => {
    setConfig(DEFAULT_CONFIG)
    setRun(null)
  }, [])

  return {
    isReady,
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