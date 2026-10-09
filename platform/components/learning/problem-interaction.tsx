"use client";
import { lazy, Suspense, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { Problem } from "@/lib/curriculum/catalog";
import type { PlaybackRun } from "@/lib/curriculum/execution";
import {
  traceChallenges,
  matchesTraceAnswer,
} from "@/lib/learning/trace-challenge";
import { recordLearning } from "@/lib/product/mastery";
const Scene = lazy(() =>
  import("../curriculum/scene").then((m) => ({ default: m.Scene })),
);
import { ReadableCode } from "./readable-code";
import "./lesson-workspace.css";

export function WindowExercise({
  nums,
  k,
  average = true,
  learningId,
}: {
  nums: number[];
  k: number;
  average?: boolean;
  learningId?: string;
}) {
  const [left, setLeft] = useState(0),
    [answer, setAnswer] = useState(""),
    [checked, setChecked] = useState(false);
  const reduced = useReducedMotion();
  const total = nums
    .slice(left, left + k)
    .reduce((sum, value) => sum + value, 0);
  const expected = average ? total / k : total;
  const previous = left
    ? nums.slice(left - 1, left + k - 1).reduce((a, b) => a + b, 0)
    : null;
  return (
    <section
      className="launch-card window-exercise"
      aria-label="Move the window on your selected input"
    >
      <small>YOUR INPUT · MOVE THE WINDOW</small>
      <h3>Keep exactly {k} values inside the frame.</h3>
      <p>
        Select a starting index, then predict the {average ? "average" : "sum"}.
        The highlighted frame uses the input selected above.
      </p>
      <div className="window-strip">
        {nums.map((n, i) => (
          <motion.button
            key={i}
            aria-label={`Start window at index ${i}, value ${n}`}
            aria-pressed={left === i}
            disabled={i > nums.length - k}
            className={i >= left && i < left + k ? "inside" : ""}
            onClick={() => {
              setLeft(i);
              setAnswer("");
              setChecked(false);
            }}
            animate={{ y: !reduced && i >= left && i < left + k ? -4 : 0 }}
            transition={{ duration: reduced ? 0 : 0.3 }}
          >
            <strong>{n}</strong>
            <span>index {i}</span>
          </motion.button>
        ))}
      </div>
      <div className="launch-actions">
        <button
          disabled={left === 0}
          onClick={() => {
            setLeft((n) => n - 1);
            setChecked(false);
            setAnswer("");
          }}
        >
          ← Previous window
        </button>
        <button
          disabled={left >= nums.length - k}
          onClick={() => {
            setLeft((n) => n + 1);
            setChecked(false);
            setAnswer("");
          }}
        >
          Slide one place →
        </button>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setChecked(true);
          if (
            learningId &&
            answer.trim() &&
            Math.abs(Number(answer) - expected) < 1e-6
          )
            recordLearning(
              learningId,
              "exercise",
              `Predicted the window ${average ? "average" : "sum"} on the selected input`,
            );
        }}
      >
        <label>
          Your predicted {average ? "average" : "sum"}
          <input
            aria-label={`Predicted window ${average ? "average" : "sum"}`}
            type="number"
            step="any"
            required
            value={answer}
            onChange={(e) => {
              setAnswer(e.target.value);
              setChecked(false);
            }}
          />
        </label>
        <button>Check my prediction</button>
      </form>
      {checked && (
        <div className="launch-feedback" role="status">
          <strong>
            {answer.trim() && Math.abs(Number(answer) - expected) < 1e-6
              ? "Correct."
              : "Follow the calculation."}
          </strong>
          <p>
            {previous !== null
              ? `${previous} − (${nums[left - 1]}) + (${nums[left + k - 1]}) = ${total}`
              : `${nums
                  .slice(0, k)
                  .map((n) => `(${n})`)
                  .join(" + ")} = ${total}`}
            {average ? `; ${total} / ${k} = ${expected}` : ""}
          </p>
          <p>
            The best {average ? "average" : "sum"} over all windows is{" "}
            {Math.max(
              ...nums
                .slice(0, nums.length - k + 1)
                .map(
                  (_, i) =>
                    nums.slice(i, i + k).reduce((a, b) => a + b, 0) /
                    (average ? k : 1),
                ),
            )}
            .
          </p>
        </div>
      )}
    </section>
  );
}
export function ProblemInteraction({
  problem,
  run,
  input,
  source,
  language,
  busy,
  onRun,
}: {
  problem: Problem;
  run: PlaybackRun | null;
  input: Record<string, unknown>;
  source: string;
  language: string;
  busy: boolean;
  onRun: () => void;
}) {
  const questions = useMemo(() => traceChallenges(run?.frames ?? []), [run]);
  const [index, setIndex] = useState(0),
    [answer, setAnswer] = useState(""),
    [revealed, setRevealed] = useState(false),
    [message, setMessage] = useState("");
  const q = questions[Math.min(index, questions.length - 1)];
  const f = q && run?.frames[revealed ? q.after : q.before];
  const validWindow =
    problem.id === "maximum-average-subarray" &&
    Array.isArray(input.nums) &&
    input.nums.every((n) => typeof n === "number" && Number.isFinite(n)) &&
    Number.isInteger(input.k) &&
    Number(input.k) > 0 &&
    Number(input.k) <= input.nums.length;
  return (
    <>
      {validWindow && (
        <WindowExercise
          key={JSON.stringify(input)}
          nums={input.nums as number[]}
          k={Number(input.k)}
          learningId={problem.id}
        />
      )}
      <section className="launch-card actual-challenge">
        <small>{problem.title.toUpperCase()} · YOUR EXECUTION</small>
        <h3>Predict a real change.</h3>
        <p>
          Use your selected input and{" "}
          {language === "cpp"
            ? "C++"
            : language === "javascript"
              ? "JavaScript"
              : language === "java"
                ? "Java"
                : "Python"}{" "}
          code. Inspect the current state, predict the value, then reveal what
          the program recorded.
        </p>
        {!run ? (
          <button disabled={busy} onClick={onRun}>
            {busy
              ? "Recording your execution…"
              : "Prepare this problem’s exercise"}
          </button>
        ) : !q ? (
          <p>
            This run has no recorded value changes to predict. Try a different
            input or add trace checkpoints to your code.
          </p>
        ) : (
          <>
            <div className="challenge-workbench">
              <Suspense fallback={<p>Loading the recorded state…</p>}>
                <Scene
                  problem={problem}
                  frame={f}
                  input={input}
                  previous={revealed ? run.frames[q.before] : undefined}
                />
              </Suspense>
              <ReadableCode
                source={source}
                language={language}
                line={
                  run.frames[q.before].event === "line"
                    ? run.frames[q.before].line
                    : run.frames[q.after].line
                }
              />
            </div>
            <p>
              Challenge {Math.min(index + 1, questions.length)} /{" "}
              {questions.length} · Current <code>{q.name}</code>:{" "}
              <code>{JSON.stringify(run.frames[q.before].vars[q.name])}</code>
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (matchesTraceAnswer(answer, q.answer)) {
                  setMessage(
                    "Correct. Compare the new state with the highlighted operation.",
                  );
                  setRevealed(true);
                  recordLearning(
                    problem.id,
                    "exercise",
                    `Predicted ${q.name} in the current execution`,
                  );
                } else
                  setMessage(
                    "Try again: follow the highlighted operation using the current values, or reveal the recorded change.",
                  );
              }}
            >
              <label>
                What will {q.name} become at the next checkpoint?
                <input
                  aria-label="Predicted next value"
                  placeholder="Number, true/false, or JSON array"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  required
                  disabled={revealed}
                  maxLength={600}
                />
              </label>
              <div className="launch-actions">
                <button disabled={revealed}>Check prediction</button>
                <button
                  type="button"
                  disabled={revealed}
                  onClick={() => {
                    setRevealed(true);
                    setMessage(
                      "Change revealed. Explain why the program made this move.",
                    );
                  }}
                >
                  Reveal change
                </button>
              </div>
            </form>
            <p role="status">
              {message}
              {revealed && (
                <>
                  {" "}
                  <code>
                    {q.name}:{" "}
                    {JSON.stringify(run.frames[q.before].vars[q.name])} →{" "}
                    {q.answer}
                  </code>
                </>
              )}
            </p>
            {revealed && (
              <button
                onClick={() => {
                  setIndex((n) => (n + 1) % questions.length);
                  setRevealed(false);
                  setAnswer("");
                  setMessage("");
                }}
              >
                {index >= questions.length - 1
                  ? "Try these changes again"
                  : "Next change →"}
              </button>
            )}
          </>
        )}
      </section>
    </>
  );
}
