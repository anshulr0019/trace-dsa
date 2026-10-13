export type Preferences = {
  language: "python" | "cpp" | "java" | "javascript";
  startPage:
    | "home"
    | "library"
    | "languages"
    | "curriculum"
    | "cs"
    | "notebook"
    | "progress";
  textSize: "standard" | "large";
  reducedMotion: "system" | "reduce";
  speed: number;
  autoFocus: boolean;
  pauseAtDecisions: boolean;
  pointerLabels: boolean;
  explanations: boolean;
  beginner: boolean;
  editorSize: number;
  tabSize: number;
  wordWrap: boolean;
  lineNumbers: boolean;
  highlightLine: boolean;
  predict: boolean;
  hintVisibility: "available" | "hidden";
  practiceTimer: boolean;
  solutionReveal: "after-attempt" | "on-demand";
};
export const preferencesKey = "trace:preferences";
export const preferenceEvent = "trace:preferences-changed";
export const defaultPreferences: Preferences = {
  language: "python",
  startPage: "home",
  textSize: "standard",
  reducedMotion: "system",
  speed: 1,
  autoFocus: true,
  pauseAtDecisions: false,
  pointerLabels: true,
  explanations: true,
  beginner: false,
  editorSize: 13,
  tabSize: 4,
  wordWrap: false,
  lineNumbers: true,
  highlightLine: true,
  predict: false,
  hintVisibility: "available",
  practiceTimer: false,
  solutionReveal: "after-attempt",
};
const choices: Partial<Record<keyof Preferences, readonly unknown[]>> = {
  language: ["python", "cpp", "java", "javascript"],
  startPage: [
    "home",
    "library",
    "languages",
    "curriculum",
    "cs",
    "notebook",
    "progress",
  ],
  textSize: ["standard", "large"],
  reducedMotion: ["system", "reduce"],
  speed: [0.5, 1, 1.5, 2, 4],
  editorSize: [12, 13, 14, 16, 18, 20],
  tabSize: [2, 4, 8],
  hintVisibility: ["available", "hidden"],
  solutionReveal: ["after-attempt", "on-demand"],
};
export function validPreferences(value: unknown): value is Preferences {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  return (
    Object.keys(v).every((k) => k in defaultPreferences) &&
    Object.entries(defaultPreferences).every(([k, d]) => {
      const allowed = choices[k as keyof Preferences];
      return allowed ? allowed.includes(v[k]) : typeof v[k] === typeof d;
    })
  );
}
let sessionPreferences: Preferences | undefined;
export function readPreferences(): Preferences {
  if (typeof window === "undefined") return defaultPreferences;
  if (sessionPreferences) return sessionPreferences;
  try {
    const raw = localStorage.getItem(preferencesKey);
    if (raw) {
      const v = JSON.parse(raw);
      if (validPreferences(v)) return v;
    }
    const lang = localStorage.getItem("trace:language");
    return {
      ...defaultPreferences,
      ...(choices.language!.includes(lang)
        ? { language: lang as Preferences["language"] }
        : {}),
    };
  } catch {
    return sessionPreferences ?? defaultPreferences;
  }
}
export function applyPreferences(p: Preferences) {
  const root = document.documentElement;
  root.dataset.textSize = p.textSize;
  root.dataset.motion = p.reducedMotion;
  root.dataset.pointerLabels = String(p.pointerLabels);
  root.dataset.explanations = String(p.explanations);
  root.dataset.lineNumbers = String(p.lineNumbers);
  root.dataset.highlightLine = String(p.highlightLine);
  root.dataset.wordWrap = String(p.wordWrap);
  root.dataset.hints = p.hintVisibility;
  root.style.setProperty("--trace-editor-size", `${p.editorSize}px`);
  root.style.setProperty("--trace-tab-size", String(p.tabSize));
}
export function savePreferences(p: Preferences): boolean {
  if (!validPreferences(p)) throw Error("Invalid learning preferences.");
  let saved = true;
  try {
    localStorage.setItem(preferencesKey, JSON.stringify(p));
  } catch {
    saved = false;
  }
  sessionPreferences = saved ? undefined : p;
  applyPreferences(p);
  window.dispatchEvent(new Event(preferenceEvent));
  return saved;
}
export function clearSessionPreferences() {
  sessionPreferences = undefined;
}
export function refreshPreferences() {
  sessionPreferences = undefined;
  applyPreferences(readPreferences());
  window.dispatchEvent(new Event(preferenceEvent));
}
