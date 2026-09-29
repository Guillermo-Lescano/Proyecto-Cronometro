import React from 'react'
import ReactDOM from 'react-dom/client'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import theme from './theme'
import App from './App'

const rootEl = document.getElementById('root')
if (!rootEl) {
  throw new Error('No se encontró el elemento #root en index.html')
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)
