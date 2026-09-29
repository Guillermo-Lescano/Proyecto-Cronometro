import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { useTimerStoreImpl } from "./useTimerStore";
import type { TimerPersistencePort } from "./persistence/timerPersistencePort";

type TimerStoreValue = ReturnType<typeof useTimerStoreImpl>;

const TimerStoreContext = createContext<TimerStoreValue | null>(null);

interface TimerStoreProviderProps {
  children: ReactNode;
  persistence?: TimerPersistencePort;
}

// Una sola instancia del store para toda la app: así Configuración,
// Cronometraje y Resultados leen y escriben el mismo estado en
// memoria, sin depender de un viaje de ida y vuelta por localStorage
// cada vez que se cambia de pantalla.
export function TimerStoreProvider({
  children,
  persistence,
}: TimerStoreProviderProps) {
  const store = useTimerStoreImpl(persistence);
  return (
    <TimerStoreContext.Provider value={store}>
      {children}
    </TimerStoreContext.Provider>
  );
}

export function useTimerStore(): TimerStoreValue {
  const ctx = useContext(TimerStoreContext);
  if (!ctx) {
    throw new Error("useTimerStore debe usarse dentro de <TimerStoreProvider>");
  }
  return ctx;
}
