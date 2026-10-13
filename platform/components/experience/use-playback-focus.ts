"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import "./playback-focus.css";
import { usePreferences } from "./use-preferences";
/** Enter once per Play/resume, after layout settles. Never chase the user on each frame. */
export function usePlaybackFocus(playing: boolean, identity: unknown) {
  const preferences = usePreferences();
  const ref = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false),
    [focusRequest, setFocusRequest] = useState(0);
  const focus = useCallback(() => {
    setFocused(true);
    setFocusRequest((n) => n + 1);
  }, []);
  useEffect(() => {
    setFocused(false);
  }, [identity]);
  useEffect(() => {
    if (playing && preferences.autoFocus) focus();
  }, [playing, focus, identity, preferences.autoFocus]);
  useEffect(() => {
    const enter = () => {
      if (ref.current) focus();
    };
    const exit = () => setFocused(false);
    window.addEventListener("trace:focus", enter);
    window.addEventListener("trace:unfocus", exit);
    return () => {
      window.removeEventListener("trace:focus", enter);
      window.removeEventListener("trace:unfocus", exit);
    };
  }, [focus]);
  useEffect(() => {
    if (!focusRequest || !focused) return;
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() =>
        ref.current?.scrollIntoView({ block: "start", behavior: "instant" }),
      );
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [focusRequest, focused]);
  useEffect(() => {
    if (!focused) return;
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFocused(false);
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [focused]);
  return { ref, focused, focusRequest, focus, setFocused };
}
