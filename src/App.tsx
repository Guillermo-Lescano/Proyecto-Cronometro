import { Box, Button, Typography } from "@mui/material";

function App() {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h3" gutterBottom>
        Mi Cronómetro
      </Typography>

      <Typography variant="body1" sx={{ mb: 2 }}>
        React + Vite + TypeScript + Material UI
      </Typography>

      <Button variant="contained">Iniciar</Button>
    </Box>
  );
}

export default App;
