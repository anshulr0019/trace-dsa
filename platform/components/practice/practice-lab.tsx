"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  Check,
  Code2,
  Lightbulb,
  Play,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  X,
} from "lucide-react";
import { patterns, problems, type Problem } from "@/lib/curriculum/catalog";
import { lessons } from "@/lib/curriculum/learning";
import {
  levels,
  practiceCases,
  starterCode,
  type PracticeLevel,
} from "@/lib/practice/cases";
import {
  confidence,
  type Attempt,
  type Grade,
  type PracticeRun,
  type Proposal,
  type Review,
} from "@/lib/practice/types";
import type { Language } from "@/lib/curriculum/playground";
import { Editor } from "../curriculum/editor";
import { TracePlayer } from "./trace-player";
import "./practice.css";
import {executeInBrowser} from "@/lib/curriculum/runtime-client";
import {browserPractice} from "@/lib/practice/browser-practice";

const historyKey = (id: string) => `trace:practice:attempts:${id}`;
function readAttempts(id: string): Attempt[] {
  try {
    const v = JSON.parse(localStorage.getItem(historyKey(id)) ?? "[]");
    return Array.isArray(v)
      ? v
          .filter(
            (a) =>
              a &&
              typeof a.score === "number" &&
              typeof a.caseId === "string" &&
              typeof a.at === "string",
          )
          .slice(-30)
      : [];
  } catch {
    return [];
  }
}
export function PracticeLab({
  problem,
  language,
  onLanguage,
  onProblem,
}: {
  problem: Problem;
  language: Language;
  onLanguage: (l: Language) => void;
  onProblem: (id: string) => void;
}) {
  const [level, setLevel] = useState<PracticeLevel>("guided"),
    [attempts, setAttempts] = useState<Attempt[]>([]);
  const [capabilities, setCapabilities] = useState({
    execution: false,
    browser: false,
    ai: false,
    checked: false,
    progress: "device",
    signedIn: true,
  });
  const [storageWarning, setStorageWarning] = useState("");
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`trace:practice:level:${problem.id}`);
      if (levels.some((l) => l.id === saved)) setLevel(saved as PracticeLevel);
    } catch {}
    setAttempts(readAttempts(problem.id));
    const c = new AbortController();
    fetch(`/api/practice?problemId=${encodeURIComponent(problem.id)}`, {
      signal: c.signal,
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((raw) => {
        const v = raw as {
          execution?: boolean;
          ai?: boolean;
          progress?: string;
          signedIn?: boolean;
          attempts?: Attempt[];
        };
        setCapabilities({
          execution: !!v.execution || language !== "cpp",
          browser: !v.execution,
          ai: !!v.execution && !!v.ai,
          checked: true,
          progress: v.execution ? v.progress ?? "device" : "device",
          signedIn: v.signedIn !== false,
        });
        if (v.execution && v.progress === "account" && v.attempts) setAttempts(v.attempts);
      })
      .catch(() => {
        if (!c.signal.aborted)
          setCapabilities({
            execution: language !== "cpp",
            browser: true,
            ai: false,
            checked: true,
            progress: "device",
            signedIn: true,
          });
      });
    return () => c.abort();
  }, [problem.id, language]);
  function chooseLevel(next: PracticeLevel) {
    setLevel(next);
    try {
      localStorage.setItem(`trace:practice:level:${problem.id}`, next);
    } catch {}
  }
  const progress = confidence(attempts),
    reduced = useReducedMotion();
  function record(a: Attempt) {
    setAttempts((old) => {
      const next = [...old, a].slice(-30);
      try {
        localStorage.setItem(historyKey(problem.id), JSON.stringify(next));
      } catch {
        setStorageWarning(
          "Browser storage is full or unavailable. Progress will last for this visit only.",
        );
      }
      return next;
    });
  }
  const related = problems.filter(
    (p) => p.group === problem.group && p.id !== problem.id,
  );
  return (
    <motion.section
      className="practice-lab"
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="practice-intro">
        <div>
          <div className="eyebrow mint">PUT THE PATTERN TO WORK</div>
          <h2>Make it your own.</h2>
          <p>
            Start with a prediction. Write a solution. Build confidence one
            attempt at a time.
          </p>
        </div>
        <div className="confidence-card">
          <Trophy size={19} />
          <div>
            <strong>{progress.label}</strong>
            <span>
              {attempts.length} recorded attempts ·{" "}
              {capabilities.progress === "account"
                ? "your account"
                : "this browser"}
            </span>
          </div>
          <div className="confidence-track">
            <motion.i
              initial={false}
              animate={{ width: `${progress.value}%` }}
            />
          </div>
        </div>
      </div>
      <p className="confidence-description">{progress.description}</p>
      {storageWarning && (
        <p role="status" className="practice-error">
          {storageWarning}
        </p>
      )}
      <div className="practice-levels" role="group" aria-label="Practice level">
        {levels.map((l) => (
          <button
            key={l.id}
            aria-pressed={l.id === level}
            onClick={() => chooseLevel(l.id)}
          >
            <strong>{l.label}</strong>
            <span>{l.description}</span>
          </button>
        ))}
      </div>
      <PracticeSession
        key={`${problem.id}:${language}:${level}`}
        problem={problem}
        level={level}
        language={language}
        onLanguage={onLanguage}
        capabilities={capabilities}
        onAttempt={record}
        onNextLevel={() =>
          chooseLevel(level === "guided" ? "independent" : "challenge")
        }
      />
      <div className="practice-bottom">
        <section>
          <h3>Keep building the pattern</h3>
          <p>
            Try a different {patterns[problem.group - 1].toLowerCase()} problem
            when you are ready.
          </p>
          {related.map((p) => (
            <button
              className="related-practice"
              key={p.id}
              onClick={() => onProblem(p.id)}
            >
              <span>
                <small>{p.stage}</small>
                {p.title}
              </span>
              <ArrowRight size={17} />
            </button>
          ))}
        </section>
        <section>
          <h3>Your recent attempts</h3>
          {attempts.length ? (
            <ol className="attempt-history">
              {attempts
                .slice(-5)
                .reverse()
                .map((a) => (
                  <li key={a.id}>
                    <span className={a.score === 100 ? "attempt-pass" : ""}>
                      {a.score === 100 ? (
                        <Check size={14} />
                      ) : (
                        <Target size={14} />
                      )}
                    </span>
                    <div>
                      <strong>
                        {a.level === "guided"
                          ? "Prediction"
                          : a.level === "challenge"
                            ? "Challenge"
                            : "Independent solve"}{" "}
                        · {a.score}/100
                      </strong>
                      <small>
                        {a.assisted ? "With help" : "Without hints"} ·{" "}
                        {a.language} · {new Date(a.at).toLocaleDateString()}
                      </small>
                    </div>
                  </li>
                ))}
            </ol>
          ) : (
            <p className="practice-empty">
              Your first attempt starts here. Mistakes are part of learning.
            </p>
          )}
          <small className="practice-footnote">
            Confidence is a learning indicator based on your recorded attempts,
            not a competitive ranking.
          </small>
        </section>
      </div>
    </motion.section>
  );
}

