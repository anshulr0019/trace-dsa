import { validateFoundationInput } from "../foundations/input";
import { observeRun } from "../lab/diagnostics";
import type { Language } from "./playground";
import { validateProblemInput } from "./validate";
import { withExecutionBoundaries, type PlaybackRun } from "./execution";

export type RuntimeCapabilities = { server: boolean; languages: Language[] };
export type Submission = {
  language: string;
  code: string;
  input: Record<string, unknown>;
  problemId: string;
  automatic?: boolean;
};
export const browserLanguages: Language[] = [
  "python",
  "cpp",
  "java",
  "javascript",
];

export async function runtimeCapabilities(
  signal?: AbortSignal,
): Promise<RuntimeCapabilities> {
  try {
    const response = await fetch("/api/local-runtime", { signal });
    if (response.ok) {
      const value = (await response.json()) as {
        local?: boolean;
        available?: boolean;
        languages?: Language[];
      };
      if (value.local || value.available)
        return {
          server: true,
          languages: [
            ...new Set<Language>([
              ...(value.languages ?? ["python", "javascript", "cpp"]),
              "java",
            ]),
          ],
        };
    }
  } catch {
    signal?.throwIfAborted();
  }
  return { server: false, languages: browserLanguages };
}

function executeBrowser(
  payload: Submission,
  signal?: AbortSignal,
  onStage?: (stage: "loading" | "executing") => void,
): Promise<PlaybackRun> {
  onStage?.("loading");
  signal?.throwIfAborted();
  if (!browserLanguages.includes(payload.language as Language))
    return Promise.reject(Error("This language cannot run in the browser."));
  const error = payload.problemId.startsWith("foundation:")
    ? validateFoundationInput(payload.problemId, payload.input)
    : validateProblemInput(payload.problemId, payload.input);
  if (error) return Promise.reject(Error(error));
  if (!payload.code.trim() || payload.code.length > 60000)
    return Promise.reject(
      Error("Write a solution of at most 60,000 characters."),
    );
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      payload.language === "java"
        ? "/browser-runtime/java-runner.js"
        : "/browser-runtime/runner.js",
    );
    let timer: ReturnType<typeof setTimeout>;
    const finish = (error?: Error, run?: PlaybackRun) => {
      clearTimeout(timer);
      worker.terminate();
      signal?.removeEventListener("abort", abort);
      if (error) reject(error);
      else resolve(withExecutionBoundaries(run!, payload.input));
    };
    const abort = () =>
      finish(new DOMException("Run cancelled.", "AbortError"));
    signal?.addEventListener("abort", abort, { once: true });
    timer = setTimeout(
      () =>
        finish(
          Error(
            "The browser runtime could not load. Check your connection and try Run again.",
          ),
        ),
      ["cpp", "java"].includes(payload.language) ? 120000 : 60000,
    );
    worker.onmessage = ({ data }) => {
      if (data.type === "ready") {
        onStage?.("executing");
        clearTimeout(timer);
        const timeoutMs = Number(data.timeoutMs) || 6000;
        timer = setTimeout(
          () =>
            finish(
              Error(
                `Execution timed out (${timeoutMs / 1000} seconds). Try a smaller input or check your loop condition.`,
              ),
            ),
          timeoutMs,
        );
      } else if (data.type === "result") finish(undefined, data.run);
      else if (data.type === "error") finish(Error(data.error));
    };
    worker.onerror = (event) =>
      finish(
        Error(
          `The browser runtime could not start. ${event.message || "Reload this page and try again."}`,
        ),
      );
    worker.postMessage(payload);
  });
}

export function executeInBrowser(
  payload: Submission,
  signal?: AbortSignal,
  onStage?: (stage: "loading" | "executing") => void,
): Promise<PlaybackRun> {
  return observeRun(
    () => executeBrowser(payload, signal, onStage),
    payload,
    "browser",
  );
}

export async function executeSubmission(
  payload: Submission,
  capabilities: RuntimeCapabilities,
  signal?: AbortSignal,
  onStage?: (stage: "loading" | "executing") => void,
): Promise<PlaybackRun> {
  if (!capabilities.server || payload.language === "java")
    return executeInBrowser(payload, signal, onStage);
  onStage?.("executing");
  return observeRun(
    async () => {
      const response = await fetch("/api/local-runtime", {
        method: "POST",
        signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const run = (await response.json()) as PlaybackRun;
      if (!response.ok)
        throw Error(
          run.error ?? "Code execution is unavailable. Please try again.",
        );
      return run;
    },
    payload,
    "server",
  );
}
