import { useEffect, useRef } from 'react'

// Pide el Wake Lock mientras `active` sea true, y lo libera cuando
// pasa a false. Si la pestaña vuelve a primer plano con `active`
// todavía en true (el lock se libera solo cuando la pestaña se
// oculta), lo vuelve a pedir.
export function useWakeLock(active: boolean) {
  const lockRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    let cancelled = false

    async function acquire() {
      if (!navigator.wakeLock || lockRef.current) return
      try {
        const lock = await navigator.wakeLock.request('screen')
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
        // No es crítico: el cronómetro sigue funcionando igual.
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
      if (document.visibilityState === 'visible' && active && !lockRef.current && navigator.wakeLock) {
        navigator.wakeLock
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