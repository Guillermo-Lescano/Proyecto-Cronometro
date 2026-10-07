import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";
import Snackbar from "@mui/material/Snackbar";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import type { ScreenProps } from "../types";
import { useTimerStore } from "../store/TimerStoreContext";
import { formatElapsed } from "../utils/time";
import {
  laneToText,
  copyToClipboard,
  downloadCsv,
  swimmerRows,
} from "../utils/export";

// Mejoró (tiempo menor) en verde con flecha hacia abajo, empeoró
// (tiempo mayor) en rojo con flecha hacia arriba, igual en gris sin
// ícono. null = primera tirada del nadador, no hay con qué comparar.
function diffDisplay(diffMs: number | null): {
  label: string;
  color: string;
  Icon: typeof ArrowDownwardIcon | null;
} | null {
  if (diffMs === null) return null;
  const diffSec = diffMs / 1000;
  if (diffMs < 0)
    return {
      label: `Mejoró ${diffSec.toFixed(2)} s`,
      color: "primary.main",
      Icon: ArrowDownwardIcon,
    };
  if (diffMs > 0)
    return {
      label: `Empeoró +${diffSec.toFixed(2)} s`,
      color: "error.main",
      Icon: ArrowUpwardIcon,
    };
  return { label: "Igual", color: "text.secondary", Icon: null };
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
              const rows = swimmerRows(lane, j);
              if (rows.length === 0) return null;
              const sum = rows.reduce((acc, row) => acc + row.partial, 0);

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
                    {rows.map((row) => {
                      const diff = diffDisplay(row.diffMs);
                      return (
                        <Box
                          key={row.index}
                          sx={{
                            display: "grid",
                            gridTemplateColumns: "34px 1fr 1.7fr",
                            gap: 0.75,
                            py: 0.35,
                            alignItems: "center",
                          }}
                        >
                          <b>{row.index + 1}</b>
                          <span>{formatElapsed(row.cumulative)}</span>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              flexWrap: "wrap",
                              gap: 0.5,
                            }}
                          >
                            <span>{formatElapsed(row.partial)}</span>
                            {diff && (
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.25,
                                  color: diff.color,
                                  fontFamily: "system-ui, sans-serif",
                                  fontSize: 12,
                                }}
                              >
                                {diff.Icon && (
                                  <diff.Icon sx={{ fontSize: 13 }} />
                                )}
                                {diff.label}
                              </Box>
                            )}
                          </Box>
                        </Box>
                      );
                    })}
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
