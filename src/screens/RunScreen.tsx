import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import LanePanel from "../components/LanePanel";
import type { ScreenProps } from "../types";

// TODO: migrar acá la lógica de runV() de la versión vanilla:
// performance.now() por andarivel, botón PARCIAL, deshacer,
// iniciar/pausar individual, "Iniciar todos" / "Frenar todos",
// Wake Lock, sumador de metros y "Reiniciar todo".
export default function RunScreen({ goTo }: ScreenProps) {
  // Placeholder: cuando migremos la lógica, esto va a venir del store.
  const lanesPlaceholder = [1, 2];

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ my: 1.5 }}>
        <Button variant="outlined" onClick={() => goTo("results")} fullWidth>
          Resultados
        </Button>
        <Button variant="outlined" onClick={() => goTo("config")}>
          ⚙
        </Button>
      </Stack>

      <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
        <Button variant="contained" color="primary" fullWidth>
          ▶ Iniciar todos
        </Button>
        <Button variant="contained" color="error" fullWidth>
          ■ Frenar todos
        </Button>
      </Stack>

      <Typography color="text.secondary" sx={{ mb: 1 }}>
        Acá van los paneles de cada andarivel.
      </Typography>

      <Box
        sx={{
          display: "grid",
          gap: 1.25,
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
        }}
      >
        {lanesPlaceholder.map((n) => (
          <LanePanel key={n} laneNumber={n} />
        ))}
      </Box>
    </Box>
  );
}
