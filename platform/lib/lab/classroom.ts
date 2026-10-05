import type { PlaybackRun } from "../curriculum/execution";
import type { Language } from "../curriculum/playground";
import { validateProblemInput } from "../curriculum/validate";
export type LiveRoom = {
  id: string;
  host_id: string;
  class_id: string | null;
  title: string;
  join_code: string;
  run_id: string | null;
  step: number;
  playing: boolean;
  speed: number;
  ended: boolean;
  reveal_result: boolean;
  updated_at: string;
};
export type LiveRun = {
  id: string;
  session_id: string;
  problem_id: string;
  language: Language;
  code: string;
  input: Record<string, unknown>;
  run: PlaybackRun;
};
export type LivePoll = {
  id: string;
  session_id: string;
  question: string;
  options: string[];
  active: boolean;
  created_at: string;
};
export function roomStep(room: LiveRoom, count: number, now = Date.now()) {
  const elapsed =
    room.playing && !room.ended
      ? Math.max(0, now - Date.parse(room.updated_at))
      : 0;
  return Math.max(
    0,
    Math.min(
      Math.max(0, count - 1),
      room.step + Math.floor(elapsed / (850 / Number(room.speed))),
    ),
  );
}
export function shareableRun(source: PlaybackRun): PlaybackRun {
  const base = {
    ...source,
    frames: [],
    stdout: source.stdout?.slice(0, 16000),
  } as PlaybackRun;
  let bytes = new TextEncoder().encode(JSON.stringify(base)).length;
  if (bytes > 1000000)
    throw Error(
      "The result is too large for a classroom run. Try a smaller input.",
    );
  const frames = [];
  for (const frame of source.frames) {
    if (Object.keys(frame.vars).length > 100 || frame.stack.length > 100)
      throw Error(
        "This state has too many variables or calls for a classroom capture. Use a smaller teaching example.",
      );
    const size = new TextEncoder().encode(JSON.stringify(frame)).length + 1;
    if (frames.length >= 1199 || bytes + size > 2500000) break;
    frames.push(frame);
    bytes += size;
  }
  const truncated = frames.length < source.frames.length;
  return { ...base, frames, truncated: source.truncated || truncated };
}
export function validLiveRun(record: LiveRun) {
  if (
    !record ||
    !["python", "cpp", "java", "javascript"].includes(record.language) ||
    typeof record.code !== "string" ||
    record.code.length > 60000 ||
    validateProblemInput(record.problem_id, record.input) ||
    !record.run ||
    !Array.isArray(record.run.frames) ||
    record.run.frames.length < 1 ||
    record.run.frames.length > 1200
  )
    return false;
  return record.run.frames.every(
    (f) =>
      f &&
      Number.isInteger(f.line) &&
      f.line >= 0 &&
      typeof f.event === "string" &&
      typeof f.function === "string" &&
      f.vars &&
      Object.keys(f.vars).length <= 100 &&
      typeof f.vars === "object" &&
      !Array.isArray(f.vars) &&
      Array.isArray(f.stack) &&
      f.stack.length <= 100 &&
      f.stack.every(
        (s) => s && typeof s.name === "string" && Number.isInteger(s.line),
      ),
  );
}
