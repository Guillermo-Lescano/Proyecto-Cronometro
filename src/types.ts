export type ScreenName = 'config' | 'run' | 'results'

// Props que recibe cada pantalla para poder navegar a otra.
export interface ScreenProps {
  goTo: (screen: ScreenName) => void
}
