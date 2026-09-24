import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { LocalStore, RemoteStore, localStoragePersistence, type FhirStore } from "../core/store";
import { DEFAULT_WEIGHTS, type Weights } from "../core/triage";

export const OAH_SANDBOX_URL = "https://sandbox.hl7europe.eu/oneaquahealth/fhir";
/** In dev, go through the Vite proxy: the sandbox's CORS headers are duplicated, which browsers
 * reject. See vite.config.ts and the README. */
export const OAH_SANDBOX = import.meta.env.DEV ? "/oah-fhir" : OAH_SANDBOX_URL;
export const SANDBOX_REACHABLE_FROM_BROWSER = import.meta.env.DEV;
const SETTINGS_KEY = "streamlink.settings.v1";
const STORE_KEY = "streamlink.store.v1";

export type Role = "volunteer" | "coordinator";
export type Mode = "local" | "oah";

interface Settings {
  mode: Mode;
  volunteerId: string;
  role: Role;
  weights: Weights;
  tourDone?: boolean;
}

function loadSettings(): Settings {
  const fallback: Settings = { mode: "local", volunteerId: `vol-${Math.random().toString(36).slice(2, 8)}`, role: "coordinator", weights: DEFAULT_WEIGHTS };
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "null");
    return s ? { ...fallback, ...s, weights: { ...DEFAULT_WEIGHTS, ...(s.weights ?? {}) } } : fallback;
  } catch {
    return fallback;
  }
}

function saveSettings(s: Settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    /* private mode: settings live for this session only */
  }
}

const localStore = new LocalStore(localStoragePersistence(STORE_KEY));
const remoteStore = new RemoteStore(OAH_SANDBOX, "OneAquaHealth FHIR sandbox (HL7 Europe)");

interface Toast {
  id: number;
  text: string;
  tone: "ok" | "error" | "info";
  leaving?: boolean;
}

const TOAST_VISIBLE_MS = 5200;
const TOAST_FADE_MS = 650;

interface AppState extends Settings {
  store: FhirStore;
  localStore: LocalStore;
  version: number; // bump to reload data after writes
  refresh(): void;
  update(patch: Partial<Settings>): void;
  toasts: Toast[];
  toast(text: string, tone?: Toast["tone"]): void;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [version, setVersion] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((s) => {
      const next = { ...s, ...patch };
      saveSettings(next);
      return next;
    });
    if (patch.mode) setVersion((v) => v + 1);
  }, []);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  const toast = useCallback((text: string, tone: Toast["tone"] = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, text, tone }]);
    // Mark it leaving first so it can fade out, then drop it once the animation is done.
    setTimeout(() => setToasts((t) => t.map((x) => (x.id === id ? { ...x, leaving: true } : x))), TOAST_VISIBLE_MS);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), TOAST_VISIBLE_MS + TOAST_FADE_MS);
  }, []);

  const value = useMemo<AppState>(() => ({
    ...settings,
    store: settings.mode === "oah" ? remoteStore : localStore,
    localStore,
    version,
    refresh,
    update,
    toasts,
    toast,
  }), [settings, version, refresh, update, toasts, toast]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp outside provider");
  return v;
}

/** Hash router: "#/site/C1" → ["site", "C1"]. */
export function useRoute(): string[] {
  const [hash, setHash] = useState(() => location.hash);
  useEffect(() => {
    const on = () => setHash(location.hash);
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return hash.replace(/^#\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
}

export const go = (path: string) => {
  location.hash = path.startsWith("#") ? path : `#${path}`;
  window.scrollTo({ top: 0 });
};
