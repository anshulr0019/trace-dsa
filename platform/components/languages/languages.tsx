"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, BookOpen, Search, Code2, ArrowLeft } from "lucide-react";
import {
  languageTracks,
  libraryLessons,
  libraryLessonById,
  libraryURL,
  defaultLibraryInput,
  type LibraryLesson,
  type LibraryInput,
} from "@/lib/languages/catalog";
import {
  expectedLibraryOutput,
  libraryCases,
  sameLibraryOutput,
  validateLibraryInput,
} from "@/lib/languages/exercises";
import {
  readLibraryDraft,
  saveLibraryDraft,
  type LibraryDraft,
} from "@/lib/languages/storage";
import type { Language } from "@/lib/curriculum/playground";
import { executeInBrowser } from "@/lib/curriculum/runtime-client";
import type { PlaybackRun } from "@/lib/curriculum/execution";
import { readPreferences } from "@/lib/experience/preferences";
import {
  recordLearning,
  learningEvidence,
  learningStatus,
  reviewDue,
} from "@/lib/product/mastery";
import {
  LessonJourney,
  MasteryPanel,
  type JourneyStep,
} from "../learning/lesson-journey";
import { ProblemNotes } from "../product/notebook";
import { Editor } from "../curriculum/editor";
import { ReadableCode } from "../learning/readable-code";
import { useFramePlayback } from "../curriculum/use-frame-playback";
import { RoadmapDock } from "../curriculum/roadmap-dock";
import { RuntimeStatus } from "../learning/runtime-status";
import { ArrayStage } from "../curriculum/array-stage";
import "./languages.css";
const json = (value: unknown) => JSON.stringify(value, null, 2) ?? "undefined";
const stepNames: JourneyStep[] = [
  "Understand",
  "Watch",
  "Try",
  "Solve",
  "Review",
];
function LibraryLink({
  href,
  onNavigate,
  children,
  className,
}: {
  href: string;
  onNavigate: (url: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={className}
      aria-current={className === "selected" ? "page" : undefined}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        onNavigate(href);
      }}
    >
      {children}
    </a>
  );
}
export function Languages({
  onNavigate,
}: {
  onNavigate: (url: string) => void;
}) {
  const params = new URLSearchParams(location.search),
    requested = params.get("language");
  const language: Language = languageTracks.some((t) => t.id === requested)
    ? (requested as Language)
    : readPreferences().language;
  const unit = libraryLessonById[params.get("unit") ?? ""];
  const lesson = unit?.language === language ? unit : undefined;
  const reference = params.get("mode") === "reference";
  const [query, setQuery] = useState(""),
    [, refresh] = useState(0);
  useEffect(() => {
    const sync = () => refresh((n) => n + 1);
    window.addEventListener("trace:notebook", sync);
    window.addEventListener("trace:restore", sync);
    return () => {
      window.removeEventListener("trace:notebook", sync);
      window.removeEventListener("trace:restore", sync);
    };
  }, []);
  const track = languageTracks.find((t) => t.id === language)!;
  const units = libraryLessons.filter((l) => l.language === language);
  const completed = units.filter((l) =>
    learningEvidence(`library:${l.id}`).some(
      (e) => e.kind === "independent" || e.kind === "assisted",
    ),
  ).length;
  const next =
    units.find(
      (l) =>
        !learningEvidence(`library:${l.id}`).some(
          (e) => e.kind === "independent" || e.kind === "assisted",
        ),
    ) ?? units[0];
  const matches = units.filter((l) =>
    `${l.title} ${l.summary} ${l.syntax.join(" ")} ${l.topic}`
      .toLowerCase()
      .includes(query.toLowerCase().trim()),
  );
  return (
    <section className="language-library">
      <div className="language-heading">
        <div>
          <span className="premium-eyebrow">LANGUAGES & LIBRARIES</span>
          <h1>{lesson ? lesson.title : "Know the tools behind your code."}</h1>
          <p>
            {lesson
              ? lesson.summary
              : "Build the language skills that make an algorithm usable. Learn the tool, run it, then apply it to a problem."}
          </p>
        </div>
        <span className="language-version">
          {track.version}
          <small>
            {completed} / {units.length} exercises passed
          </small>
        </span>
      </div>
      <nav className="language-tracks" aria-label="Language tracks">
        {languageTracks.map((t) => (
          <LibraryLink
            key={t.id}
            href={libraryURL(t.id, lesson?.topic, reference)}
            onNavigate={onNavigate}
            className={t.id === language ? "selected" : ""}
          >
            {t.name}
            <small>{t.label}</small>
          </LibraryLink>
        ))}
      </nav>
      <div className="language-mode">
        <LibraryLink
          href={libraryURL(language, lesson?.topic)}
          onNavigate={onNavigate}
          className={!reference ? "selected" : ""}
        >
          <BookOpen size={15} />
          Guided learning
        </LibraryLink>
        <LibraryLink
          href={libraryURL(language, lesson?.topic, true)}
          onNavigate={onNavigate}
          className={reference ? "selected" : ""}
        >
          <Search size={15} />
          Quick reference
        </LibraryLink>
        <LibraryLink href="/?view=library" onNavigate={onNavigate}>
          All learning paths
        </LibraryLink>
      </div>
      {lesson ? (
        <LibraryLessonView
          key={lesson.id}
          lesson={lesson}
          reference={reference}
          onNavigate={onNavigate}
        />
      ) : (
        <>
          <div className="language-start">
            <div>
              <strong>{track.label}</strong>
              <p>{track.summary}</p>
            </div>
            <LibraryLink
              className="premium-button"
              href={libraryURL(language, next.topic)}
              onNavigate={onNavigate}
            >
              {completed ? "Continue learning" : "Start this track"}
              <ArrowRight size={16} />
            </LibraryLink>
          </div>
          <label className="language-search">
            <Search size={17} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find vector, Counter, priority_queue, sort…"
              aria-label="Search language lessons and APIs"
            />
          </label>
          {!matches.length && (
            <p role="status">
              No matching topic in {track.name}. Choose another language or try
              a container name.
            </p>
          )}
          {["Language foundations", "Collections", "Ordering & search"].map(
            (module) => {
              const rows = matches.filter((l) => l.module === module);
              if (!rows.length) return null;
              return (
                <section className="language-module" key={module}>
                  <div className="language-module-title">
                    <h2>{module}</h2>
                    <span>{rows.length} lessons</span>
                  </div>
                  <div className="language-lesson-list">
                    {rows.map((l) => (
                      <LibraryLink
                        key={l.id}
                        href={libraryURL(language, l.topic, reference)}
                        onNavigate={onNavigate}
                        className="language-lesson-card"
                      >
                        <span>
                          {String(units.indexOf(l) + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <h3>{l.title}</h3>
                          <p>{reference ? l.syntax[0] : l.summary}</p>
                        </div>
                        <small>
                          {reviewDue(learningEvidence(`library:${l.id}`))
                            ? "Due for revision"
                            : learningStatus(
                                learningEvidence(`library:${l.id}`),
                              )}
                        </small>
                        <ArrowRight size={16} />
                      </LibraryLink>
                    ))}
                  </div>
                </section>
              );
            },
          )}
        </>
      )}
    </section>
  );
}
function LibraryLessonView({
  lesson,
  reference,
  onNavigate,
}: {
  lesson: LibraryLesson;
  reference: boolean;
  onNavigate: (url: string) => void;
}) {
  const track = languageTracks.find((t) => t.id === lesson.language)!,
    units = libraryLessons.filter((l) => l.language === lesson.language);
  const initialStep = new URLSearchParams(location.search).get("step");
  const [step, setStep] = useState<JourneyStep>(
    reference
      ? "Review"
      : stepNames.includes(initialStep as JourneyStep)
        ? (initialStep as JourneyStep)
        : "Understand",
  );
  const [draft, setDraft] = useState<LibraryDraft>(() =>
    readLibraryDraft(lesson.id),
  );
  const [run, setRun] = useState<PlaybackRun | null>(null),
    [busy, setBusy] = useState(false),
    [stage, setStage] = useState("loading"),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const [prediction, setPrediction] = useState(""),
    [predictionResult, setPredictionResult] = useState(""),
    [hint, setHint] = useState(false),
    [reveal, setReveal] = useState(false),
    [caseResults, setCaseResults] = useState<
      {
        name: string;
        passed: boolean;
        actual: unknown;
        expected: unknown;
        error?: string;
      }[]
    >([]);
  const [speed, setSpeed] = useState(readPreferences().speed),
    [variable, setVariable] = useState("");
  const playback = useFramePlayback(run?.frames.length ?? 0, speed);
  const abort = useRef<AbortController | null>(null),
    revision = useRef(0),
    generation = useRef(0),
    task = useRef<"example" | "grade">("example");
  useEffect(
    () => () => {
      generation.current++;
      abort.current?.abort();
    },
    [],
  );
  useEffect(() => {
    const restore = () => {
      abort.current?.abort();
      generation.current++;
      setBusy(false);
      setDraft(readLibraryDraft(lesson.id));
      setRun(null);
      setCaseResults([]);
      setReveal(false);
      setHint(false);
      setPredictionResult("");
      playback.setPlaying(false);
    };
    window.addEventListener("trace:restore", restore);
    return () => window.removeEventListener("trace:restore", restore);
  }, [lesson.id]);
  const change = (patch: Partial<LibraryDraft>) => {
    const next = { ...draft, ...patch };
    revision.current++;
    setDraft(next);
    setMessage(
      saveLibraryDraft(lesson.id, next)
        ? "Draft saved on this device."
        : "Storage unavailable. This draft is kept for this visit.",
    );
    if (patch.example !== undefined || patch.inputText !== undefined) {
      setRun(null);
      playback.setPlaying(false);
      setPredictionResult("");
    }
    if (patch.solution !== undefined) setCaseResults([]);
  };
  const goStep = (next: JourneyStep) => {
    abort.current?.abort();
    generation.current++;
    setBusy(false);
    playback.setPlaying(false);
    setError("");
    setStep(next);
    const url = new URL(location.href);
    url.searchParams.set("step", next);
    history.replaceState(null, "", url.pathname + url.search);
  };
  function input(): LibraryInput {
    let value: unknown;
    try {
      value = JSON.parse(draft.inputText);
    } catch {
      throw Error(
        "Input is not valid JSON. Check quotes, commas, and brackets.",
      );
    }
    const invalid = validateLibraryInput(`library:${lesson.id}`, value);
    if (invalid) throw Error(invalid);
    return value as LibraryInput;
  }
  async function execute(
    code: string,
    data: LibraryInput,
    signal: AbortSignal,
  ) {
    return executeInBrowser(
      {
        language: lesson.language,
        code,
        input: data,
        problemId: `library:${lesson.id}`,
        automatic: lesson.language === "python",
      },
      signal,
      setStage,
    );
  }
  async function runExample(checkPrediction = false) {
    task.current = "example";
    abort.current?.abort();
    const control = new AbortController();
    abort.current = control;
    const token = ++generation.current,
      version = revision.current;
    setBusy(true);
    setError("");
    setRun(null);
    playback.setPlaying(false);
    setStage("loading");
    try {
      const data = input();
      const result = await execute(draft.example, data, control.signal);
      if (token !== generation.current || version !== revision.current) return;
      if (result.error) throw Error(result.error);
      setRun(result);
      playback.setStep(0);
      recordLearning(
        `library:${lesson.id}`,
        "watched",
        "Ran a standard-library example",
      );
      if (checkPrediction) {
        let guess: unknown;
        try {
          guess = JSON.parse(prediction);
        } catch {
          throw Error(
            "Prediction must be valid JSON: use double quotes around strings.",
          );
        }
        const correct = sameLibraryOutput(guess, result.result);
        setPredictionResult(
          correct
            ? "Correct. Your prediction matches the recorded output."
            : "That prediction differs from the recorded output. Compare the state and try another input.",
        );
        if (correct)
          recordLearning(
            `library:${lesson.id}`,
            "exercise",
            "Predicted an actual library example output",
          );
      }
    } catch (e) {
      if (token === generation.current && !control.signal.aborted)
        setError(e instanceof Error ? e.message : "Execution failed.");
    } finally {
      if (token === generation.current) setBusy(false);
    }
  }
  async function grade() {
    task.current = "grade";
    abort.current?.abort();
    const control = new AbortController();
    abort.current = control;
    const token = ++generation.current,
      version = revision.current;
    setBusy(true);
    setStage("loading");
    setError("");
    setCaseResults([]);
    playback.setPlaying(false);
    const results: typeof caseResults = [];
    try {
      for (const c of libraryCases) {
        const result = await execute(draft.solution, c.input, control.signal);
        if (token !== generation.current || version !== revision.current)
          return;
        const expected = expectedLibraryOutput(lesson.topic, c.input);
        results.push({
          name: c.name,
          passed: !result.error && sameLibraryOutput(result.result, expected),
          actual: result.result,
          expected,
          error: result.error ?? undefined,
        });
        setCaseResults([...results]);
        if (result.error) break;
      }
      if (
        results.length === libraryCases.length &&
        results.every((r) => r.passed)
      ) {
        recordLearning(
          `library:${lesson.id}`,
          draft.assisted ? "assisted" : "independent",
          `${results.length}/${libraryCases.length} language-library exercise cases passed`,
        );
        setMessage(
          draft.assisted
            ? "All cases passed with support."
            : "All cases passed. Independent solve recorded.",
        );
      } else
        setMessage(
          "Some cases failed. Inspect the feedback and revise your solution.",
        );
    } catch (e) {
      if (token === generation.current && !control.signal.aborted)
        setError(e instanceof Error ? e.message : "Execution failed.");
    } finally {
      if (token === generation.current) setBusy(false);
    }
  }
  const cancel = () => {
    generation.current++;
    abort.current?.abort();
    setBusy(false);
    setMessage("Run cancelled. Your draft is saved.");
  };
  const frame =
    run?.frames[Math.min(playback.step, (run?.frames.length ?? 1) - 1)];
  const vars = frame?.vars ?? { nums: defaultLibraryInput.nums };
  const keys = Object.keys(vars).filter((k) => k !== "data");
  const selected = keys.includes(variable)
    ? variable
    : keys.includes("answer")
      ? "answer"
      : keys.includes("result")
        ? "result"
        : keys[0];
  const value = vars[selected];
  return (
    <>
      <div className="language-unit-nav">
        <LibraryLink
          href={libraryURL(lesson.language, undefined, reference)}
          onNavigate={onNavigate}
        >
          <ArrowLeft size={14} /> {track.name} track
        </LibraryLink>
        <label>
          Lesson
          <select
            aria-label="Choose language lesson"
            value={lesson.id}
            onChange={(e) =>
              onNavigate(
                libraryURL(
                  lesson.language,
                  libraryLessonById[e.target.value].topic,
                  reference,
                ),
              )
            }
          >
            {units.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
        </label>
      </div>
      {!!lesson.prerequisites.length && (
        <p className="language-prerequisite">
          Before this lesson:{" "}
          <LibraryLink
            href={libraryURL(
              lesson.language,
              libraryLessonById[lesson.prerequisites[0]].topic,
            )}
            onNavigate={onNavigate}
          >
            {libraryLessonById[lesson.prerequisites[0]].title}
          </LibraryLink>
          . You can open any topic directly.
        </p>
      )}
      <LessonJourney active={step} onStep={goStep} />
      <RuntimeStatus
        busy={busy}
        stage={stage}
        error={error}
        onRetry={() =>
          task.current === "grade"
            ? grade()
            : runExample(step === "Try" && !!prediction.trim())
        }
        onCancel={cancel}
      />
      {error && (
        <pre role="alert" className="language-error">
          {error}
        </pre>
      )}

      {step === "Understand" && (
        <div className="language-understand">
          <article className="language-card">
            <small>THE IDEA</small>
            <h2>{lesson.title}</h2>
            <p>{lesson.explanation}</p>
            <h3>When to use it</h3>
            <p>{lesson.use}</p>
            <h3>Cost of this example</h3>
            <p>{lesson.costs}</p>
            <button className="premium-button" onClick={() => goStep("Watch")}>
              Run the example
              <ArrowRight size={16} />
            </button>
          </article>
          <article className="language-card">
            <small>KEEP THIS IN MIND</small>
            <h2>Common mistakes</h2>
            <ul>
              {lesson.pitfalls.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <h3>Syntax to recognise</h3>
            {lesson.syntax.map((s) => (
              <pre key={s}>
                <code>{s}</code>
              </pre>
            ))}
            <a href={lesson.docs} target="_blank" rel="noreferrer">
              Language documentation ↗
            </a>
          </article>
        </div>
      )}
      {(step === "Watch" || step === "Try") && (
        <>
          <div className="language-example-controls">
            <label>
              Example input
              <select
                aria-label="Choose library example"
                disabled={busy}
                onChange={(e) => {
                  if (e.target.value !== "custom")
                    change({
                      inputText: json(
                        libraryCases[Number(e.target.value)].input,
                      ),
                    });
                }}
                defaultValue="custom"
              >
                <option value="custom">Your current input</option>
                {libraryCases.map((c, i) => (
                  <option key={c.name} value={i}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="premium-button"
              disabled={busy}
              onClick={() => runExample()}
            >
              Run example
            </button>
            <button
              disabled={busy}
              onClick={() => change({ example: lesson.source })}
            >
              Restore example
            </button>
          </div>
          <details className="language-input">
            <summary>Edit input · nums, value, target, text</summary>
            <label>
              Input JSON
              <textarea
                aria-label="Library input JSON"
                value={draft.inputText}
                maxLength={8000}
                disabled={busy}
                onChange={(e) => change({ inputText: e.target.value })}
              />
            </label>
            <p>
              At most 32 integers in −1000…1000 and 40 ASCII characters. The
              exercise explains which fields this topic uses.
            </p>
          </details>
          {step === "Try" && (
            <section className="language-card language-prediction">
              <h2>Predict the result</h2>
              <p>{lesson.prediction}</p>
              <label>
                Your prediction
                <textarea
                  aria-label="Predicted library output"
                  value={prediction}
                  onChange={(e) => {
                    setPrediction(e.target.value);
                    setPredictionResult("");
                  }}
                  maxLength={8000}
                />
              </label>
              <button
                disabled={busy || !prediction.trim()}
                className="premium-button"
                onClick={() => runExample(true)}
              >
                Run & check prediction
              </button>
              <p role="status">{predictionResult}</p>
            </section>
          )}
          <div className="language-workbench">
            <section className="language-card language-state">
              <header>
                <h2>Recorded program state</h2>
                <small>
                  {frame
                    ? frame.event === "complete"
                      ? "Returned output"
                      : frame.event === "input"
                        ? "Input"
                        : `Checkpoint · line ${frame.line}`
                    : "Run to capture state"}
                </small>
              </header>
              <p className="language-model-note">
                These values come from your code. Library calls can happen
                between checkpoints; their internal operations are not animated.
              </p>
              {run && (
                <>
                  <label>
                    Inspect variable
                    <select
                      value={selected ?? ""}
                      aria-label="Inspect library variable"
                      onChange={(e) => setVariable(e.target.value)}
                    >
                      {keys.map((k) => (
                        <option key={k}>{k}</option>
                      ))}
                    </select>
                  </label>
                  {Array.isArray(value) &&
                  value.every((v) => typeof v !== "object") ? (
                    <ArrayStage
                      name={selected}
                      values={value}
                      state={{}}
                      duration={0.2}
                    />
                  ) : (
                    <pre
                      className="language-output"
                      aria-label="Recorded variable value"
                    >
                      {json(value)}
                    </pre>
                  )}
                  <details>
                    <summary>All recorded variables</summary>
                    <pre>{json(vars)}</pre>
                  </details>
                  <p>Returned value</p>
                  <pre aria-label="Library returned output">
                    {json(run.result)}
                  </pre>
                </>
              )}
              {!run && (
                <div className="language-empty">
                  <Code2 size={28} />
                  <p>
                    Run the example to inspect input, checkpoints, and output.
                  </p>
                </div>
              )}
            </section>
            <section className="language-code">
              <header>
                <h2>Editable example</h2>
                <small>{track.version}</small>
              </header>
              <p className="language-wrapper-note">
                solve(data) is Trace’s exercise entry point. The syntax
                reference shows the standard language APIs used inside it.
              </p>
              <Editor
                value={draft.example}
                language={lesson.language}
                onChange={(example) => change({ example })}
                line={frame?.line ?? 0}
                onRun={() => runExample()}
                readOnly={busy}
              />
            </section>
          </div>
          {run && (
            <RoadmapDock
              count={run.frames.length}
              step={playback.step}
              playing={playback.playing}
              speed={speed}
              disabled={busy}
              onToggle={() => {
                if (playback.step >= run.frames.length - 1) playback.setStep(0);
                playback.setPlaying(!playback.playing);
              }}
              onSeek={(n) => {
                playback.setPlaying(false);
                playback.setStep(n);
              }}
              onSpeed={setSpeed}
            />
          )}
          <div className="language-next">
            <button onClick={() => goStep(step === "Watch" ? "Try" : "Solve")}>
              {step === "Watch"
                ? "Predict a fresh example"
                : "Try the exercise"}
              <ArrowRight size={15} />
            </button>
          </div>
        </>
      )}
      {step === "Solve" && (
        <>
          <article className="language-card">
            <small>YOUR TURN</small>
            <h2>Use the library tool</h2>
            <p>{lesson.task}</p>
            <p>
              Implement solve(data) and return the result. Six cases check
              emptiness, duplicates, negative values, and ordering. The example
              editor and this solution are saved separately.
            </p>
            <details>
              <summary>Example contract</summary>
              <pre>{json(defaultLibraryInput)}</pre>
              <p>Expected return</p>
              <pre>
                {json(expectedLibraryOutput(lesson.topic, defaultLibraryInput))}
              </pre>
            </details>
          </article>
          <div className="language-code language-solution">
            <header>
              <h2>Your solution</h2>
              <span>
                {draft.assisted ? "Support used" : "Independent attempt"}
              </span>
            </header>
            <Editor
              value={draft.solution}
              language={lesson.language}
              line={0}
              onChange={(solution) => change({ solution })}
              onRun={grade}
              readOnly={busy}
            />
          </div>
          <div className="language-exercise-actions">
            <button className="premium-button" disabled={busy} onClick={grade}>
              Check all six cases
            </button>
            <button
              disabled={busy}
              onClick={() => {
                setHint(true);
                change({ assisted: true });
              }}
            >
              Show hint
            </button>
            <button
              disabled={busy}
              onClick={() => {
                setReveal(true);
                change({ assisted: true });
              }}
            >
              Compare a reference solution
            </button>
          </div>
          {hint && <p className="language-hint">{lesson.hint}</p>}
          {reveal && (
            <details open className="language-reference-solution">
              <summary>Reference solution · this attempt uses support</summary>
              <ReadableCode source={lesson.source} language={lesson.language} />
            </details>
          )}
          {!!caseResults.length && (
            <section className="language-card" aria-label="Exercise results">
              <h2>
                {caseResults.filter((r) => r.passed).length} /{" "}
                {libraryCases.length} cases passed
              </h2>
              {caseResults.map((r) => (
                <details
                  key={r.name}
                  open={
                    !r.passed &&
                    caseResults.findIndex((item) => !item.passed) ===
                      caseResults.indexOf(r)
                  }
                  className={r.passed ? "passed" : "failed"}
                >
                  <summary>
                    {r.passed ? "✓" : "×"} {r.name}
                  </summary>
                  {r.error ? (
                    <pre>{r.error}</pre>
                  ) : (
                    <>
                      <p>Expected</p>
                      <pre>{json(r.expected)}</pre>
                      <p>Your return</p>
                      <pre>{json(r.actual)}</pre>
                    </>
                  )}
                </details>
              ))}
            </section>
          )}
        </>
      )}
      {step === "Review" && (
        <div className="language-understand">
          <article className="language-card">
            <small>QUICK REFERENCE</small>
            <h2>{lesson.title}</h2>
            {lesson.syntax.map((s) => (
              <pre key={s}>
                <code>{s}</code>
              </pre>
            ))}
            <p>{lesson.explanation}</p>
            <h3>Costs and conditions</h3>
            <p>{lesson.costs}</p>
            <ul>
              {lesson.pitfalls.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <a href={lesson.docs} target="_blank" rel="noreferrer">
              Read the language documentation ↗
            </a>
          </article>
          <article className="language-card">
            <small>SAME GOAL, DIFFERENT TOOLS</small>
            <h2>Compare languages</h2>
            <p>
              The exercise goal stays the same. Syntax, mutation rules, and
              available APIs differ.
            </p>
            {languageTracks.map((t) => (
              <LibraryLink
                key={t.id}
                href={libraryURL(t.id, lesson.topic, true)}
                onNavigate={onNavigate}
                className="language-compare-link"
              >
                <strong>{t.name}</strong>
                <span>
                  {libraryLessonById[`${t.id}-${lesson.topic}`].title}
                </span>
                <ArrowRight size={15} />
              </LibraryLink>
            ))}
            <button onClick={() => goStep("Solve")}>
              Check your understanding with code →
            </button>
          </article>
        </div>
      )}
      <p className="language-save" role="status">
        {message || "Drafts and learning evidence are saved on this device."}
      </p>
      <div className="language-next">
        <LibraryLink
          href={`/?view=curriculum&problem=${lesson.problem}&language=${lesson.language}`}
          onNavigate={onNavigate}
        >
          Apply this tool to a DSA problem
          <ArrowRight size={16} />
        </LibraryLink>
        {units[units.indexOf(lesson) + 1] && (
          <LibraryLink
            href={libraryURL(
              lesson.language,
              units[units.indexOf(lesson) + 1].topic,
            )}
            onNavigate={onNavigate}
          >
            Next: {units[units.indexOf(lesson) + 1].title}
            <ArrowRight size={16} />
          </LibraryLink>
        )}
      </div>
      <MasteryPanel
        id={`library:${lesson.id}`}
        onPractice={() => goStep("Solve")}
      />
      <ProblemNotes id={`library:${lesson.id}`} />
    </>
  );
}
