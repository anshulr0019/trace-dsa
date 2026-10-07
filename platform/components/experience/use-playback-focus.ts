"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import "./playback-focus.css";
/** Enter once per Play/resume, after layout settles. Never chase the user on each frame. */
export function usePlaybackFocus(playing: boolean, identity: unknown) {
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
    if (playing) focus();
  }, [playing, focus, identity]);
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
