import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import type { LaneRun } from "../store/types";
import { formatElapsed } from "../utils/time";
interface LanePanelProps {
  lane: LaneRun;
  elapsedMs: number;
  onToggle: () => void;
  onSplit: () => void;
  onUndo: () => void;
  onReset: () => void;
}
function prevAmount(lane: LaneRun, k: number): number {
  return k > 0 ? lane.sp[k - 1].a : 0;
}
export default function LanePanel({
  lane,
  elapsedMs,
  onToggle,
  onSplit,
  onUndo,
  onReset,
}: LanePanelProps) {
  const meters = lane.sp.length * (lane.m || 50);
  return (
    <Paper
      sx={{
        p: { xs: 1, sm: 1.5 },
        borderRadius: { xs: 1, sm: 2, md: 3 },
      }}
    >
      {" "}
      <Typography
        variant="h6"
        sx={{
          color: "warning.main",
          mb: 0.5,
          fontSize: { xs: "1rem", sm: "1.25rem" },
        }}
      >
        {" "}
        {lane.team}{" "}
      </Typography>{" "}
      <Typography
        color="text.secondary"
        sx={{ mb: 1, fontSize: { xs: "0.85rem", sm: "1rem" } }}
      >
        {" "}
        Nadador: <b>{lane.sw[lane.cur]}</b> ({lane.cur + 1}/{lane.sw.length}
        ){" "}
      </Typography>{" "}
      <Typography
        align="center"
        sx={{
          fontFamily: "ui-monospace, Menlo, monospace",
          fontWeight: 800,
          fontSize: { xs: 32, sm: 42, md: 52 },
          lineHeight: 1.1,
          color: "primary.main",
          my: 0.5,
        }}
      >
        {" "}
        {formatElapsed(elapsedMs)}{" "}
      </Typography>{" "}
      <Typography
        align="center"
        sx={{ mb: 1, fontSize: { xs: "0.8rem", sm: "1rem" } }}
      >
        {" "}
        <Box
          component="b"
          sx={{ color: "warning.main", fontSize: { xs: 20, sm: 24 } }}
        >
          {" "}
          {meters} m{" "}
        </Box>{" "}
        · {lane.sp.length} parciales{" "}
      </Typography>{" "}
      <Stack direction="row" spacing={{ xs: 0.5, sm: 1 }} sx={{ mb: 1 }}>
        {" "}
        <Button
          variant="contained"
          color={lane.running ? "secondary" : "primary"}
          fullWidth
          onClick={onToggle}
          sx={{
            minHeight: { xs: 32, sm: 36, md: 42 },
            height: { xs: 32, sm: 36, md: 42 },
            fontSize: { xs: "0.7rem", sm: "0.75rem", md: "0.875rem" },
            px: { xs: 0.5, sm: 1, md: 1.5 },
            py: 0,
          }}
        >
          {lane.running ? "Pausa" : lane.acc ? "Seguir" : "Iniciar"}
        </Button>
        <Button
          variant="outlined"
          fullWidth
          onClick={onReset}
          sx={{
            minHeight: { xs: 32, sm: 36, md: 42 },
            height: { xs: 32, sm: 36, md: 42 },
            fontSize: { xs: "0.7rem", sm: "0.75rem", md: "0.875rem" },
            px: { xs: 0.5, sm: 1, md: 1.5 },
            py: 0,
          }}
        >
          Reset
        </Button>
      </Stack>{" "}
      <Button
        variant="contained"
        color="warning"
        fullWidth
        size="large"
        disabled={!lane.running}
        onClick={onSplit}
        sx={{
          minHeight: { xs: 64, sm: 88 },
          fontSize: { xs: 20, sm: 28 },
          mb: 1,
        }}
      >
        {" "}
        PARCIAL{" "}
      </Button>{" "}
      <Button
        variant="outlined"
        fullWidth
        onClick={onUndo}
        disabled={lane.sp.length === 0}
        sx={{ mb: 1, fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
      >
        {" "}
        Deshacer parcial{" "}
      </Button>{" "}
      <Box
        sx={{
          maxHeight: 150,
          overflowY: "auto",
          fontFamily: "ui-monospace, Menlo, monospace",
          fontSize: { xs: 13, sm: 15 },
        }}
      >
        {" "}
        {[...lane.sp]
          .map((split, k) => ({ split, k }))
          .reverse()
          .map(({ split, k }) => (
            <Box
              key={k}
              sx={{
                display: "grid",
                gridTemplateColumns: "10% 1fr 1fr",
                gap: 0.75,
                py: 0.5,
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              {""}
              <b>{k + 1}</b> <span>{formatElapsed(split.a)}</span>
              <span> {formatElapsed(split.a - prevAmount(lane, k))} </span>
              {""}
              <Typography
                component="small"
                sx={{
                  gridColumn: "1 / -1",
                  color: "text.secondary",
                  fontFamily: "inherit",
                  fontSize: { xs: 11, sm: 13 },
                }}
              >
                {" "}
                {lane.sw[split.s]}{" "}
              </Typography>{" "}
            </Box>
          ))}{" "}
      </Box>{" "}
    </Paper>
  );
}
