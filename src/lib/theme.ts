// Color themes. The palettes live in globals.css under [data-theme="..."]; this file only
// knows the ids, the Turkish labels and how the choice is stored (per computer, localStorage).

export const THEMES = [
  { id: "gece", label: "Gece", hint: "Koyu tema, projeksiyon için önerilir" },
  { id: "gunduz", label: "Gündüz", hint: "Açık tema, aydınlık ekranlar için" },
  { id: "neon", label: "Neon", hint: "Canlı mor, pembe ve turkuaz" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export const DEFAULT_THEME: ThemeId = "gece";
const THEME_KEY = "bilgi-yarismasi.theme";

const listeners = new Set<() => void>();

function isThemeId(value: unknown): value is ThemeId {
  return THEMES.some((t) => t.id === value);
}

/** The theme on <html> is the source of truth (set before paint by THEME_INIT_SCRIPT). */
export function getTheme(): ThemeId {
  const current = document.documentElement.dataset.theme;
  return isThemeId(current) ? current : DEFAULT_THEME;
}

export function setTheme(id: ThemeId) {
  document.documentElement.dataset.theme = id;
  try {
    localStorage.setItem(THEME_KEY, id);
  } catch {
    // Storage blocked: the theme still applies until the page is closed.
  }
  listeners.forEach((l) => l());
}

export function nextTheme(id: ThemeId): ThemeId {
  const i = THEMES.findIndex((t) => t.id === id);
  return THEMES[(i + 1) % THEMES.length].id;
}

export function subscribeTheme(listener: () => void) {
  listeners.add(listener);
  // Another tab (e.g. the admin panel) changed the theme.
  const onStorage = (e: StorageEvent) => {
    if (e.key === THEME_KEY && isThemeId(e.newValue)) {
      document.documentElement.dataset.theme = e.newValue;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Runs in <head> before the first paint so the saved theme never flashes. */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});if(${JSON.stringify(
  THEMES.map((t) => t.id),
)}.indexOf(t)>-1)document.documentElement.dataset.theme=t}catch(e){}`;
