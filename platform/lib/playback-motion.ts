/** Bubble Sort's reference cadence: one logical step every 850 ms at 1×. */
export const PLAYBACK_SPEEDS = [0.5, 1, 1.5, 2, 4] as const;
export const STEP_MS = 850;
export function playbackSpeed(speed: number) {
  return Number.isFinite(speed) && speed > 0
    ? Math.max(0.25, Math.min(4, speed))
    : 1;
}
export function stepDuration(speed = 1) {
  return STEP_MS / playbackSpeed(speed);
}
/** Smooth movement, then a short hold to read the resulting state. */
export function stageTransition(speed = 1, reduced = false) {
  return {
    duration: reduced ? 0 : (stepDuration(speed) * 0.65) / 1000,
    ease: [0.65, 0, 0.35, 1] as [number, number, number, number],
  };
}
