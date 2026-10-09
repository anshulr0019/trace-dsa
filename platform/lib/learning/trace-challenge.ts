import type { PlaybackFrame } from "../curriculum/execution";
export function traceChallenges(frames: PlaybackFrame[]) {
  const result: {
    before: number;
    after: number;
    name: string;
    answer: string;
  }[] = [];
  for (let i = 1; i < frames.length && result.length < 12; i++) {
    if (["complete", "error", "return"].includes(frames[i].event)) continue;
    const change = Object.entries(frames[i].vars)
      .filter(
        ([key, value]) =>
          !["data", "input", "answer"].includes(key) &&
          key in frames[i - 1].vars &&
          JSON.stringify(value) !== JSON.stringify(frames[i - 1].vars[key]) &&
          JSON.stringify(value)?.length <= 400,
      )
      .sort(
        ([a], [b]) =>
          Number(
            ["i", "j", "k", "row", "col", "left", "right", "mid"].includes(a),
          ) -
          Number(
            ["i", "j", "k", "row", "col", "left", "right", "mid"].includes(b),
          ),
      )[0];
    if (change)
      result.push({
        before: i - 1,
        after: i,
        name: change[0],
        answer: JSON.stringify(change[1]),
      });
  }
  return result;
}
export function matchesTraceAnswer(answer: string, expected: string) {
  try {
    return JSON.stringify(JSON.parse(answer)) === expected;
  } catch {
    return answer.trim() === expected;
  }
}
