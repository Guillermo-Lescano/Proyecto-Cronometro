import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";
import Snackbar from "@mui/material/Snackbar";
import type { ScreenProps } from "../types";
import { useTimerStore } from "../store/TimerStoreContext";
import type { LaneRun } from "../store/types";
import { formatElapsed } from "../utils/time";
import { laneToText, copyToClipboard, downloadCsv } from "../utils/export";

function prevAmount(lane: LaneRun, k: number): number {
  return k > 0 ? lane.sp[k - 1].a : 0;
}

export default function ResultsScreen({ goTo }: ScreenProps) {
  const { run } = useTimerStore();
  const [toastOpen, setToastOpen] = useState(false);

  const handleCopy = async (text: string) => {
    await copyToClipboard(text);
    setToastOpen(true);
  };

  if (!run) {
    return (
      <Box sx={{ py: 4, textAlign: "center" }}>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Todavía no arrancó ninguna carrera.
        </Typography>
        <Button variant="contained" onClick={() => goTo("config")}>
          Ir a Configuración
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ my: 1.5 }}>
        Resultados
      </Typography>

      {run.map((lane, i) => {
        const total = lane.sp.length ? lane.sp[lane.sp.length - 1].a : 0;
        const totalMeters = lane.sp.length * (lane.m || 50);

        return (
          <Paper key={i} sx={{ p: 1.5, mb: 1.5, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ color: "warning.main", mb: 1 }}>
              {lane.team} · {totalMeters} m · Total {formatElapsed(total)}
            </Typography>

            {lane.sw.map((name, j) => {
              const rows = lane.sp
                .map((split, k) => ({ split, k }))
                .filter((r) => r.split.s === j);
              if (rows.length === 0) return null;
              const sum = rows.reduce(
                (acc, { split, k }) => acc + (split.a - prevAmount(lane, k)),
                0,
              );

              return (
                <Box key={j} sx={{ mb: 1.5 }}>
                  <Typography>
                    <b>{name}</b>{" "}
                    <Typography
                      component="span"
                      color="text.secondary"
                      variant="body2"
                    >
                      ({rows.length * (lane.m || 50)} m · {formatElapsed(sum)})
                    </Typography>
                  </Typography>
                  <Box
                    sx={{
                      fontFamily: "ui-monospace, Menlo, monospace",
                      fontSize: 15,
                    }}
                  >
                    {rows.map(({ split, k }) => (
                      <Box
                        key={k}
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "34px 1fr 1fr",
                          gap: 0.75,
                          py: 0.25,
                        }}
                      >
                        <b>{k + 1}</b>
                        <span>{formatElapsed(split.a)}</span>
                        <span>
                          {formatElapsed(split.a - prevAmount(lane, k))}
                        </span>
                      </Box>
                    ))}
                  </Box>
                </Box>
              );
            })}

            <Button
              variant="contained"
              fullWidth
              onClick={() => handleCopy(laneToText(lane, false))}
            >
              Copiar
            </Button>
          </Paper>
        );
      })}

      <Stack spacing={1}>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={() =>
            handleCopy(run.map((lane) => laneToText(lane, true)).join("\n\n"))
          }
        >
          Copiar todo
        </Button>
        <Button variant="outlined" fullWidth onClick={() => downloadCsv(run)}>
          Exportar CSV
        </Button>
      </Stack>

      <Divider sx={{ my: 2, borderColor: "divider" }} />

      <Button variant="text" fullWidth onClick={() => goTo("run")}>
        ← Volver
      </Button>

      <Snackbar
        open={toastOpen}
        autoHideDuration={1400}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        message="Copiado"
      />
    </Box>
  );
}
