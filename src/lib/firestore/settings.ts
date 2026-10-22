import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DEFAULT_SETTINGS, validateTimeLimit } from "@/lib/validation";
import type { AppSettings } from "@/types";

const settingsRef = doc(db, "settings", "app");

/** Falls back to DEFAULT_SETTINGS when the document (or a field) does not exist yet. */
export async function getSettings(): Promise<AppSettings> {
  const snap = await getDoc(settingsRef);
  const data = snap.data() ?? {};
  return {
    defaultTimeLimitSec:
      typeof data.defaultTimeLimitSec === "number"
        ? data.defaultTimeLimitSec
        : DEFAULT_SETTINGS.defaultTimeLimitSec,
  };
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const error = validateTimeLimit(settings.defaultTimeLimitSec);
  if (error) throw new Error(error);
  await setDoc(settingsRef, { defaultTimeLimitSec: settings.defaultTimeLimitSec });
}
