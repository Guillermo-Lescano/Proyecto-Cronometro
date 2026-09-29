import { createTheme } from '@mui/material/styles'

// Paleta tomada de la versión original en HTML/JS vanilla:
// fondo negro, verde de acento, amarillo y rojo de peligro.
const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#000000',
      paper: '#0b0b0b',
    },
    primary: {
      main: '#00e05a', // verde: iniciar / acción principal
      contrastText: '#000000',
    },
    warning: {
      main: '#ffe600', // amarillo: botón grande de PARCIAL
      contrastText: '#000000',
    },
    error: {
      main: '#ff453a', // rojo: eliminar / frenar / reiniciar
      contrastText: '#000000',
    },
    secondary: {
      main: '#ff9f0a', // naranja: pausa
      contrastText: '#000000',
    },
    divider: '#555555',
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    button: {
      textTransform: 'none',
      fontWeight: 700,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 48,
          borderRadius: 10,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          border: '2px solid #555555',
        },
      },
    },
  },
})

export default theme
