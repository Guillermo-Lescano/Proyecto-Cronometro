// src/hooks/useWakeLock.ts
import { useEffect, useRef } from 'react'

interface WakeLockSentinelLike {
  release: () => Promise<void>
  addEventListener: (type: 'release', listener: () => void) => void
}
interface NavigatorWithWakeLock extends Navigator {
  wakeLock?: {
    request: (type: 'screen') => Promise<WakeLockSentinelLike>
  }
}

export function useWakeLock(active: boolean) {
  const lockRef = useRef<WakeLockSentinelLike | null>(null)

  useEffect(() => {
    const nav = navigator as NavigatorWithWakeLock
    let cancelled = false

    async function acquire() {
      if (!nav.wakeLock || lockRef.current) return
      try {
        const lock = await nav.wakeLock.request('screen')
        if (cancelled) {
          lock.release().catch(() => {})
          return
        }
        lockRef.current = lock
        lock.addEventListener('release', () => {
          lockRef.current = null
        })
      } catch {
        // Permiso denegado, no soportado, documento no visible, etc.
      }
    }

    async function release() {
      const lock = lockRef.current
      lockRef.current = null
      try {
        await lock?.release()
      } catch {
        // no-op
      }
    }

    if (active) acquire()
    else release()

    return () => {
      cancelled = true
    }
  }, [active])

  useEffect(() => {
    function onVisibilityChange() {
      const nav = navigator as NavigatorWithWakeLock
      if (document.visibilityState === 'visible' && active && !lockRef.current && nav.wakeLock) {
        nav.wakeLock
          .request('screen')
          .then((lock) => {
            lockRef.current = lock
            lock.addEventListener('release', () => {
              lockRef.current = null
            })
          })
          .catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [active])
}