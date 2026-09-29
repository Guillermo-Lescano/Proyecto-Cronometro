import { useState } from "react";
import type { ComponentType } from "react";
import Box from "@mui/material/Box";
import ConfigScreen from "./screens/ConfigScreen";
import RunScreen from "./screens/RunScreen";
import ResultsScreen from "./screens/ResultsScreen";
import type { ScreenName, ScreenProps } from "./types";
import { TimerStoreProvider } from "./store/TimerStoreContext";

const SCREENS: Record<ScreenName, ComponentType<ScreenProps>> = {
  config: ConfigScreen,
  run: RunScreen,
  results: ResultsScreen,
};

export default function App() {
  const [screen, setScreen] = useState<ScreenName>("config");
  const Screen = SCREENS[screen];

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        bgcolor: "background.default",
        color: "text.primary",
        px: { xs: 1.25, sm: 2 },
        pt: "env(safe-area-inset-top, 0px)",
        pb: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
      }}
    >
      <TimerStoreProvider>
        <Screen goTo={setScreen} />
      </TimerStoreProvider>
    </Box>
  );
}
