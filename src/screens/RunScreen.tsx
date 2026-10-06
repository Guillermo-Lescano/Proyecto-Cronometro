import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import SettingsIcon from "@mui/icons-material/Settings";
import type { ScreenProps } from "../types";
import { useTimerStore } from "../store/TimerStoreContext";
import { useWakeLock } from "../hooks/useWakeLock";
import LanePanel from "../components/LanePanel";

function vibrate() {
  if ("vibrate" in navigator) {
    try {
      navigator.vibrate(30);
    } catch {
      // no-op
    }
  }
}

export default function RunScreen({ goTo }: ScreenProps) {
  const {
    run,
    getElapsedMs,
    toggleLane,
    startAllLanes,
    stopAllLanes,
    splitLane,
    undoSplit,
    resetLane,
    resetAll,
  } = useTimerStore();

  const hasRunningLane = !!run?.some((lane) => lane.running);
  useWakeLock(hasRunningLane);

  const handleSplit = (index: number) => {
    vibrate();
    splitLane(index);
  };

  if (!run) {
    return (
      <Box sx={{ py: 4, textAlign: "center" }}>
        <Button variant="contained" onClick={() => goTo("config")}>
          Ir a Configuración
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ my: 1.5 }}>
        <Button variant="outlined" fullWidth onClick={() => goTo("results")}>
          Resultados
        </Button>
        <IconButton
          onClick={() => goTo("config")}
          sx={{ border: "2px solid", borderColor: "divider" }}
        >
          <SettingsIcon />
        </IconButton>
      </Stack>

      <Stack
        direction="row"
        spacing={1}
        sx={{
          position: "sticky",
          top: "env(safe-area-inset-top, 0px)",
          bgcolor: "background.default",
          py: 1,
          mb: 1.5,
          zIndex: 5,
        }}
      >
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={startAllLanes}
        >
          ▶ Iniciar todos
        </Button>
        <Button
          variant="contained"
          color="error"
          fullWidth
          onClick={stopAllLanes}
        >
          ■ Frenar todos
        </Button>
      </Stack>

      {/* <Box
        sx={{
          display: "grid",
          gap: 1.25,
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 270px), 1fr))",
        }}
      > */}
      <Box
        sx={{
          display: "grid",
          gap: 1,
          gridTemplateColumns: "1fr 1fr",
          "@media (max-width: 350px)": {
            gridTemplateColumns: "1fr",
            gap: 4,
          },
        }}
      >
        {run.map((lane, i) => (
          <LanePanel
            key={i}
            lane={lane}
            elapsedMs={getElapsedMs(lane)}
            onToggle={() => toggleLane(i)}
            onSplit={() => handleSplit(i)}
            onUndo={() => undoSplit(i)}
            onReset={() => resetLane(i)}
          />
        ))}
      </Box>

      <Divider sx={{ my: 2, borderColor: "divider" }} />

      <Button
        variant="contained"
        color="error"
        fullWidth
        onClick={() => {
          if (
            window.confirm(
              "¿Reiniciar todos los cronómetros? Se borran todos los parciales.",
            )
          ) {
            resetAll();
          }
        }}
      >
        Reiniciar todo
      </Button>
    </Box>
  );
}
