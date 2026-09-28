"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type SetStateAction,
} from "react";

/** One bounded playback clock, suspended while the document is hidden. */
export function useFramePlayback(count: number, speed: number) {
  const [step, setCurrent] = useState(0),
    [playing, setPlaying] = useState(false);
  const elapsed = useRef(0);
  const setStep = useCallback(
    (next: SetStateAction<number>) => {
      elapsed.current = 0;
      setCurrent((old) =>
        Math.max(
          0,
          Math.min(
            Math.max(0, count - 1),
            typeof next === "function" ? next(old) : next,
          ),
        ),
      );
    },
    [count],
  );
  useEffect(() => {
    if (!playing) return;
    if (count < 2 || step >= count - 1) {
      setPlaying(false);
      return;
    }
    let id = 0,
      last: number | undefined;
    const tick = (now: number) => {
      if (document.hidden) {
        last = undefined;
        id = requestAnimationFrame(tick);
        return;
      }
      elapsed.current += last === undefined ? 0 : Math.min(now - last, 100);
      last = now;
      if (elapsed.current >= 850 / speed) {
        elapsed.current = 0;
        setCurrent((old) => Math.min(count - 1, old + 1));
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [count, playing, speed, step]);
  return { step, playing, setStep, setPlaying };
}
