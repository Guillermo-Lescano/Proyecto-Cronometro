import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import type { ScreenProps } from "../types";

// TODO: migrar acá la lógica de cfgV() de la versión vanilla:
// alta/baja de andariveles (1-10), equipo, lista de nadadores
// (agregar/quitar/reordenar), metros por parcial, botón COMENZAR
// y botón "Reiniciar todo".
export default function ConfigScreen({ goTo }: ScreenProps) {
  return (
    <Box>
      <Typography variant="h5" sx={{ my: 1.5 }}>
        Configuración
      </Typography>

      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Acá va la carga de andariveles, equipos y nadadores.
      </Typography>

      <Button
        variant="contained"
        color="primary"
        fullWidth
        size="large"
        onClick={() => goTo("run")}
      >
        COMENZAR
      </Button>
    </Box>
  );
}
