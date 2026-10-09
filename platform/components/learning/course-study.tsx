"use client";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { CourseUnit } from "@/lib/learning/cs-course-content";
import type { LearningTrack } from "@/lib/learning/references";
import { courseBenchmarks } from "@/lib/learning/benchmarks";
import "./course-content.css";
export function CourseSources({ track }: { track: LearningTrack }) {
  return (
    <details className="course-sources">
      <summary>Three course references for this track</summary>
      <ul>
        {courseBenchmarks[track].map((s) => (
          <li key={s.url}>
            <a href={s.url} target="_blank" rel="noreferrer">
              {s.name} ↗
            </a>
            <p>{s.focus}</p>
            <small>{s.access}</small>
          </li>
        ))}
      </ul>
    </details>
  );
}
export function CourseStudy({
  id,
  unit,
  track,
  onExplore,
}: {
  id: string;
  unit: CourseUnit;
  track: LearningTrack;
  onExplore?: () => void;
}) {
  const [tab, setTab] = useState("concept"),
    [step, setStep] = useState(0),
    [answer, setAnswer] = useState(""),
    [hint, setHint] = useState(false),
    [revealed, setRevealed] = useState(false),
    [ready, setReady] = useState(false),
    [saved, setSaved] = useState(false),
    [checks, setChecks] = useState<number[]>([]);
  const reduced = useReducedMotion(),
    storage = `trace:course-study:${id}`;
  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem(storage) ?? "null");
      if (typeof data?.answer === "string")
        setAnswer(data.answer.slice(0, 6000));
      if (Array.isArray(data?.checks))
        setChecks(
          data.checks.filter(
            (n: unknown) =>
              typeof n === "number" &&
              Number.isInteger(n) &&
              n >= 0 &&
              n < unit.rubric.length,
          ),
        );
    } catch {}
    setReady(true);
  }, [storage, unit.rubric.length]);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(storage, JSON.stringify({ answer, checks }));
      window.dispatchEvent(new Event("trace:notebook"));
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }, [answer, checks, ready, storage]);
  const tabs = [
    ["concept", "Understand"],
    ["worked", "Worked solution"],
    ["compare", "Compare approaches"],
    ["practice", "Solve it yourself"],
  ];
  return (
    <section className="course-study" aria-label="Detailed course lesson">
      <header>
        <small>BUILD THE REASONING</small>
        <h2>Learn it, then solve it.</h2>
        <p>
          Work through the explanation and a separate paper example, then use
          the simulator to inspect the mechanism with your own input.
        </p>
      </header>
      <nav aria-label="Course lesson sections">
        {tabs.map(([value, label]) => (
          <button
            key={value}
            aria-pressed={tab === value}
            onClick={() => setTab(value)}
          >
            {label}
          </button>
        ))}
      </nav>
      <div className="course-study-body">
        {tab === "concept" && (
          <>
            <h3>Before you start</h3>
            <ul>
              {unit.prerequisites.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <h3>The mental model</h3>
            <p>{unit.concept}</p>
            <aside>
              <strong>A common mistake</strong>
              <p>{unit.misconception}</p>
            </aside>
            {onExplore && (
              <button className="course-action" onClick={onExplore}>
                Explore the visual lab ↓
              </button>
            )}
          </>
        )}
        {tab === "worked" && (
          <>
            <small>WORKED EXAMPLE · ITS OWN INPUT</small>
            <h3>{unit.worked.prompt}</h3>
            <ol className="course-step-progress" aria-label="Solution progress">
              {unit.worked.steps.map((s, i) => (
                <li key={i} className={i <= step ? "reached" : ""}>
                  Step {i + 1}
                </li>
              ))}
            </ol>
            <motion.div
              key={step}
              initial={{ opacity: reduced ? 1 : 0.4, y: reduced ? 0 : 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
              className="course-worked-step"
            >
              <span>
                STEP {step + 1} / {unit.worked.steps.length}
              </span>
              <p>{unit.worked.steps[step]}</p>
            </motion.div>
            <div className="course-step-controls">
              <button
                disabled={step === 0}
                onClick={() => setStep((n) => n - 1)}
              >
                ← Previous
              </button>
              <button
                disabled={step === unit.worked.steps.length - 1}
                onClick={() => setStep((n) => n + 1)}
              >
                Next reasoning step →
              </button>
            </div>
            {step === unit.worked.steps.length - 1 && (
              <aside className="course-answer">
                <strong>Conclusion</strong>
                <p>{unit.worked.answer}</p>
              </aside>
            )}
          </>
        )}
        {tab === "compare" && (
          <>
            <div className="course-approaches">
              <article>
                <small>STRAIGHTFORWARD APPROACH</small>
                <p>{unit.comparison.baseline}</p>
              </article>
              <article>
                <small>DEVELOP THE DESIGN</small>
                <p>{unit.comparison.improved}</p>
              </article>
            </div>
            <h3>What the improvement costs</h3>
            <p>{unit.comparison.tradeoff}</p>
            <h3>What must remain true</h3>
            <p>
              Use the lesson’s invariant below the simulator. Check that your
              improvement preserves it under the failures or boundaries named
              here.
            </p>
          </>
        )}
        {tab === "practice" && (
          <>
            <h3>Transfer the idea to another case</h3>
            <p>{unit.transfer.prompt}</p>
            <label className="course-response">
              Your reasoning
              <textarea
                rows={5}
                maxLength={6000}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="State your assumptions, work through the case, and justify the result."
              />
            </label>
            <small role="status">
              {saved
                ? "Saved on this browser"
                : "Work stays in this session if browser storage is unavailable."}
            </small>
            <div className="course-step-controls">
              <button aria-expanded={hint} onClick={() => setHint(!hint)}>
                {hint ? "Hide hint" : "Get a hint"}
              </button>
              <button
                aria-expanded={revealed}
                onClick={() => setRevealed(!revealed)}
              >
                {revealed
                  ? "Hide model reasoning"
                  : "Compare with model reasoning"}
              </button>
            </div>
            {hint && <p className="course-hint">{unit.transfer.hint}</p>}
            {revealed && (
              <aside className="course-answer">
                <strong>Model reasoning</strong>
                <p>{unit.transfer.solution}</p>
              </aside>
            )}
            <fieldset>
              <legend>
                Self-review: check only what your explanation demonstrates
              </legend>
              {unit.rubric.map((point, i) => (
                <label key={point}>
                  <input
                    type="checkbox"
                    checked={checks.includes(i)}
                    onChange={(e) =>
                      setChecks((c) =>
                        e.target.checked ? [...c, i] : c.filter((n) => n !== i),
                      )
                    }
                  />
                  {point}
                </label>
              ))}
            </fieldset>
          </>
        )}
      </div>
      <CourseSources track={track} />
    </section>
  );
}
