"use client";
import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import {
  applyPreferences,
  defaultPreferences,
  preferenceEvent,
  preferencesKey,
  readPreferences,
} from "@/lib/experience/preferences";
export function usePreferences() {
  const [preferences, setPreferences] = useState(defaultPreferences);
  useEffect(() => {
    const sync = () => {
      const p = readPreferences();
      applyPreferences(p);
      setPreferences(p);
    };
    sync();
    const storage = (e: StorageEvent) => {
      if (e.key === preferencesKey || e.key === null) sync();
    };
    window.addEventListener(preferenceEvent, sync);
    window.addEventListener("storage", storage);
    window.addEventListener("trace:restore", sync);
    return () => {
      window.removeEventListener(preferenceEvent, sync);
      window.removeEventListener("storage", storage);
      window.removeEventListener("trace:restore", sync);
    };
  }, []);
  return preferences;
}
export function useTraceReducedMotion() {
  const system = useReducedMotion();
  const p = usePreferences();
  return p.reducedMotion === "reduce" || !!system;
}
