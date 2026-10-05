"use client";
import { useEffect, useRef, useState } from "react";
import type { Problem } from "@/lib/curriculum/catalog";
import type { Language } from "@/lib/curriculum/playground";
import type { PlaybackRun } from "@/lib/curriculum/execution";
import {
  executeSubmission,
  type RuntimeCapabilities,
} from "@/lib/curriculum/runtime-client";
import { suite, referenceCode } from "@/lib/practice/evaluate";
import { matchesAnswer, lessons } from "@/lib/curriculum/learning";
import { saveMistake } from "@/lib/lab/study";
import { Scene, display } from "@/components/curriculum/scene";
type Checked = {
  id: string;
  label: string;
  input: Record<string, unknown>;
  expected: unknown;
  run: PlaybackRun;
  passed: boolean;
};
export function FindMistake({
  problem,
  language,
  code,
  runtime,
  disabled,
  onInspect,
}: {
  problem: Problem;
  language: Language;
  code: string;
  runtime: RuntimeCapabilities | null;
  disabled: boolean;
  onInspect: (input: Record<string, unknown>, run: PlaybackRun) => void;
}) {
  const [rows, setRows] = useState<Checked[]>([]),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [reference, setReference] = useState<PlaybackRun | null>(null),
    [compare, setCompare] = useState(false),
    [mineStep, setMine] = useState(0),
    [refStep, setRef] = useState(0),
    [note, setNote] = useState("");
  const controller = useRef<AbortController | null>(null),
    sequence = useRef(0),
    inFlight = useRef(false);
  useEffect(() => {
    setRows([]);
    setReference(null);
    setCompare(false);
    controller.current?.abort();
    sequence.current++;
    inFlight.current = false;
    setBusy(false);
    return () => {
      controller.current?.abort();
      sequence.current++;
      inFlight.current = false;
    };
  }, [problem.id, language, code]);
  const failed = rows.find((r) => !r.passed),
    tests = suite(problem.id);
  async function check() {
    if (!runtime || inFlight.current) return;
    inFlight.current = true;
    controller.current = new AbortController();
    const n = ++sequence.current;
    setBusy(true);
    setRows([]);
    setReference(null);
    setCompare(false);
    setMessage("Checking authored examples and practice cases…");
    try {
      for (const c of tests) {
        controller.current.signal.throwIfAborted();
        let run: PlaybackRun;
        try {
          run = await executeSubmission(
            {
              language,
              code,
              input: c.input,
              problemId: problem.id,
              automatic: true,
            },
            runtime,
            controller.current.signal,
          );
        } catch (err) {
          if (controller.current.signal.aborted) throw err;
          run = {
            frames: [],
            result: null,
            error: err instanceof Error ? err.message : String(err),
          };
        }
        if (n !== sequence.current) return;
        let passed = false;
        try {
          passed =
            !run.error &&
            matchesAnswer(problem, c.input, c.expected, run.result);
        } catch {}
        const row = { ...c, run, passed };
        setRows((v) => [...v, row]);
        if (!passed) {
          setMessage(
            "Found the first failing case in this suite. Inspect its actual execution and compare the result.",
          );
          return;
        }
      }
      setMessage(
        "All eight cases passed. These checks cover the authored suite; additional inputs may reveal other issues.",
      );
    } catch (err) {
      if (n === sequence.current)
        setMessage(
          controller.current.signal.aborted
            ? "Check cancelled."
            : err instanceof Error
              ? err.message
              : String(err),
        );
    } finally {
      if (n === sequence.current) {
        setBusy(false);
        inFlight.current = false;
      }
    }
  }
  async function compareReference() {
    if (!failed || !runtime || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    controller.current = new AbortController();
    const n = ++sequence.current;
    try {
      const run = await executeSubmission(
        {
          language,
          code: referenceCode(problem.id, language),
          input: failed.input,
          problemId: problem.id,
          automatic: false,
        },
        runtime,
        controller.current.signal,
      );
      if (n !== sequence.current) return;
      if (
        run.error ||
        !matchesAnswer(problem, failed.input, failed.expected, run.result)
      )
        throw Error(
          "The reference did not match this case. Report this example for review.",
        );
      setReference(run);
      setMine(0);
      setRef(0);
      setCompare(true);
      setMessage(
        "Both captures use the same failing input. Their intermediate states can differ because their approaches differ.",
      );
    } catch (err) {
      if (n === sequence.current)
        setMessage(err instanceof Error ? err.message : String(err));
    } finally {
      if (n === sequence.current) {
        setBusy(false);
        inFlight.current = false;
      }
    }
  }
  return (
    <details className="product-card find-mistake">
      <summary>Find my mistake · inspect a failing case</summary>
      <p>
        Check your current code against the five learning examples and three
        practice cases. The check stops at the first failure so you can
        investigate it.
      </p>
      <div className="product-actions">
        <button
          disabled={busy || disabled || !runtime?.languages.includes(language)}
          onClick={() => void check()}
        >
          Check my code
        </button>
        {busy && (
          <button onClick={() => controller.current?.abort()}>
            Cancel check
          </button>
        )}
        <small>
          {rows.length} / {tests.length} cases checked
        </small>
      </div>
      <div className="case-check-list">
        {rows.map((r) => (
          <div key={r.id}>
            <span className={r.passed ? "check-pass" : "check-fail"}>
              {r.passed ? "Passed" : "Needs attention"}
            </span>
            <span>{r.label}</span>
          </div>
        ))}
      </div>
      {failed && (
        <>
          <h3>{failed.label}</h3>
          <pre>{JSON.stringify(failed.input, null, 2)}</pre>
          <div className="answer-comparison">
            <div>
              <small>Expected for this input</small>
              <code>{display(failed.expected)}</code>
            </div>
            <div>
              <small>Your returned result</small>
              <code>{display(failed.run.result).slice(0, 4000)}</code>
            </div>
          </div>
          {failed.run.error && <p className="check-fail">{failed.run.error}</p>}
          <p>
            {lessons[problem.id].idea} {problem.caveat}
          </p>
          <div className="product-actions">
            <button
              disabled={disabled || busy}
              onClick={() => onInspect(failed.input, failed.run)}
            >
              Load failing input & trace
            </button>
            <button
              disabled={disabled || busy}
              onClick={() => void compareReference()}
            >
              Compare with reference execution
            </button>
          </div>
          <label>
            What caused the mistake?
            <textarea
              value={note}
              maxLength={2000}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          <button
            onClick={() => {
              try {
                saveMistake({
                  problemId: problem.id,
                  language,
                  code,
                  input: failed.input,
                  expected: failed.expected,
                  actual: failed.run.result,
                  error: failed.run.error ?? null,
                  note:
                    note.trim() ||
                    "Revisit this input and explain why the returned result differs.",
                });
                setMessage("Saved to your mistake journal.");
              } catch {
                setMessage(
                  "Browser storage is full. Keep a copy of this case.",
                );
              }
            }}
          >
            Save to mistake journal
          </button>
        </>
      )}
      {compare && failed && reference && (
        <div className="comparison-grid">
          <section>
            <h3>Your recorded execution</h3>
            <input
              aria-label="Your failing execution step"
              type="range"
              min={0}
              max={Math.max(0, failed.run.frames.length - 1)}
              value={mineStep}
              onChange={(e) => setMine(Number(e.target.value))}
            />
            <Scene
              problem={problem}
              input={failed.input}
              frame={failed.run.frames[mineStep]}
              previous={failed.run.frames[mineStep - 1]}
              language={language}
            />
            <small>
              State {mineStep + 1} of {failed.run.frames.length}
            </small>
          </section>
          <section>
            <h3>Verified reference execution</h3>
            <input
              aria-label="Reference execution step"
              type="range"
              min={0}
              max={Math.max(0, reference.frames.length - 1)}
              value={refStep}
              onChange={(e) => setRef(Number(e.target.value))}
            />
            <Scene
              problem={problem}
              input={failed.input}
              frame={reference.frames[refStep]}
              previous={reference.frames[refStep - 1]}
              language={language}
            />
            <small>
              State {refStep + 1} of {reference.frames.length}
            </small>
          </section>
        </div>
      )}
      <p role="status">{message}</p>
    </details>
  );
}
