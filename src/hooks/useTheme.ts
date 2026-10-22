"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_THEME, getTheme, setTheme, subscribeTheme } from "@/lib/theme";

/** Current color theme, shared by every component (persisted in localStorage). */
export function useTheme() {
  const theme = useSyncExternalStore(subscribeTheme, getTheme, () => DEFAULT_THEME);
  return { theme, setTheme };
}
