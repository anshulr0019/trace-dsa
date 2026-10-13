"use client";
import { useEffect, useState } from "react";
import { Monitor, Moon, Settings, Sun } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  applyTheme,
  readThemePreference,
  themeStorageKey,
  type ThemePreference,
} from "@/lib/experience/theme";
import {
  defaultPreferences,
  refreshPreferences,
  savePreferences,
  type Preferences,
} from "@/lib/experience/preferences";
import {
  clearLearningProgress,
  notebookEntry,
  notebookSnapshot,
  restoreNotebook,
} from "@/lib/product/notebook";
import { usePreferences } from "./use-preferences";
import "./theme.css";
import "./settings.css";

const categories = [
  "Appearance",
  "Learning",
  "Playback",
  "Code editor",
  "Practice",
  "Data & privacy",
  "Keyboard & help",
] as const;
type Category = (typeof categories)[number];
type BooleanPreference = {
  [K in keyof Preferences]: Preferences[K] extends boolean ? K : never;
}[keyof Preferences];
const themes = [
  {
    value: "light",
    label: "Light",
    description: "A bright, quiet workspace.",
    Icon: Sun,
  },
  {
    value: "dark",
    label: "Dark",
    description: "Trace’s original dark canvas.",
    Icon: Moon,
  },
  {
    value: "system",
    label: "System",
    description: "Follow your device’s appearance.",
    Icon: Monitor,
  },
] as const;
function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="setting-row">
      <span>
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}
function Choice({
  label,
  description,
  value,
  onChange,
  options,
}: {
  label: string;
  description?: string;
  value: string | number;
  onChange: (v: string) => void;
  options: readonly (readonly [string | number, string])[];
}) {
  return (
    <label className="setting-row">
      <span>
        <strong>{label}</strong>
        {description && <small>{description}</small>}
      </span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}
export function ThemeSettings({
  onNavigate,
}: {
  onNavigate?: (path: string) => void;
}) {
  const [open, setOpen] = useState(false),
    [category, setCategory] = useState<Category>("Appearance");
  const [theme, setTheme] = useState<ThemePreference>("dark"),
    [message, setMessage] = useState("");
  const [backup, setBackup] = useState<Record<string, string> | null>(null),
    [confirm, setConfirm] = useState<"preferences" | "progress" | null>(null);
  const p = usePreferences();
  useEffect(() => {
    const sync = () => {
      const next = readThemePreference();
      setTheme(next);
      applyTheme(next);
    };
    sync();
    const media = matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", sync);
    const storage = (e: StorageEvent) => {
      if (e.key === themeStorageKey || e.key === null) sync();
    };
    window.addEventListener("storage", storage);
    window.addEventListener("trace:restore", sync);
    return () => {
      media.removeEventListener("change", sync);
      window.removeEventListener("storage", storage);
      window.removeEventListener("trace:restore", sync);
    };
  }, []);
  function chooseTheme(next: ThemePreference) {
    setTheme(next);
    applyTheme(next);
    try {
      localStorage.setItem(themeStorageKey, next);
      setMessage("Saved on this device.");
    } catch {
      setMessage("Storage is unavailable. This change applies for this visit.");
    }
  }
  function update<K extends keyof Preferences>(key: K, value: Preferences[K]) {
    setMessage(
      savePreferences({ ...p, [key]: value })
        ? "Saved on this device."
        : "Storage is unavailable. This change applies for this visit.",
    );
  }
  function navigate(path: string) {
    setOpen(false);
    if (onNavigate) onNavigate(path);
    else location.assign(path);
  }
  function changeCategory(next: Category) {
    setCategory(next);
    setMessage("");
    setConfirm(null);
    setBackup(null);
  }
  function clearProgress() {
    try {
      clearLearningProgress();
      setMessage(
        "Learning progress cleared. Notes and code drafts are still saved.",
      );
      setConfirm(null);
    } catch {
      setMessage(
        "Browser storage is unavailable. Progress could not be cleared.",
      );
    }
  }
  const toggle = (
    key: BooleanPreference,
    label: string,
    description: string,
  ) => (
    <Toggle
      label={label}
      description={description}
      checked={p[key]}
      onChange={(v) => update(key, v)}
    />
  );
  return (
    <>
      <button
        className="theme-settings-button"
        aria-label="Settings"
        onClick={() => {
          setOpen(true);
          window.dispatchEvent(new Event("trace:pause"));
        }}
      >
        <Settings size={17} />
        <span>Settings</span>
      </button>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) {
            setConfirm(null);
            setBackup(null);
          }
        }}
      >
        <DialogContent className="trace-settings-dialog">
          <DialogHeader>
            <DialogTitle>Your learning workspace.</DialogTitle>
            <DialogDescription>
              Set your defaults. Changes apply immediately and are saved on this
              device.
            </DialogDescription>
          </DialogHeader>
          <div className="settings-layout">
            <nav aria-label="Settings categories">
              {categories.map((c) => (
                <button
                  key={c}
                  aria-current={category === c ? "page" : undefined}
                  onClick={() => changeCategory(c)}
                >
                  {c}
                </button>
              ))}
            </nav>
            <section
              className="settings-content"
              aria-label={`${category} settings`}
            >
              <h3>{category}</h3>
              {category === "Appearance" && (
                <>
                  <fieldset className="theme-options">
                    <legend>Theme</legend>
                    {themes.map(({ value, label, description, Icon }) => (
                      <label key={value} className="theme-option">
                        <input
                          type="radio"
                          name="trace-theme"
                          value={value}
                          checked={theme === value}
                          onChange={() => chooseTheme(value)}
                        />
                        <Icon size={19} />
                        <span>
                          <strong>{label}</strong>
                          <small>{description}</small>
                        </span>
                      </label>
                    ))}
                  </fieldset>
                  <Choice
                    label="Interface text size"
                    value={p.textSize}
                    onChange={(v) =>
                      update("textSize", v as Preferences["textSize"])
                    }
                    options={[
                      ["standard", "Standard"],
                      ["large", "Large"],
                    ]}
                  />
                  <Choice
                    label="Motion"
                    description="System respects your device’s reduced-motion preference."
                    value={p.reducedMotion}
                    onChange={(v) =>
                      update("reducedMotion", v as Preferences["reducedMotion"])
                    }
                    options={[
                      ["system", "Follow device"],
                      ["reduce", "Reduce motion"],
                    ]}
                  />
                </>
              )}
              {category === "Learning" && (
                <>
                  <Choice
                    label="Default programming language"
                    description="Used for new lessons. Saved drafts and explicit lesson links take precedence."
                    value={p.language}
                    onChange={(v) =>
                      update("language", v as Preferences["language"])
                    }
                    options={[
                      ["python", "Python 3"],
                      ["cpp", "C++17"],
                      ["java", "Java"],
                      ["javascript", "JavaScript"],
                    ]}
                  />
                  <Choice
                    label="Starting page"
                    description="Where Trace opens when you visit its home address."
                    value={p.startPage}
                    onChange={(v) =>
                      update("startPage", v as Preferences["startPage"])
                    }
                    options={[
                      ["home", "Home"],
                      ["library", "Learn"],
                      ["languages", "Languages & libraries"],
                      ["curriculum", "Practice roadmap"],
                      ["cs", "Computer science"],
                      ["notebook", "My notebook"],
                      ["progress", "My progress"],
                    ]}
                  />
                  {toggle(
                    "beginner",
                    "Beginner pace",
                    "Start roadmap lessons at half speed with beginner guidance.",
                  )}
                  {toggle(
                    "explanations",
                    "Step explanations",
                    "Show the explanation beneath each visualization.",
                  )}
                </>
              )}
              {category === "Playback" && (
                <>
                  <Choice
                    label="Default playback speed"
                    description="Lesson controls can change the speed for the current session."
                    value={p.speed}
                    onChange={(v) => update("speed", Number(v))}
                    options={[0.5, 1, 1.5, 2, 4].map((v) => [v, `${v}×`])}
                  />
                  {toggle(
                    "autoFocus",
                    "Focus when playing",
                    "Expand the playback surface when you press Play.",
                  )}
                  {toggle(
                    "pauseAtDecisions",
                    "Pause at decision checkpoints",
                    "In algorithm lessons, stop at available prediction checkpoints to consider the next move.",
                  )}
                  {toggle(
                    "pointerLabels",
                    "Pointer labels",
                    "Show names above moving pointers in foundation visualizations.",
                  )}
                </>
              )}
              {category === "Code editor" && (
                <>
                  <Choice
                    label="Editor font size"
                    value={p.editorSize}
                    onChange={(v) => update("editorSize", Number(v))}
                    options={[12, 13, 14, 16, 18, 20].map((v) => [
                      v,
                      `${v} px`,
                    ])}
                  />
                  <Choice
                    label="Tab size"
                    value={p.tabSize}
                    onChange={(v) => update("tabSize", Number(v))}
                    options={[2, 4, 8].map((v) => [v, `${v} spaces`])}
                  />
                  {toggle(
                    "wordWrap",
                    "Word wrap",
                    "Wrap long lines in code editors and source views.",
                  )}
                  {toggle(
                    "lineNumbers",
                    "Line numbers",
                    "Show source-line numbers beside your code.",
                  )}
                  {toggle(
                    "highlightLine",
                    "Execution highlighting",
                    "Highlight the source line being executed.",
                  )}
                </>
              )}
              {category === "Practice" && (
                <>
                  {toggle(
                    "predict",
                    "Predict the next move",
                    "Enable prediction checkpoints by default in algorithm lessons.",
                  )}
                  <Choice
                    label="Hints"
                    description="Hidden keeps the hint controls out of practice until you enable them here."
                    value={p.hintVisibility}
                    onChange={(v) =>
                      update(
                        "hintVisibility",
                        v as Preferences["hintVisibility"],
                      )
                    }
                    options={[
                      ["available", "Available on request"],
                      ["hidden", "Hide hint controls"],
                    ]}
                  />
                  {toggle(
                    "practiceTimer",
                    "Practice timer",
                    "Show elapsed active time in a practice session. No time limit.",
                  )}
                  <Choice
                    label="Reference comparison"
                    description="Choose when a proven approach can be revealed in practice."
                    value={p.solutionReveal}
                    onChange={(v) =>
                      update(
                        "solutionReveal",
                        v as Preferences["solutionReveal"],
                      )
                    }
                    options={[
                      ["after-attempt", "After a checked attempt"],
                      ["on-demand", "On request"],
                    ]}
                  />
                </>
              )}
              {category === "Data & privacy" && (
                <>
                  <p className="settings-description">
                    Preferences, progress, drafts, and notes are saved in this
                    browser. Back up your work before clearing browser data. A
                    backup contains your code and notes; keep it private.
                  </p>
                  <div className="settings-actions">
                    <button
                      onClick={() => {
                        try {
                          const url = URL.createObjectURL(
                            new Blob(
                              [
                                JSON.stringify(
                                  { version: 1, data: notebookSnapshot() },
                                  null,
                                  2,
                                ),
                              ],
                              { type: "application/json" },
                            ),
                          );
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = "trace-backup.json";
                          a.click();
                          setTimeout(() => URL.revokeObjectURL(url), 1000);
                          setMessage("Backup exported.");
                        } catch {
                          setMessage(
                            "Could not read saved work from browser storage.",
                          );
                        }
                      }}
                    >
                      Export backup
                    </button>
                    <label className="settings-import">
                      Import backup
                      <input
                        type="file"
                        accept=".json,application/json"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          e.target.value = "";
                          if (!file) return;
                          try {
                            if (file.size > 6000000)
                              throw Error("Backup must be smaller than 6 MB.");
                            const v = JSON.parse(await file.text());
                            if (
                              v.version !== 1 ||
                              !v.data ||
                              typeof v.data !== "object" ||
                              Array.isArray(v.data) ||
                              Object.keys(v.data).some(
                                (k) => !notebookEntry.test(k),
                              )
                            )
                              throw Error("Invalid Trace backup.");
                            setBackup(v.data);
                            setMessage(
                              `Ready to restore ${Object.keys(v.data).length} saved entries. Matching entries will be replaced.`,
                            );
                          } catch (err) {
                            setBackup(null);
                            setMessage(
                              err instanceof Error
                                ? err.message
                                : "Invalid backup.",
                            );
                          }
                        }}
                      />
                    </label>
                  </div>
                  {backup && (
                    <div className="settings-confirm">
                      <p>
                        Restore this backup? Matching notes, code drafts,
                        progress, and preferences will be replaced.
                      </p>
                      <button
                        onClick={() => {
                          try {
                            restoreNotebook(backup);
                            refreshPreferences();
                            setBackup(null);
                            setMessage("Backup restored.");
                          } catch (err) {
                            setMessage(
                              err instanceof Error
                                ? err.message
                                : "Could not restore this backup.",
                            );
                          }
                        }}
                      >
                        Confirm restore
                      </button>
                      <button
                        onClick={() => {
                          setBackup(null);
                          setMessage("");
                        }}
                      >
                        Cancel restore
                      </button>
                    </div>
                  )}
                  <div className="settings-actions">
                    <button onClick={() => setConfirm("preferences")}>
                      Reset settings
                    </button>
                    <button
                      className="settings-danger"
                      onClick={() => setConfirm("progress")}
                    >
                      Clear learning progress
                    </button>
                  </div>
                  {confirm && (
                    <div className="settings-confirm">
                      <p>
                        {confirm === "preferences"
                          ? "Restore default settings and dark appearance? Your learning progress and drafts stay saved."
                          : "Clear recorded progress, mastery, and practice attempts on this device? Export a backup first if you may need these records again."}
                      </p>
                      <button
                        onClick={() => {
                          if (confirm === "progress") clearProgress();
                          else {
                            savePreferences({ ...defaultPreferences });
                            chooseTheme("dark");
                            setConfirm(null);
                            setMessage("Default settings restored.");
                          }
                        }}
                      >
                        {confirm === "progress"
                          ? "Confirm clear progress"
                          : "Confirm reset settings"}
                      </button>
                      <button onClick={() => setConfirm(null)}>Cancel</button>
                    </div>
                  )}
                  <p className="settings-description">
                    Lesson links may include shared code and inputs. Code
                    execution uses the browser runtimes on this deployment.
                    Optional account, classroom, or AI features use their
                    configured services when you choose them.
                  </p>
                </>
              )}
              {category === "Keyboard & help" && (
                <>
                  <dl className="settings-shortcuts">
                    <div>
                      <dt>Find a lesson or workspace</dt>
                      <dd>⌘ / Ctrl + K</dd>
                    </div>
                    <div>
                      <dt>Play or pause a foundation lesson</dt>
                      <dd>Space</dd>
                    </div>
                    <div>
                      <dt>Step through a foundation lesson</dt>
                      <dd>← / →</dd>
                    </div>
                    <div>
                      <dt>Run code in the roadmap editor</dt>
                      <dd>⌘ / Ctrl + Enter</dd>
                    </div>
                    <div>
                      <dt>Close a dialog or exit focus</dt>
                      <dd>Esc</dd>
                    </div>
                  </dl>
                  <p className="settings-description">
                    Playback shortcuts work outside text inputs and open
                    dialogs.
                  </p>
                  <div className="settings-actions">
                    <button onClick={() => navigate("/?view=notebook")}>
                      Open my notebook
                    </button>
                    <a
                      href="https://github.com/anshulr0019/trace-dsa/issues/new"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Report an issue ↗
                    </a>
                  </div>
                </>
              )}
              <p className="settings-save-note" role="status">
                {message || "Preferences are saved on this device."}
              </p>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
