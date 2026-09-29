import type { TimerConfig, LaneRun } from '../types'

// Lo que se guarda: la configuración y la carrera en curso (si la
// hay). 'screen' no entra acá — la navegación es un asunto de la UI
// (App.tsx), no de los datos de la carrera.
export interface PersistedTimerState {
  config: TimerConfig
  run: LaneRun[] | null
}

// Puerto de persistencia. useTimerStore solo conoce esta interfaz.
// Hoy la implementa localStorage (ver localStorageTimerPersistence.ts);
// el día que haya un backend en FastAPI, se escribe un adapter nuevo
// que hable HTTP y cumpla esta misma interfaz, y ni useTimerStore ni
// las pantallas se enteran del cambio.
//
// Es async a propósito, aunque localStorage sea sincrónico: así el
// futuro adapter de API (fetch, que sí es async) no obliga a cambiar
// la forma en que se lo llama desde el hook.
export interface TimerPersistencePort {
  load(): Promise<PersistedTimerState | null>
  save(state: PersistedTimerState): Promise<void>
}
