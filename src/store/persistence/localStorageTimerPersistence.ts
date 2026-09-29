import type { TimerPersistencePort, PersistedTimerState } from './timerPersistencePort'

// Mismo criterio de formato que la versión vanilla (objeto plano
// con m/cfg/run), para que el JSON guardado sea legible y portable
// el día que se migre a un backend.
const STORAGE_KEY = 'nat-react-v1'

export function createLocalStorageTimerPersistence(): TimerPersistencePort {
  return {
    async load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return null
        return JSON.parse(raw) as PersistedTimerState
      } catch {
        // JSON corrupto, localStorage deshabilitado, etc. — arrancamos
        // de cero en vez de romper la app.
        return null
      }
    },
    async save(state) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      } catch {
        // Cuota llena, modo privado, etc. No es crítico: el estado
        // sigue vivo en memoria aunque no se pueda persistir.
      }
    },
  }
}

// EJEMPLO de cómo se vería el reemplazo futuro por FastAPI —
// no se usa todavía, queda solo como referencia de la forma:
//
// export function createApiTimerPersistence(baseUrl: string): TimerPersistencePort {
//   return {
//     async load() {
//       const res = await fetch(`${baseUrl}/race/current`)
//       if (!res.ok) return null
//       return res.json()
//     },
//     async save(state) {
//       await fetch(`${baseUrl}/race/current`, {
//         method: 'PUT',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(state),
//       })
//     },
//   }
// }