type Draft = {
  code: string;
  caseIndex: number;
  hints: number;
  assisted: boolean;
  explanation: string;
  backup: string | null;
};
function PracticeSession({
  problem: p,
  language,
  level,
  onLanguage,
  capabilities,
  onAttempt,
  onNextLevel,
}: {
  problem: Problem;
  language: Language;
  level: PracticeLevel;
  onLanguage: (l: Language) => void;
  capabilities: {
    execution: boolean;
    browser: boolean;
    ai: boolean;
    checked: boolean;
    progress: string;
    signedIn: boolean;
  };
  onAttempt: (a: Attempt) => void;
  onNextLevel: () => void;
}) {
  const cases = practiceCases(p),
    guide = lessons[p.id],
    key = `trace:practice:draft:${p.id}:${language}:${level}`;
  const initial = (): Draft => ({
    code: starterCode(p, language),
    caseIndex: level === "guided" ? 0 : level === "independent" ? 1 : 2,
    hints: 0,
    assisted: false,
    explanation: "",
    backup: null,
  });
  const [draft, setDraft] = useState<Draft>(initial),
    [ready, setReady] = useState(false),
    [storageError, setStorageError] = useState("");
  const [answer, setAnswer] = useState(""),
    [prediction, setPrediction] = useState<{
      passed: boolean;
      expected: unknown;
      explanation: string;
    } | null>(null);
  const [grade, setGrade] = useState<Grade | null>(null),
    [proposal, setProposal] = useState<Proposal | null>(null),
    [review, setReview] = useState<Review | null>(null),
    [trace, setTrace] = useState<PracticeRun | null>(null);
  const [busy, setBusy] = useState(""),
    [error, setError] = useState(""),
    [resetConfirm, setResetConfirm] = useState(false);
  const controller = useRef<AbortController | null>(null),
    sequence = useRef(0),
    inFlight = useRef(false);
  const selected = cases[draft.caseIndex] ?? cases[0],
    reduced = useReducedMotion();
  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem(key) ?? "null");
      if (
        v &&
        typeof v.code === "string" &&
        Number.isInteger(v.caseIndex) &&
        v.caseIndex >= 0 &&
        v.caseIndex < cases.length
      )
        setDraft({
          ...initial(),
          ...v,
          hints: Math.min(3, Math.max(0, Number(v.hints) || 0)),
          assisted: !!v.assisted,
          explanation: typeof v.explanation === "string" ? v.explanation : "",
          backup: typeof v.backup === "string" ? v.backup : null,
        });
    } catch {}
    setReady(true);
    return () => {
      sequence.current++;
      controller.current?.abort();
    };
    // This component is keyed by problem, language, and level.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(key, JSON.stringify(draft));
    } catch {
      setStorageError(
        "Draft saving is unavailable in this browser. Keep a copy before leaving.",
      );
    }
  }, [draft, key, ready]);
  function clearResults() {
    setGrade(null);
    setProposal(null);
    setReview(null);
    setTrace(null);
    setPrediction(null);
    setError("");
  }
  function edit(code: string) {
    setDraft((d) => ({ ...d, code }));
    clearResults();
  }
  function record(
    g: { score: number; passed: number; total: number },
    assisted = draft.assisted,
  ) {
    onAttempt({
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
      level,
      caseId: selected.id,
      language,
      ...g,
      assisted,
      explanation: draft.explanation,
    });
  }
  async function request(
    action: "predict" | "grade" | "review" | "optimize" | "trace",
  ) {
    if (inFlight.current || !ready) return;
    if (
      level === "challenge" &&
      action === "grade" &&
      draft.explanation.trim().length < 20
    ) {
      setError(
        "Add a short explanation of your approach before submitting the challenge (at least 20 characters).",
      );
      return;
    }
    let parsed: unknown;
    if (action === "predict") {
      try {
        parsed = JSON.parse(answer);
      } catch {
        setError(
          'Enter an answer as JSON: for example 3, true, "text", or [1, 2].',
        );
        return;
      }
    }
    const id = ++sequence.current;
    controller.current = new AbortController();
    inFlight.current = true;
    setError("");
    setBusy(action);
    setResetConfirm(false);
    if (action === "grade") {
      setGrade(null);
      setProposal(null);
      setReview(null);
    }
    if (action === "review" || action === "optimize")
      setDraft((d) => ({ ...d, assisted: true }));
    try {
      const browserValue = capabilities.browser ? await (action === "trace" ? executeInBrowser({language,code:draft.code,input:selected.input,problemId:p.id,automatic:true},controller.current.signal) : browserPractice({action,problemId:p.id,language,code:draft.code,caseId:selected.id,answer:parsed,explanation:draft.explanation},controller.current.signal)) : null;
      const response = capabilities.browser ? null : await fetch(
        action === "trace" ? "/api/local-runtime" : "/api/practice",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.current.signal,
          body: JSON.stringify(
            action === "trace"
              ? {
                  language,
                  code: draft.code,
                  input: selected.input,
                  problemId: p.id,
                  automatic: true,
                }
              : {
                  action,
                  problemId: p.id,
                  language,
                  code: draft.code,
                  caseId: selected.id,
                  answer: parsed,
                  explanation: draft.explanation,
                  level,
                  assisted: draft.assisted,
                },
          ),
        },
      );
      const value = capabilities.browser ? browserValue : await response!.json();
      if (id !== sequence.current) return;
      if (response && !response.ok)
        throw Error(
          (value as { error?: string }).error ??
            "The check could not finish. Please try again.",
        );
      const saved = value as { attempt?: Attempt; persistenceWarning?: string };
      if (saved.persistenceWarning) setStorageError(saved.persistenceWarning);
      if (action === "predict") {
        const v = value as {
          passed: boolean;
          expected: unknown;
          explanation: string;
        };
        setPrediction(v);
        if (saved.attempt) onAttempt(saved.attempt);
        else
          record({
            score: v.passed ? 100 : 0,
            passed: v.passed ? 1 : 0,
            total: 1,
          });
        setDraft((d) => ({ ...d, assisted: true }));
      }
      if (action === "grade") {
        const v = value as Grade;
        setGrade(v);
        if (saved.attempt) onAttempt(saved.attempt);
        else record({ score: v.score, passed: v.passed, total: v.total });
      }
      if (action === "review") {
        const v = value as { grade: Grade; review: Review };
        setGrade(v.grade);
        setReview(v.review);
      }
      if (action === "optimize") {
        const v = value as
          Proposal | { unchanged: true; grade: Grade; review: Review };
        if ("unchanged" in v) {
          setProposal(null);
          setGrade(v.grade);
          setReview(v.review);
        } else {
          setProposal(v);
          setGrade(v.originalGrade);
          setReview(v.review ?? null);
        }
      }
      if (action === "trace") setTrace(value as PracticeRun);
    } catch (e) {
      if (id === sequence.current)
        setError(
          e instanceof Error ? e.message : "The check could not finish.",
        );
    } finally {
      if (id === sequence.current) {
        setBusy("");
        inFlight.current = false;
      }
    }
  }
  function cancel() {
    sequence.current++;
    controller.current?.abort();
    inFlight.current = false;
    setBusy("");
    setError("Check cancelled. No new rating was saved.");
  }
  const hints = [
    guide.idea,
    guide.steps.slice(0, 2).join(" "),
    `${guide.steps.slice(2).join(" ")} ${p.caveat}`,
  ];
  return (
    <div className="practice-session">
      <div className="practice-session-toolbar">
        <div>
          <span className="practice-status">
            {level === "guided"
              ? "Think before you run"
              : draft.assisted
                ? "Assisted practice"
                : "Independent attempt"}
          </span>
          <span className="practice-autosave">
            {ready ? "Draft saved in this browser" : "Loading your draft…"}
          </span>
        </div>
        <label>
          Language
          <select
            value={language}
            disabled={!!busy}
            onChange={(e) => onLanguage(e.target.value as Language)}
          >
            <option value="python">Python 3</option>
            <option value="javascript">JavaScript</option>
            <option value="cpp">C++17</option>
          </select>
        </label>
      </div>
      {!capabilities.signedIn && (
        <p className="practice-unavailable">
          <a
            href={`/signin-with-chatgpt?return_to=${encodeURIComponent(`/?view=curriculum&problem=${p.id}`)}`}
            target="_top"
          >
            Sign in with ChatGPT
          </a>{" "}
          to check solutions and save progress to your account.
        </p>
      )}
      {storageError && (
        <p className="practice-error" role="status">
          {storageError}
        </p>
      )}
      <div className="practice-grid">
        <aside className="practice-prompt">
          <div className="practice-section-heading">
            <h3>Your exercise</h3>
            <Target size={18} />
          </div>
          <p>{p.goal}</p>
          <div
            className="practice-case-picker"
            role="group"
            aria-label="Practice example"
          >
            {cases.map((c, i) => (
              <button
                disabled={!!busy}
                aria-pressed={draft.caseIndex === i}
                key={c.id}
                onClick={() => {
                  setDraft((d) => ({ ...d, caseIndex: i }));
                  setAnswer("");
                  clearResults();
                }}
              >
                Case {i + 1}
              </button>
            ))}
          </div>
          <h4>{selected.label}</h4>
          <pre className="practice-input">
            {JSON.stringify(selected.input, null, 2)}
          </pre>
          <p className="practice-note">
            {level === "guided"
              ? "Predict the returned value, then explain the decision that leads to it."
              : "Implement solve(data). Return your answer; do not print it. Your code is tested on all five worked examples and three practice cases."}
          </p>
          <div className="practice-hints">
            <button
              className="hint-button"
              disabled={!!busy || draft.hints >= 3}
              onClick={() =>
                setDraft((d) => ({
                  ...d,
                  hints: Math.min(3, d.hints + 1),
                  assisted: true,
                }))
              }
            >
              <Lightbulb size={16} />
              {draft.hints ? "Show the next hint" : "Give me a hint"}
              <span>{draft.hints}/3</span>
            </button>
            <AnimatePresence>
              {hints.slice(0, draft.hints).map((h, i) => (
                <motion.div
                  key={i}
                  initial={reduced ? false : { opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                >
                  <strong>Hint {i + 1}</strong>
                  <p>{h}</p>
                </motion.div>
              ))}
            </AnimatePresence>
            <small>
              Hints are here to help. Assisted attempts stay separate from
              independent solves.
            </small>
          </div>
        </aside>
        <section className="practice-work">
          <div className="practice-section-heading">
            <h3>
              {level === "guided" ? "What will this return?" : "Your solution"}
            </h3>
            <Code2 size={18} />
          </div>
          {level === "guided" ? (
            <div className="prediction-work">
              <label htmlFor="practice-answer">
                Your predicted answer (JSON)
              </label>
              <textarea
                id="practice-answer"
                value={answer}
                disabled={!!busy}
                placeholder={'For example: 3, true, "text", or [1, 2]'}
                onChange={(e) => {
                  setAnswer(e.target.value);
                  setPrediction(null);
                  setError("");
                }}
              />
              <label htmlFor="practice-reason">
                Why do you expect this result?
              </label>
              <textarea
                id="practice-reason"
                value={draft.explanation}
                disabled={!!busy}
                placeholder="Describe the key step in your own words…"
                onChange={(e) =>
                  setDraft((d) => ({ ...d, explanation: e.target.value }))
                }
              />
              <button
                className="practice-primary"
                disabled={!!busy || !answer.trim() || !ready}
                onClick={() => void request("predict")}
              >
                <Check size={16} />
                Check my prediction
              </button>
              {prediction && (
                <div
                  className={`prediction-feedback ${prediction.passed ? "is-correct" : ""}`}
                  role="status"
                >
                  <strong>
                    {prediction.passed
                      ? "You got it."
                      : "Let’s work through it."}
                  </strong>
                  <p>Expected answer</p>
                  <pre>{JSON.stringify(prediction.expected, null, 2)}</pre>
                  <p>{prediction.explanation}</p>
                  <button onClick={onNextLevel}>
                    Now solve it yourself <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Editor
                value={draft.code}
                language={language}
                line={0}
                readOnly={!!busy || !ready}
                onChange={edit}
                onRun={() => void request("grade")}
              />
              <div className="practice-code-actions">
                <button
                  disabled={!!busy || !ready}
                  onClick={() => setResetConfirm(true)}
                >
                  <RotateCcw size={14} />
                  Start fresh
                </button>
                <span>Your learning draft is kept separately.</span>
              </div>
              {resetConfirm && (
                <div
                  className="practice-reset"
                  role="group"
                  aria-label="Confirm fresh attempt"
                >
                  <p>
                    Reset this practice draft to starter code and clear hints?
                    Your previous attempts stay saved.
                  </p>
                  <button
                    onClick={() => {
                      setDraft({ ...initial(), caseIndex: draft.caseIndex });
                      clearResults();
                      setResetConfirm(false);
                    }}
                  >
                    Reset practice draft
                  </button>
                  <button onClick={() => setResetConfirm(false)}>
                    Keep working
                  </button>
                </div>
              )}
              <div className="practice-reflection">
                <label htmlFor="practice-reflection">
                  Explain your approach{" "}
                  {level === "challenge"
                    ? "· required for this challenge"
                    : "· optional"}
                </label>
                <textarea
                  id="practice-reflection"
                  disabled={!!busy}
                  value={draft.explanation}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, explanation: e.target.value }))
                  }
                  placeholder="What stays true at each step? How does your solution handle the boundary cases?"
                />
                <small>
                  Your explanation is saved for reflection; it is not
                  automatically graded.
                </small>
              </div>
              <div className="practice-actions">
                <button
                  className="practice-primary"
                  disabled={!!busy || !ready || !capabilities.execution}
                  onClick={() => void request("grade")}
                >
                  <Check size={16} />
                  Submit & rate
                </button>
                <button
                  disabled={!!busy || !ready || !capabilities.execution}
                  onClick={() => void request("trace")}
                >
                  <Play size={16} />
                  Visualize my code
                </button>
              </div>
            </>
          )}
        </section>
      </div>
      {busy && (
        <div className="practice-busy" role="status">
          <span className="practice-spinner" />
          <div>
            <strong>
              {busy === "predict"
                ? "Checking your prediction…"
                : busy === "trace"
                  ? "Recording your code’s execution…"
                  : busy === "optimize"
                    ? "Checking your solution and verifying the suggested approach…"
                    : busy === "review"
                      ? "Checking your code and preparing a review…"
                      : "Running your solution against eight cases…"}
            </strong>
            <small>
              {language === "cpp" && busy !== "predict"
                ? "C++ checks include compilation and may take a little longer."
                : "You can cancel at any time."}
            </small>
          </div>
          <button onClick={cancel}>
            <X size={15} />
            Cancel
          </button>
        </div>
      )}
      {error && (
        <p className="practice-error" role="alert">
          {error}
        </p>
      )}
      {capabilities.checked &&
        !capabilities.execution &&
        level !== "guided" && (
          <p className="practice-unavailable">
            C++ needs a connected compiler. Choose Python or JavaScript to run
            your solution and check all eight cases in this browser.
          </p>
        )}
      {trace && (
        <TracePlayer
          key={`${draft.code}:${selected.id}`}
          run={trace}
          problem={p}
          input={selected.input}
          code={draft.code}
          language={language}
        />
      )}
      {grade && (
        <motion.section
          className="practice-feedback"
          initial={reduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          aria-label="Solution feedback"
        >
          <div className="grade-heading">
            <div
              className={`grade-number ${grade.score === 100 ? "all-passed" : ""}`}
            >
              <strong>{grade.score}</strong>
              <span>/100</span>
            </div>
            <div>
              <div className="eyebrow mint">CORRECTNESS RATING</div>
              <h3>
                {grade.passed} of {grade.total} cases passed
              </h3>
              <p>{grade.feedback}</p>
            </div>
          </div>
          <p className="grade-rubric">
            Score = passed cases ÷ total cases × 100. Every case has equal
            weight. This checks these inputs; it does not prove correctness for
            every input or measure efficiency.
          </p>
          <div className="grade-cases">
            {grade.cases.map((c, i) => (
              <details
                key={c.id}
                open={
                  i === grade.cases.findIndex((c) => !c.passed) || undefined
                }
              >
                <summary>
                  <span className={c.passed ? "case-pass" : "case-fail"}>
                    {c.passed ? <Check size={14} /> : <X size={14} />}
                  </span>
                  {c.label}
                  <span>
                    {c.passed
                      ? "Passed"
                      : c.error
                        ? "Execution error"
                        : "Needs work"}
                  </span>
                </summary>
                <div className="case-result">
                  <div>
                    <label>Input</label>
                    <pre>{JSON.stringify(c.input, null, 2)}</pre>
                  </div>
                  <div>
                    <label>Expected</label>
                    <pre>{JSON.stringify(c.expected, null, 2)}</pre>
                    <label>Your result</label>
                    <pre>{c.error ?? JSON.stringify(c.actual, null, 2)}</pre>
                  </div>
                </div>
              </details>
            ))}
          </div>
          <div className="practice-feedback-columns">
            <div>
              <h4>Efficiency checkpoint</h4>
              <p>{grade.referenceCost}</p>
              <small>
                This describes the reference approach. Your code’s complexity is
                not inferred from its test score or animation length.
              </small>
            </div>
            <div>
              <h4>Review your code</h4>
              <p>
                Can someone follow your variable names? Is the stopping
                condition clear? Explain why each update preserves the rule your
                algorithm relies on.
              </p>
              <small>
                These are review prompts, not an automated readability score.
              </small>
            </div>
          </div>
          <div className="practice-actions">
            <button
              disabled={!!busy || !capabilities.execution}
              onClick={() => void request("optimize")}
            >
              <Sparkles size={16} />
              {capabilities.ai
                ? "Help me optimize"
                : "Compare a proven approach"}
            </button>
            {capabilities.ai && (
              <button disabled={!!busy} onClick={() => void request("review")}>
                Review my code with AI
              </button>
            )}
            {grade.score === 100 && level !== "challenge" && (
              <button onClick={onNextLevel}>
                Try the challenge <ArrowRight size={16} />
              </button>
            )}
          </div>
          <small className="practice-footnote">
            {capabilities.ai
              ? "AI review sends this solution and its test results to the configured AI service. Analysis is advisory; tests determine the correctness rating."
              : "AI review is not connected. Test ratings, authored hints, and verified reference comparisons work without AI."}
          </small>
        </motion.section>
      )}
      {review && (
        <section className="practice-review">
          <div className="eyebrow mint">AI REVIEW · ESTIMATES</div>
          <h3>{review.summary}</h3>
          <p>
            <strong>Time:</strong> {review.time}
          </p>
          <p>
            <strong>Space:</strong> {review.space}
          </p>
          <ul>
            {review.suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </section>
      )}
      {proposal && (
        <section className="practice-proposal">
          <div className="practice-section-heading">
            <h3>
              {proposal.source === "ai"
                ? "A suggested improvement"
                : "Compare the reference approach"}
            </h3>
            <span>
              <Check size={15} />
              {proposal.grade.passed}/{proposal.grade.total} tests verified
            </span>
          </div>
          <p>{proposal.explanation}</p>
          <div className="proposal-columns">
            <div>
              <h4>Your current code</h4>
              <pre>{draft.code}</pre>
            </div>
            <div>
              <h4>
                {proposal.source === "ai" ? "Suggested code" : "Reference code"}
              </h4>
              <pre>{proposal.code}</pre>
            </div>
          </div>
          <p>
            {proposal.improved
              ? "This version passes cases your current solution misses."
              : "Both versions pass the same suite. This is not a measured speed comparison."}
          </p>
          <div className="practice-actions">
            <button
              className="practice-primary"
              disabled={!!busy || proposal.code === draft.code}
              onClick={() => {
                setDraft((d) => ({
                  ...d,
                  backup: d.code,
                  code: proposal.code,
                  assisted: true,
                }));
                clearResults();
              }}
            >
              Use this version
            </button>
            <button onClick={() => setProposal(null)}>Keep my code</button>
          </div>
        </section>
      )}
      {draft.backup !== null && (
        <button
          className="practice-restore"
          disabled={!!busy}
          onClick={() => {
            setDraft((d) => ({ ...d, code: d.backup ?? d.code, backup: null }));
            clearResults();
          }}
        >
          <RotateCcw size={14} />
          Restore my original code
        </button>
      )}
    </div>
  );
}
