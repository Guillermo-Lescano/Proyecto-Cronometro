// src/components/LanePanel.tsx
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import type { LaneRun } from "../store/types";
import { formatElapsed } from "../utils/time";

interface LanePanelProps {
  lane: LaneRun;
  laneNumber: number;
  elapsedMs: number;
  onToggle: () => void;
  onSplit: () => void;
  onUndo: () => void;
  onNext: () => void;
  onReset: () => void;
}

function prevAmount(lane: LaneRun, k: number): number {
  return k > 0 ? lane.sp[k - 1].a : 0;
}

export default function LanePanel({
  lane,
  laneNumber,
  elapsedMs,
  onToggle,
  onSplit,
  onUndo,
  onNext,
  onReset,
}: LanePanelProps) {
  const meters = lane.sp.length * (lane.m || 50);

  return (
    <Paper sx={{ p: 1.5, borderRadius: 3 }}>
      <Typography variant="h6" sx={{ color: "warning.main", mb: 0.5 }}>
        {lane.team}
      </Typography>

      <Typography color="text.secondary" sx={{ mb: 1 }}>
        Nadador: <b>{lane.sw[lane.cur]}</b> ({lane.cur + 1}/{lane.sw.length})
      </Typography>

      <Typography
        align="center"
        sx={{
          fontFamily: "ui-monospace, Menlo, monospace",
          fontWeight: 800,
          fontSize: "clamp(38px, 11vw, 60px)",
          lineHeight: 1.1,
          color: "primary.main",
          my: 0.5,
        }}
      >
        {formatElapsed(elapsedMs)}
      </Typography>

      <Typography align="center" sx={{ mb: 1 }}>
        <Box component="b" sx={{ color: "warning.main", fontSize: 24 }}>
          {meters} m
        </Box>{" "}
        · {lane.sp.length} parciales
      </Typography>

      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        <Button
          variant="contained"
          color={lane.running ? "secondary" : "primary"}
          fullWidth
          onClick={onToggle}
        >
          {lane.running ? "Pausa" : lane.acc ? "Seguir" : "Iniciar"}
        </Button>
        <Button variant="outlined" fullWidth onClick={onReset}>
          Reset
        </Button>
      </Stack>

      <Button
        variant="contained"
        color="warning"
        fullWidth
        size="large"
        disabled={!lane.running}
        onClick={onSplit}
        sx={{ minHeight: 88, fontSize: 28, mb: 1 }}
      >
        PARCIAL
      </Button>

      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        <Button
          variant="outlined"
          fullWidth
          onClick={onUndo}
          disabled={lane.sp.length === 0}
        >
          Deshacer parcial
        </Button>
        <Button variant="outlined" fullWidth onClick={onNext}>
          Siguiente nadador
        </Button>
      </Stack>

      <Box
        sx={{
          maxHeight: 180,
          overflowY: "auto",
          fontFamily: "ui-monospace, Menlo, monospace",
          fontSize: 15,
        }}
      >
        {[...lane.sp]
          .map((split, k) => ({ split, k }))
          .reverse()
          .map(({ split, k }) => (
            <Box
              key={k}
              sx={{
                display: "grid",
                gridTemplateColumns: "34px 1fr 1fr",
                gap: 0.75,
                py: 0.5,
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              <b>{k + 1}</b>
              <span>{formatElapsed(split.a)}</span>
              <span>{formatElapsed(split.a - prevAmount(lane, k))}</span>
              <Typography
                component="small"
                sx={{
                  gridColumn: "1 / -1",
                  color: "text.secondary",
                  fontFamily: "inherit",
                  fontSize: 13,
                }}
              >
                {lane.sw[split.s]}
              </Typography>
            </Box>
          ))}
      </Box>
    </Paper>
  );
}
