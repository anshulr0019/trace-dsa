"use client";
import {stepDuration} from "@/lib/playback-motion";
import { useCallback, useEffect, useRef, useState, type SetStateAction } from "react";
import { useMotionValue } from "motion/react";

type PlaybackState = { step: number; target: number; playing: boolean; active: boolean };
/** One clock drives every visual track. Only completed transitions commit a snapshot. */
export function usePlayback(count: number, speed: number, gate?: (step: number) => boolean) {
  const [state, setState] = useState<PlaybackState>({ step: 0, target: 0, playing: false, active: false });
  const current = useRef(state);
  const countRef = useRef(count);
  countRef.current = count;
  const gateRef = useRef(gate);
  gateRef.current = gate;
  const phase = useMotionValue(1);
  const update = useCallback((next: PlaybackState) => { current.current = next; setState(next); }, []);
  const seek = useCallback((action: SetStateAction<number>) => {
    const n = typeof action === "function" ? action(current.current.step) : action;
    const step = Math.max(0, n);
    phase.set(1);
    update({ step, target: step, playing: false, active: false });
  }, [phase, update]);
  const setPlaying = useCallback((action: SetStateAction<boolean>) => {
    const s = current.current;
    const playing = typeof action === "function" ? action(s.playing) : action;
    if (!playing) { update({ ...s, playing: false, active: false }); return; }
    const count = countRef.current;
    const step = s.step >= count - 1 ? 0 : s.step;
    if (gateRef.current?.(step)) { update({ ...s, playing: false, active: false }); return; }
    const target = s.target !== s.step && s.step === step ? s.target : Math.min(step + 1, count - 1);
    if (s.target === s.step || s.step !== step) phase.set(0);
    update({ step, target, playing: true, active: true });
  }, [phase, update]);
  const move = useCallback((n: number) => {
    const s = current.current;
    const target = Math.max(0, Math.min(n, countRef.current - 1));
    if (target === s.step) { seek(target); return; }
    if (target > s.step && gateRef.current?.(s.step)) return;
    phase.set(0);
    update({ step: s.step, target, playing: false, active: true });
  }, [phase, seek, update]);
  useEffect(() => {
    if (!state.active) return;
    let id = 0;
    let last: number | undefined;
    const tick = (now: number) => {
      if (document.hidden) { last = undefined; id = requestAnimationFrame(tick); return; }
      const delta = last === undefined ? 0 : Math.min(now - last, 80);
      last = now;
      const p = Math.min(1, phase.get() + delta / (stepDuration(speed)));
      phase.set(p);
      if (p === 1) {
        const s = current.current;
        const step = s.target;
        if (!s.playing || step >= count - 1 || gateRef.current?.(step)) {
          update({ step, target: step, playing: false, active: false });
          return;
        }
        update({ step, target: step + 1, playing: true, active: true });
        phase.set(0);
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [state.active, speed, count, phase, update]);
  return { ...state, phase, setStep: seek, seek, move, setPlaying };
}
