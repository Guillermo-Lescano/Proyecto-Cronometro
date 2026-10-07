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
import StarIcon from "@mui/icons-material/Star";
import ShareIcon from "@mui/icons-material/Share";
import type { ScreenProps } from "../types";
import { useTimerStore } from "../store/TimerStoreContext";
import { formatElapsed } from "../utils/time";
import {
  laneToText,
  copyToClipboard,
  downloadCsv,
  swimmerRows,
  bestPartialMs,
} from "../utils/export";
import { exportResultsPdf } from "../utils/pdf";

// Mejoró (tiempo menor) en verde con flecha hacia abajo, empeoró
// (tiempo mayor) en rojo con flecha hacia arriba, igual en gris sin
// ícono. null = primera tirada del nadador, no hay con qué comparar.
// `word` y `value` van separados (en vez de un solo label) para
// poder esconder la palabra en pantallas angostas y quedarnos solo
// con el ícono + el número, que ya alcanza para entenderlo.
function diffDisplay(diffMs: number | null): {
  word: string;
  value: string;
  color: string;
  Icon: typeof ArrowDownwardIcon | null;
} | null {
  if (diffMs === null) return null;
  const diffSec = diffMs / 1000;
  if (diffMs < 0) {
    return {
      word: "Mejoró",
      value: `${diffSec.toFixed(2)} s`,
      color: "primary.main",
      Icon: ArrowDownwardIcon,
    };
  }
  if (diffMs > 0) {
    return {
      word: "Empeoró",
      value: `+${diffSec.toFixed(2)} s`,
      color: "error.main",
      Icon: ArrowUpwardIcon,
    };
  }
  return { word: "Igual", value: "", color: "text.secondary", Icon: null };
}

// No todos los navegadores tienen Web Share (sobre todo de
// escritorio) — mostramos el botón "Compartir" solo si existe.
const canShare =
  typeof navigator !== "undefined" && typeof navigator.share === "function";

async function shareText(text: string, title: string) {
  try {
    await navigator.share({ title, text });
  } catch {
    // El usuario cerró la hoja de compartir sin elegir nada, o el
    // navegador la rechazó — no es un error que haya que mostrar.
  }
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
              const bestMs = bestPartialMs(rows);

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
                      const isBest = bestMs !== null && row.partial === bestMs;
                      return (
                        <Box
                          key={row.index}
                          sx={{
                            display: "grid",
                            gridTemplateColumns: "28px 1fr 1.9fr",
                            gap: { xs: 0.4, sm: 0.75 },
                            py: 0.35,
                            alignItems: "center",
                            fontSize: { xs: 13, sm: 15 },
                            "@media (max-width: 430px)": {
                              gridTemplateColumns: "22px 0.9fr 2fr",
                              gap: 0.25,
                              fontSize: 12,
                            },
                          }}
                        >
                          <b>{row.index + 1}</b>
                          <span>{formatElapsed(row.cumulative)}</span>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              flexWrap: "nowrap",
                              gap: 0.4,
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.25,
                                flexShrink: 0,
                              }}
                            >
                              <span>{formatElapsed(row.partial)}</span>
                              <StarIcon
                                titleAccess={
                                  isBest
                                    ? "Mejor marca de este nadador"
                                    : undefined
                                }
                                sx={{
                                  fontSize: { xs: 13, sm: 15 },
                                  color: "warning.main",
                                  visibility: isBest ? "visible" : "hidden",
                                }}
                              />
                            </Box>
                            {diff && (
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 2,
                                  color: diff.color,
                                  fontFamily: "system-ui, sans-serif",
                                  fontSize: { xs: 11, sm: 12 },
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {diff.Icon && (
                                  <diff.Icon
                                    sx={{ fontSize: { xs: 12, sm: 13 } }}
                                  />
                                )}
                                <Box
                                  component="span"
                                  sx={{
                                    display: "inline-block",
                                    minWidth: "9ch",
                                    "@media (max-width: 400px)": {
                                      display: "none",
                                    },
                                  }}
                                >
                                  {diff.word}
                                </Box>
                                {diff.value}
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

            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                fullWidth
                onClick={() => handleCopy(laneToText(lane, false))}
              >
                Copiar
              </Button>
              {canShare && (
                <Button
                  variant="outlined"
                  startIcon={<ShareIcon />}
                  onClick={() =>
                    shareText(
                      laneToText(lane, false),
                      `${lane.team} — resultados`,
                    )
                  }
                  sx={{
                    "@media (max-width: 430px)": {
                      minWidth: 0,
                      px: 1.25,
                      "& .MuiButton-startIcon": { margin: 0 },
                    },
                  }}
                >
                  <Box
                    component="span"
                    sx={{ "@media (max-width: 430px)": { display: "none" } }}
                  >
                    Compartir
                  </Box>
                </Button>
              )}
            </Stack>
          </Paper>
        );
      })}

      <Stack spacing={1}>
        <Stack direction="row" spacing={1}>
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
          {canShare && (
            <Button
              variant="outlined"
              startIcon={<ShareIcon />}
              onClick={() =>
                shareText(
                  run.map((lane) => laneToText(lane, true)).join("\n\n"),
                  "Resultados — Crono Natación",
                )
              }
              sx={{
                "@media (max-width: 430px)": {
                  minWidth: 0,
                  px: 1.25,
                  "& .MuiButton-startIcon": { margin: 0 },
                },
              }}
            >
              <Box
                component="span"
                sx={{ "@media (max-width: 430px)": { display: "none" } }}
              >
                Compartir todo
              </Box>
            </Button>
          )}
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" fullWidth onClick={() => downloadCsv(run)}>
            Exportar CSV
          </Button>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => exportResultsPdf(run)}
          >
            Exportar PDF
          </Button>
        </Stack>
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
