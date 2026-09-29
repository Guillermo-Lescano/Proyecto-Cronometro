import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import type { ScreenProps } from "../types";
import { useTimerStore } from "../store/useTimerStore";
import type { TimerConfig } from "../store/types";

const MAX_LANES = 10;
const MIN_LANES = 1;

export default function ConfigScreen({ goTo }: ScreenProps) {
  const { config, updateConfig, run, startRace, resetEverything } =
    useTimerStore();
  // Buffer local para poder borrar el campo de metros sin que se
  // pise con el valor anterior hasta que se tipea algo nuevo.
  const [metersInput, setMetersInput] = useState(String(config.m));

  const setMeters = (raw: string) => {
    setMetersInput(raw);
    const n = parseInt(raw, 10);
    updateConfig((prev) => ({
      ...prev,
      m: Number.isFinite(n) && n > 0 ? n : prev.m,
    }));
  };

  const addLane = () => {
    updateConfig((prev: TimerConfig) =>
      prev.cfg.length >= MAX_LANES
        ? prev
        : { ...prev, cfg: [...prev.cfg, { team: "", per: 1, sw: ["", ""] }] },
    );
  };

  const removeLane = (i: number) => {
    const lane = config.cfg[i];
    if (config.cfg.length <= MIN_LANES) return;
    const hasData = lane.team.trim() || lane.sw.some((s) => s.trim());
    if (
      hasData &&
      !window.confirm(`¿Eliminar el andarivel ${i + 1} con sus datos?`)
    )
      return;
    updateConfig((prev) => ({
      ...prev,
      cfg: prev.cfg.filter((_, idx) => idx !== i),
    }));
  };

  const setTeam = (i: number, team: string) => {
    updateConfig((prev) => ({
      ...prev,
      cfg: prev.cfg.map((c, idx) => (idx === i ? { ...c, team } : c)),
    }));
  };

  const setPer = (i: number, raw: string) => {
    const per = Math.max(0, parseInt(raw, 10) || 0);
    updateConfig((prev) => ({
      ...prev,
      cfg: prev.cfg.map((c, idx) => (idx === i ? { ...c, per } : c)),
    }));
  };

  const addSwimmer = (i: number) => {
    updateConfig((prev) => ({
      ...prev,
      cfg: prev.cfg.map((c, idx) =>
        idx === i ? { ...c, sw: [...c.sw, ""] } : c,
      ),
    }));
  };

  const removeSwimmer = (i: number, j: number) => {
    updateConfig((prev) => ({
      ...prev,
      cfg: prev.cfg.map((c, idx) =>
        idx === i && c.sw.length > 1
          ? { ...c, sw: c.sw.filter((_, k) => k !== j) }
          : c,
      ),
    }));
  };

  const setSwimmerName = (i: number, j: number, name: string) => {
    updateConfig((prev) => ({
      ...prev,
      cfg: prev.cfg.map((c, idx) =>
        idx === i ? { ...c, sw: c.sw.map((s, k) => (k === j ? name : s)) } : c,
      ),
    }));
  };

  const moveSwimmer = (i: number, j: number, dir: -1 | 1) => {
    updateConfig((prev) => ({
      ...prev,
      cfg: prev.cfg.map((c, idx) => {
        if (idx !== i) return c;
        const target = j + dir;
        if (target < 0 || target >= c.sw.length) return c;
        const sw = [...c.sw];
        [sw[j], sw[target]] = [sw[target], sw[j]];
        return { ...c, sw };
      }),
    }));
  };

  const handleStart = () => {
    const hasSplits = run?.some((lane) => lane.sp.length > 0);
    if (
      hasSplits &&
      !window.confirm("Hay parciales guardados. ¿Empezar de nuevo y borrarlos?")
    ) {
      return;
    }
    startRace();
    goTo("run");
  };

  const handleResetAll = () => {
    if (
      !window.confirm(
        "¿Reiniciar todo? Se borran andariveles, nadadores y parciales.",
      )
    )
      return;
    resetEverything();
    setMetersInput("50");
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ my: 1.5 }}>
        Configuración
      </Typography>

      <Paper sx={{ p: 1.5, mb: 1.5, borderRadius: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography sx={{ flex: 1 }}>
            Andariveles: <b>{config.cfg.length}</b>{" "}
            <Typography component="span" color="text.secondary" variant="body2">
              (máx. {MAX_LANES})
            </Typography>
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={addLane}
            disabled={config.cfg.length >= MAX_LANES}
          >
            Agregar andarivel
          </Button>
        </Stack>

        <TextField
          sx={{ mt: 1.5 }}
          fullWidth
          type="number"
          label="Metros por parcial"
          value={metersInput}
          onChange={(e) => setMeters(e.target.value)}
          inputProps={{ min: 1, inputMode: "numeric" }}
        />
      </Paper>

      {config.cfg.map((lane, i) => (
        <Paper key={i} sx={{ p: 1.5, mb: 1.5, borderRadius: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <Typography variant="h6" sx={{ flex: 1, color: "warning.main" }}>
              Andarivel {i + 1}
            </Typography>
            <Button
              size="small"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => removeLane(i)}
              disabled={config.cfg.length <= MIN_LANES}
            >
              Eliminar andarivel
            </Button>
          </Stack>

          <TextField
            fullWidth
            label="Equipo o club (opcional)"
            value={lane.team}
            onChange={(e) => setTeam(i, e.target.value)}
          />

          <Typography
            color="text.secondary"
            variant="body2"
            sx={{ mt: 1.5, mb: 1 }}
          >
            Nadadores en orden de turno · "Parc./nad.": 1 = pasa al siguiente
            nadador en cada parcial (recomendado), 0 = cambio manual
          </Typography>

          <Stack spacing={1}>
            {lane.sw.map((name, j) => (
              <Stack key={j} direction="row" spacing={0.5} alignItems="center">
                <TextField
                  fullWidth
                  size="small"
                  placeholder={`Nadador ${j + 1}`}
                  value={name}
                  onChange={(e) => setSwimmerName(i, j, e.target.value)}
                />
                <IconButton
                  aria-label="Subir nadador"
                  onClick={() => moveSwimmer(i, j, -1)}
                  disabled={j === 0}
                >
                  <KeyboardArrowUpIcon />
                </IconButton>
                <IconButton
                  aria-label="Bajar nadador"
                  onClick={() => moveSwimmer(i, j, 1)}
                  disabled={j === lane.sw.length - 1}
                >
                  <KeyboardArrowDownIcon />
                </IconButton>
                <IconButton
                  aria-label="Quitar nadador"
                  color="error"
                  onClick={() => removeSwimmer(i, j)}
                  disabled={lane.sw.length <= 1}
                >
                  <CloseIcon />
                </IconButton>
              </Stack>
            ))}
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            sx={{ mt: 1.5 }}
            alignItems="center"
          >
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => addSwimmer(i)}
              fullWidth
            >
              Agregar nadador
            </Button>
            <TextField
              sx={{ flex: "0 0 140px" }}
              size="small"
              type="number"
              label="Parc./nad."
              value={lane.per}
              onChange={(e) => setPer(i, e.target.value)}
              inputProps={{ min: 0, inputMode: "numeric" }}
            />
          </Stack>
        </Paper>
      ))}

      <Button
        variant="contained"
        color="primary"
        fullWidth
        size="large"
        onClick={handleStart}
      >
        COMENZAR
      </Button>

      {run && (
        <Button
          variant="outlined"
          fullWidth
          sx={{ mt: 1.5 }}
          onClick={() => goTo("run")}
        >
          Volver al cronómetro
        </Button>
      )}

      <Divider sx={{ my: 2, borderColor: "divider" }} />

      <Button
        variant="contained"
        color="error"
        fullWidth
        onClick={handleResetAll}
      >
        Reiniciar todo
      </Button>
    </Box>
  );
}
