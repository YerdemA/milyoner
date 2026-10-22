"use client";

import { useSyncExternalStore } from "react";
import { isMuted, setMuted, subscribeMuted } from "@/lib/sound";

/** Mute state shared by every component (persisted in localStorage). */
export function useSoundMuted() {
  const muted = useSyncExternalStore(subscribeMuted, isMuted, () => false);
  return { muted, setMuted };
}
