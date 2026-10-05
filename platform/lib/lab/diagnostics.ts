import { cloud } from "../product/cloud";
import { readLocal } from "./storage";
import type { Submission } from "../curriculum/runtime-client";
import type { PlaybackRun } from "../curriculum/execution";
export type RunRecord = {
  id: string;
  at: string;
  problemId: string;
  language: string;
  durationMs: number;
  runtime: "browser" | "server";
  status: "completed" | "error" | "cancelled";
  frames: number;
  truncated: boolean;
  error: string | null;
  code: string;
  input: Record<string, unknown>;
  resultPreview: string;
};
const key = "trace:diagnostics:runs";
export function runRecords() {
  const value = readLocal<RunRecord[]>(key, []);
  return Array.isArray(value) ? value : [];
}
export async function observeRun(
  execute: () => Promise<PlaybackRun>,
  payload: Submission,
  runtime: "browser" | "server",
) {
  const start = performance.now();
  let run: PlaybackRun | undefined, failure: unknown;
  try {
    run = await execute();
    return run;
  } catch (e) {
    failure = e;
    throw e;
  } finally {
    try {
      const message =
        failure instanceof Error
          ? failure.message
          : failure
            ? String(failure)
            : (run?.error ?? null);
      const entry: RunRecord = {
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        problemId: payload.problemId,
        language: payload.language,
        durationMs: Math.round(performance.now() - start),
        runtime,
        status:
          failure instanceof DOMException && failure.name === "AbortError"
            ? "cancelled"
            : message
              ? "error"
              : "completed",
        frames: run?.frames.length ?? 0,
        truncated: !!run?.truncated,
        error: message?.slice(0, 2000) ?? null,
        code: payload.code.slice(0, 60000),
        input: payload.input,
        resultPreview: (JSON.stringify(run?.result) ?? "").slice(0, 4000),
      };
      const rows = [entry, ...runRecords()].slice(0, 25);
      while (JSON.stringify(rows).length > 2000000) rows.pop();
      localStorage.setItem(key, JSON.stringify(rows));
      window.dispatchEvent(new Event("trace:diagnostics"));
      if (cloud) {
        void cloud.auth
          .getSession()
          .then(({ data }) => {
            if (
              data.session &&
              localStorage.getItem(
                `trace:health:optin:${data.session.user.id}`,
              ) === "on"
            )
              void cloud!
                .from("site_run_events")
                .insert({
                  user_id: data.session.user.id,
                  problem_id: entry.problemId,
                  language: entry.language,
                  status: entry.status,
                  duration_ms: entry.durationMs,
                })
                .then(() => {});
          })
          .catch(() => {});
      }
    } catch {
      /* Observability must not change execution behavior or expose learner code. */
    }
  }
}
