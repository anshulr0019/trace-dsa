"use client";
import { usePlaybackFocus } from "../experience/use-playback-focus";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Code2,
  Play,
  Pause,
  RotateCcw,
  Search,
  SkipBack,
  SkipForward,
  Terminal,
} from "lucide-react";
import {
  problems,
  patterns,
  tiers,
  problemById,
  type Problem,
} from "@/lib/curriculum/catalog";
import { pythonSources, pythonPrelude } from "@/lib/curriculum/sources";
import {
  playgroundSource,
  hasReference,
  restoreDraft,
  type Language,
} from "@/lib/curriculum/playground";
import { validateProblemInput } from "@/lib/curriculum/validate";
import {
  executeSubmission,
  runtimeCapabilities,
  type RuntimeCapabilities,
} from "@/lib/curriculum/runtime-client";
import { needsExecution } from "@/lib/curriculum/execution";
import {
  examplesFor,
  sameInput,
  matchesAnswer,
  lessons,
} from "@/lib/curriculum/learning";
import { ExampleShelf, ExecutionInspector } from "./execution-inspector";
import { ProblemNotes } from "../product/notebook";
import { AssignmentPanel } from "../product/teacher";
import {
  LearningHints,
  LessonActions,
  RecordedPrediction,
  nextPrediction,
} from "../product/learning-tools";
import { AlgorithmComparison, TraceStats } from "../product/comparison";
import { readSharedLesson, type SharedLesson } from "@/lib/product/lessons";
import { Workbench } from "../experience/workbench";
import { RoadmapDock } from "./roadmap-dock";
import { RoadmapInsights } from "./roadmap-insights";
import {
  LessonJourney,
  MasteryPanel,
  LearningBadge,
  type JourneyStep,
} from "../learning/lesson-journey";
import { ProblemInteraction } from "../learning/problem-interaction";
import { ReadableCode } from "../learning/readable-code";
import { RuntimeStatus } from "../learning/runtime-status";
import {
  recordLearning,
  learningEvidence,
  learningStatus,
} from "@/lib/product/mastery";
import { TrackProject } from "../learning/track-project";
import { ProblemSolvingClinic } from "../learning/problem-solving-clinic";
import { CourseGuide } from "../learning/course-guide";
import { EvidenceBoard } from "../learning/evidence-board";
import { recordChanges } from "@/lib/learning/evidence";
import { ConceptIntro } from "./concept-intro";
import { conceptCue } from "@/lib/curriculum/concept-cues";
import { LearningGuide } from "./learning-guide";
import { Editor } from "./editor";
import { Scene, display, type ExecutionFrame } from "./scene";
const PracticeLab = lazy(() =>
  import("../practice/practice-lab").then((m) => ({ default: m.PracticeLab })),
);
import { useFramePlayback } from "./use-frame-playback";
import "./curriculum.css";
import "./workspace.css";
import "./foundation-style.css";
import "../learning/lesson-workspace.css";
import { usePublishedLesson } from "../lab/editorial";
import { InputBuilder } from "../lab/input-builder";
import { VisualDebugger } from "../lab/debugger";
import { StudyTools } from "../lab/study-tools";
import { FindMistake } from "../lab/find-mistake";
import { pausedAtBreakpoint, watchValue } from "@/lib/lab/debug";
import { experiments, type Experiment } from "@/lib/lab/study";
import "../lab/lab.css";
type Run = {
  frames: ExecutionFrame[];
  result: unknown;
  error?: string | null;
  stdout?: string;
  truncated?: boolean;
};
const formatInput = (data: Record<string, unknown>) =>
  "{\n" +
  Object.entries(data)
    .map(([key, value]) => `  ${JSON.stringify(key)}: ${JSON.stringify(value)}`)
    .join(",\n") +
  "\n}";
const sourceFor = (p: Problem, l: Language) =>
  l === "python" ? pythonPrelude + pythonSources[p.id] : playgroundSource(p, l);
const languages: { id: Language; label: string; file: string }[] = [
  { id: "python", label: "Python 3", file: "solution.py" },
  { id: "cpp", label: "C++17", file: "solution.cpp" },
  { id: "java", label: "Java 8", file: "Solution.java" },
  { id: "javascript", label: "JavaScript", file: "solution.js" },
];
function ProblemStudio({
  problem: p,
  onBack,
  onProblem,
  onExisting,
}: {
  problem: Problem;
  onBack: () => void;
  onProblem: (id: string) => void;
  onExisting: (id: string) => void;
}) {
  const [journey, setJourney] = useState<JourneyStep>("Watch");
  const [codeView, setCodeView] = useState<"algorithm" | "full">("algorithm");
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [codeRequest, setCodeRequest] = useState(0);
  const published = usePublishedLesson(p.id);
  const [shared, setShared] = useState<SharedLesson | null>(null),
    [beginner, setBeginner] = useState(false),
    [presenting, setPresenting] = useState(false),
    [predict, setPredict] = useState(false),
    [question, setQuestion] = useState<ReturnType<typeof nextPrediction>>(null);
  const [breakpoints, setBreakpoints] = useState<number[]>([]);
  const [watches, setWatches] = useState<string[]>([]);
  const lastBreakpoint = useRef(-1),
    pendingSeek = useRef<number | null>(null);
  const predicted = useRef(new Set<number>()),
    sharedLoaded = useRef(false);
  useEffect(() => {
    document.body.classList.toggle("trace-presenting", presenting);
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPresenting(false);
    };
    window.addEventListener("keydown", escape);
    return () => {
      document.body.classList.remove("trace-presenting");
      window.removeEventListener("keydown", escape);
    };
  }, [presenting]);
  const [language, setLanguage] = useState<Language>("python"),
    [code, setCode] = useState(sourceFor(p, "python")),
    [input, setInput] = useState(formatInput(p.input));
  const [result, setResult] = useState<Run | null>(null),
    [speed, setSpeed] = useState(1),
    [running, setRunning] = useState(false),
    [error, setError] = useState("");
  const [runtimeStage, setRuntimeStage] = useState("loading");
  const { step, setStep, playing, setPlaying } = useFramePlayback(
    result?.frames.length ?? 0,
    speed,
  );
  const {
    ref: playbackRef,
    focused,
    focusRequest,
    focus: focusPlayback,
    setFocused,
  } = usePlaybackFocus(playing, p.id);
  useEffect(() => {
    if (playing) recordLearning(p.id, "watched", "Played an execution trace");
  }, [playing, p.id]);
  const [experience, setExperience] = useState<"learn" | "practice">("learn");
  const [snapshot, setSnapshot] = useState({
      code: "",
      input: "",
      language: "python",
    }),
    [runInput, setRunInput] = useState(p.input),
    [runtime, setRuntime] = useState<RuntimeCapabilities | null>(null);
  const [panel, setPanel] = useState("input"),
    [ready, setReady] = useState(false);
  function switchExperience(next: "learn" | "practice") {
    setPlaying(false);
    setExperience(next);
    setJourney(next === "practice" ? "Solve" : "Watch");
    const url = new URL(location.href);
    if (next === "practice") url.searchParams.set("practice", "1");
    else url.searchParams.delete("practice");
    window.history.replaceState(null, "", url.pathname + url.search);
  }
  const examples = examplesFor(p);
  function applyInput(value: Record<string, unknown>) {
    setInput(formatInput(value));
    setCustomMode(true);
    setQuestion(null);
    setPlaying(false);
    setResult(null);
    setStep(0);
    setError("");
  }
  function restoreExperiment(value: Experiment) {
    drafts.current[language] = code;
    drafts.current[value.language] = value.code;
    setMode("mine");
    setLanguage(value.language);
    setCode(value.code);
    setBreakpoints([]);
    applyInput(value.input);
  }
  function inspectCase(value: Record<string, unknown>, capture: Run) {
    setInput(formatInput(value));
    setCustomMode(true);
    setQuestion(null);
    setPlaying(false);
    setResult(capture);
    setRunInput(value);
    setSnapshot({ code: activeCode, input: formatInput(value), language });
    pendingSeek.current = 0;
    setPanel("output");
    focusPlayback();
  }
  function seekDebug(n: number) {
    setQuestion(null);
    setPlaying(false);
    lastBreakpoint.current = -1;
    setStep(n);
  }

  const [customMode, setCustomMode] = useState(false);
  const [mode, setMode] = useState<"guided" | "mine">("mine"),
    [batch, setBatch] = useState<string[]>([]),
    [visualVariable, setVisualVariable] = useState(""),
    [visualKind, setVisualKind] = useState("array"),
    [markerVariable, setMarkerVariable] = useState("");
  const activeCode = mode === "guided" ? sourceFor(p, language) : code;
  let selectedExample = -1;
  try {
    selectedExample = customMode
      ? -1
      : examples.findIndex((e) => sameInput(e.input, JSON.parse(input)));
  } catch {}
  function chooseExample(index: number) {
    setQuestion(null);
    predicted.current.clear();
    setPlaying(false);
    setResult(null);
    setStep(0);
    setError("");
    setPanel("input");
    setCustomMode(index < 0);
    if (index >= 0) setInput(formatInput(examples[index].input));
    else {
      setConsoleOpen(true);
      setPanel("input");
      setCodeRequest((n) => n + 1);
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          document.getElementById("problem-input")?.focus(),
        ),
      );
    }
  }
  const drafts = useRef<Record<string, string>>({}),
    request = useRef(0),
    inFlight = useRef(false),
    controller = useRef<AbortController | null>(null);
  useEffect(() => {
    try {
      const preferred = localStorage.getItem("trace:language");
      if (languages.some((l) => l.id === preferred)) {
        setLanguage(preferred as Language);
        setCode(sourceFor(p, preferred as Language));
      }
      const saved = JSON.parse(
        localStorage.getItem(`trace:problem:${p.id}`) ?? "null",
      );
      if (saved) {
        drafts.current = saved.drafts ?? {};
        const lang: Language = languages.some((l) => l.id === saved.language)
          ? saved.language
          : "python";
        setLanguage(lang);
        setCode(
          restoreDraft(p, lang, drafts.current[lang], sourceFor(p, lang)),
        );
        setInput(saved.input ?? formatInput(p.input));
      }
    } catch {}
    const requested = new URLSearchParams(location.search).get("language");
    if (languages.some((l) => l.id === requested)) {
      const lang = requested as Language;
      setLanguage(lang);
      setCode(restoreDraft(p, lang, drafts.current[lang], sourceFor(p, lang)));
    }
    try {
      const lesson = readSharedLesson();
      if (lesson && lesson.problemId === p.id) {
        setShared(lesson);
        setLanguage(lesson.language);
        setInput(formatInput(lesson.input));
        setCustomMode(true);
        setCode(lesson.code ?? sourceFor(p, lesson.language));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid lesson link.");
    }
    const study = new URLSearchParams(location.search).get("study");
    const experiment = experiments().find(
      (e) => e.id === study && e.problemId === p.id,
    );
    if (experiment && !validateProblemInput(p.id, experiment.input)) {
      setLanguage(experiment.language);
      setCode(experiment.code);
      setInput(formatInput(experiment.input));
      setCustomMode(true);
      drafts.current[experiment.language] = experiment.code;
    }
    setExperience(
      new URLSearchParams(location.search).get("practice") === "1"
        ? "practice"
        : "learn",
    );
    setReady(true);
    const statusController = new AbortController();
    void runtimeCapabilities(statusController.signal)
      .then(setRuntime)
      .catch(() => {});
    return () => {
      statusController.abort();
      request.current++;
      controller.current?.abort();
    };
  }, [p]);
  useEffect(() => {
    if (!ready) return;
    drafts.current[language] = code;
    try {
      localStorage.setItem(
        `trace:problem:${p.id}`,
        JSON.stringify({ drafts: drafts.current, language, input }),
      );
      window.dispatchEvent(new Event("trace:notebook"));
    } catch {}
  }, [code, input, language, p.id, ready]);
  useEffect(() => {
    const restore = () => {
      try {
        const saved = JSON.parse(
          localStorage.getItem(`trace:problem:${p.id}`) ?? "null",
        );
        if (!saved) return;
        controller.current?.abort();
        request.current++;
        inFlight.current = false;
        setRunning(false);
        setPlaying(false);
        setResult(null);
        drafts.current = saved.drafts ?? {};
        const lang: Language = languages.some((l) => l.id === saved.language)
          ? saved.language
          : language;
        setLanguage(lang);
        setCode(
          restoreDraft(p, lang, drafts.current[lang], sourceFor(p, lang)),
        );
        setInput(saved.input ?? formatInput(p.input));
        setBreakpoints([]);
      } catch {}
    };
    window.addEventListener("trace:restore", restore);
    return () => window.removeEventListener("trace:restore", restore);
  }, [p.id, language]);
  const stale =
    !!result &&
    (snapshot.code !== activeCode ||
      snapshot.input !== input ||
      snapshot.language !== language);
  const frame = result?.frames[step],
    prev = step ? result?.frames[step - 1] : undefined;
  useEffect(() => {
    if (
      playing &&
      result &&
      pausedAtBreakpoint(
        result.frames,
        step,
        breakpoints,
        lastBreakpoint.current,
      )
    ) {
      lastBreakpoint.current = step;
      setPlaying(false);
    }
  }, [playing, step, breakpoints, result, setPlaying]);
  useEffect(() => {
    if (result && pendingSeek.current !== null) {
      setStep(pendingSeek.current);
      pendingSeek.current = null;
    }
  }, [result, setStep]);
  useEffect(() => {
    if (!predict || !playing || predicted.current.has(step) || !result) return;
    const q = nextPrediction(frame, result.frames[step + 1]);
    if (q) {
      predicted.current.add(step);
      setPlaying(false);
      setQuestion(q);
    }
  }, [step, predict, playing, result, frame, setPlaying]);
  useEffect(() => {
    if (result && shared?.step !== undefined && !sharedLoaded.current) {
      sharedLoaded.current = true;
      setStep(shared.step);
      setPlaying(false);
    }
  }, [result, shared, setStep, setPlaying]);
  async function run(autoplay = false, exampleInput?: string) {
    if (inFlight.current || !runtime || !runtime.languages.includes(language))
      return;
    let data: Record<string, unknown>;
    const executingInput = exampleInput ?? input;
    try {
      data = JSON.parse(executingInput);
      if (!data || Array.isArray(data) || typeof data !== "object")
        throw Error("Input must be a JSON object.");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPanel("input");
      setConsoleOpen(true);
      setCodeRequest((n) => n + 1);
      return;
    }
    const inputError = validateProblemInput(p.id, data);
    if (inputError) {
      setError(inputError);
      setPanel("input");
      setConsoleOpen(true);
      setCodeRequest((n) => n + 1);
      return;
    }
    if (autoplay) {
      setJourney("Watch");
      focusPlayback();
    }
    predicted.current.clear();
    lastBreakpoint.current = -1;
    setQuestion(null);
    const id = ++request.current;
    inFlight.current = true;
    controller.current = new AbortController();
    setRunning(true);
    setRuntimeStage("loading");
    setPlaying(false);
    setError("");
    setResult(null);
    setStep(0);
    try {
      const value = await executeSubmission(
        {
          language,
          code: activeCode,
          input: data,
          problemId: p.id,
          automatic: mode === "mine",
        },
        runtime,
        controller.current.signal,
        (stage) => {
          if (id === request.current) setRuntimeStage(stage);
        },
      );
      if (id !== request.current) return;
      setResult(value);
      setSnapshot({ code: activeCode, input: executingInput, language });
      setRunInput(data);
      setPanel("output");
      setPlaying(autoplay && value.frames.length > 1);
    } catch (e) {
      if (id === request.current)
        setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (id === request.current) {
        inFlight.current = false;
        setRunning(false);
      }
    }
  }
  function togglePlayback() {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (needsExecution(result, stale)) {
      void run(true);
      return;
    }
    if (question) {
      setQuestion(null);
      setStep((n) => n + 1);
      focusPlayback();
      setPlaying(true);
      return;
    }
    focusPlayback();
    if (step === (result?.frames.length ?? 0) - 1) {
      lastBreakpoint.current = -1;
      setStep(0);
    }
    setPlaying(true);
  }
  function changeLanguage(next: Language) {
    setQuestion(null);
    predicted.current.clear();
    try {
      localStorage.setItem("trace:language", next);
    } catch {}
    drafts.current[language] = code;
    setLanguage(next);
    setCode(restoreDraft(p, next, drafts.current[next], sourceFor(p, next)));
    setPlaying(false);
    setResult(null);
    setBatch([]);
    const url = new URL(location.href);
    url.searchParams.set("language", next);
    window.history.replaceState(null, "", url.pathname + url.search);
  }
  async function runExamples() {
    if (inFlight.current || !runtime || !runtime.languages.includes(language))
      return;
    inFlight.current = true;
    setRunning(true);
    setPlaying(false);
    setError("");
    setBatch([]);
    const id = ++request.current;
    controller.current = new AbortController();
    try {
      for (let i = 0; i < examples.length; i++) {
        setBatch((b) => {
          const n = [...b];
          n[i] = "Running";
          return n;
        });
        let status = "Error";
        try {
          const value = await executeSubmission(
            {
              language,
              code: activeCode,
              input: examples[i].input,
              problemId: p.id,
              automatic: mode === "mine",
            },
            runtime,
            controller.current.signal,
          );
          if (id !== request.current) return;
          status = value.error
            ? "Error"
            : matchesAnswer(
                  p,
                  examples[i].input,
                  examples[i].expected,
                  value.result,
                )
              ? "Passed"
              : "Failed";
        } catch (e) {
          if (controller.current.signal.aborted) return;
          status = "Error";
        }
        setBatch((b) => {
          const n = [...b];
          n[i] = status;
          return n;
        });
      }
    } finally {
      if (id === request.current) {
        inFlight.current = false;
        setRunning(false);
      }
    }
  }
  function stop() {
    request.current++;
    controller.current?.abort();
    inFlight.current = false;
    setRunning(false);
    setPlaying(false);
    setBatch((b) => b.map((x) => (x === "Running" ? "Cancelled" : x)));
    setError("Run cancelled. The isolated worker has been asked to stop.");
  }
  const canRun = !!runtime?.languages.includes(language);
  const sample =
    result &&
    examplesFor(p).find((example) => sameInput(runInput, example.input));
  const match =
    sample &&
    result &&
    matchesAnswer(p, runInput, sample.expected, result.result);
  let preview = p.input;
  let previewError = "";
  try {
    const parsed = JSON.parse(input);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
      preview = parsed;
    else previewError = "Input JSON must be an object.";
  } catch {
    previewError = "Correct the input JSON before saving or sharing.";
  }
  if (!previewError) previewError = validateProblemInput(p.id, preview) ?? "";
  return (
    <section
      onKeyDown={(e) => {
        if (
          (e.metaKey || e.ctrlKey) &&
          e.key === "Enter" &&
          codeView === "algorithm" &&
          experience === "learn"
        ) {
          e.preventDefault();
          void run(true);
        }
      }}
      className={`curriculum problem-studio roadmap-foundation has-playback ${presenting ? "presentation-studio" : ""}`}
    >
      <div className="problem-navigation">
        <button className="text-action" onClick={onBack}>
          <ArrowLeft size={14} /> All 100 problems
        </button>
        <span className="runtime-status">
          {!runtime
            ? "Checking runtime…"
            : runtime.server && language !== "java"
              ? "Connected runtime"
              : canRun
                ? "Runs in your browser"
                : "C++ compiler required"}
        </span>
      </div>
      <div className="curriculum-heading">
        <div>
          <div className="eyebrow mint">
            TIER {p.tier} / {patterns[p.group - 1]} / {p.stage}
          </div>
          <h1>{p.title}</h1>
          <p>{p.goal}</p>
        </div>
        <LearningBadge
          id={p.id}
          onClick={() => {
            switchExperience("learn");
            setJourney("Review");
            requestAnimationFrame(() =>
              requestAnimationFrame(() =>
                document
                  .getElementById(`review-${p.id}`)
                  ?.scrollIntoView({ block: "start", behavior: "instant" }),
              ),
            );
          }}
        />
      </div>
      <LessonJourney
        active={experience === "practice" ? "Solve" : journey}
        disabled={running}
        onStep={(stage) => {
          setPlaying(false);
          if (stage !== "Watch") setFocused(false);
          if (stage === "Solve") {
            switchExperience("practice");
            window.scrollTo({ top: 0, behavior: "instant" });
            return;
          }
          switchExperience("learn");
          setJourney(stage);
          requestAnimationFrame(() =>
            requestAnimationFrame(() => {
              if (stage === "Watch") {
                focusPlayback();
                return;
              }
              const id =
                stage === "Understand"
                  ? "problem-understand"
                  : stage === "Try"
                    ? "problem-try"
                    : `review-${p.id}`;
              if (stage === "Understand") {
                const details = document.getElementById(
                  id,
                ) as HTMLDetailsElement | null;
                if (details) details.open = true;
              }
              document
                .getElementById(id)
                ?.scrollIntoView({ block: "start", behavior: "instant" });
            }),
          );
        }}
      />
      <AssignmentPanel
        problemId={p.id}
        language={language}
        code={activeCode}
        input={preview}
        inputError={previewError}
      />
      {experience === "practice" ? (
        <Suspense fallback={<p role="status">Loading practice workspace…</p>}>
          <PracticeLab
            problem={p}
            language={language}
            onLanguage={changeLanguage}
            onProblem={onProblem}
          />
        </Suspense>
      ) : (
        <>
          {shared && (
            <section className="product-card">
              <div className="eyebrow mint">SHARED LESSON</div>
              <h2>{shared.title}</h2>
              <p>{shared.instructions}</p>
              <small>
                Shared code executes on this device when you press Play.
              </small>
            </section>
          )}
          <div className="lesson-quick-controls">
            <label>
              Example{" "}
              <select
                aria-label="Choose example"
                value={selectedExample}
                disabled={running}
                onChange={(e) => chooseExample(Number(e.target.value))}
              >
                {examples.map((e, i) => (
                  <option key={i} value={i}>
                    {i + 1}. {e.label}
                  </option>
                ))}
                <option value={-1}>Your input</option>
              </select>
            </label>
            <span>
              {mode === "guided" ? "Guided solution" : "Your code"} ·{" "}
              {languages.find((l) => l.id === language)?.label}
            </span>
            <a href="#lesson-tools">Options & tools ↓</a>
          </div>
          <div
            ref={playbackRef}
            id="visual-workbench"
            className={`playback-surface ${focused ? "playback-focused" : ""}`}
          >
            {focused && (
              <div className="focus-toolbar">
                <span>Playback view</span>
                <button
                  onClick={() => {
                    setPlaying(false);
                    setFocused(false);
                  }}
                >
                  Full layout
                </button>
              </div>
            )}
            <Workbench
              visualSize={55}
              focusRequest={focusRequest}
              codeRequest={codeRequest}
              onSwitch={() => setPlaying(false)}
              visual={
                <section
                  className="trace-visual-panel"
                  aria-label="Visual execution"
                >
                  <header>
                    <span>01 / VISUAL EXECUTION</span>
                    <span>
                      {result
                        ? `${result.frames.length} captured states`
                        : "Input preview"}
                    </span>
                  </header>
                  <div className="trace-visual-body">
                    {stale && (
                      <div className="trace-notice">
                        Code or input changed. Press Play to run and visualize
                        the current version.
                      </div>
                    )}
                    <RuntimeStatus
                      busy={running}
                      stage={runtimeStage}
                      error={error || result?.error || undefined}
                      onRetry={() => void run(true)}
                      onCancel={stop}
                      onHelp={() => setPanel("help")}
                    />
                    {error && (
                      <pre className="runtime-error" role="alert">
                        {error}
                      </pre>
                    )}
                    {result?.error && (
                      <pre className="runtime-error" role="alert">
                        {result.error}
                      </pre>
                    )}
                    <div className="visual-binding">
                      <label>
                        Visualize variable
                        <select
                          aria-label="Visualize variable"
                          value={visualVariable}
                          onChange={(e) => setVisualVariable(e.target.value)}
                        >
                          <option value="">Automatic</option>
                          {Object.entries(frame?.vars ?? preview)
                            .filter(
                              ([, v]) =>
                                Array.isArray(v) || typeof v === "string",
                            )
                            .map(([k]) => (
                              <option key={k}>{k}</option>
                            ))}
                        </select>
                      </label>
                      {visualVariable && (
                        <>
                          <label>
                            As
                            <select
                              aria-label="Visualization type"
                              value={visualKind}
                              onChange={(e) => setVisualKind(e.target.value)}
                            >
                              {[
                                "array",
                                "string",
                                "grid",
                                "stack",
                                "heap",
                                "tree",
                                "linked",
                              ].map((k) => (
                                <option key={k}>{k}</option>
                              ))}
                            </select>
                          </label>
                          <label>
                            Marker
                            <select
                              aria-label="Marker variable"
                              value={markerVariable}
                              onChange={(e) =>
                                setMarkerVariable(e.target.value)
                              }
                            >
                              <option value="">None</option>
                              {Object.entries(frame?.vars ?? {})
                                .filter(([, v]) => Number.isInteger(v))
                                .map(([k]) => (
                                  <option key={k}>{k}</option>
                                ))}
                            </select>
                          </label>
                        </>
                      )}
                    </div>
                    <Scene
                      source={
                        snapshot.code.split("\n")[(frame?.line ?? 0) - 1] ?? ""
                      }
                      cue={
                        !visualVariable
                          ? conceptCue(
                              p.id,
                              frame,
                              prev,
                              result ? runInput : preview,
                              snapshot.code.split("\n")[
                                (frame?.line ?? 0) - 1
                              ] ?? "",
                            )
                          : undefined
                      }
                      problem={p}
                      speed={speed}
                      input={result ? runInput : preview}
                      language={result ? snapshot.language : language}
                      frame={frame}
                      previous={prev}
                      binding={
                        visualVariable
                          ? {
                              name: visualVariable,
                              kind: visualKind,
                              marker: markerVariable,
                            }
                          : undefined
                      }
                    />
                  </div>
                  {question && (
                    <RecordedPrediction
                      key={step}
                      question={question}
                      onContinue={() => {
                        setQuestion(null);
                        setStep((n) => n + 1);
                        setPlaying(true);
                      }}
                    />
                  )}
                  {!question && (
                    <ExecutionInspector
                      compact={focused}
                      cue={conceptCue(
                        p.id,
                        frame,
                        prev,
                        result ? runInput : preview,
                        snapshot.code.split("\n")[(frame?.line ?? 0) - 1] ?? "",
                      )}
                      frame={frame}
                      previous={prev}
                      code={snapshot.code}
                    />
                  )}
                </section>
              }
              code={
                <section className="trace-code-panel">
                  <header>
                    <span>
                      <Code2 size={15} />{" "}
                      {languages.find((l) => l.id === language)?.file}
                    </span>
                    <select
                      aria-label="Programming language"
                      value={language}
                      disabled={running}
                      onChange={(e) =>
                        changeLanguage(e.target.value as Language)
                      }
                    >
                      {languages.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.label}
                        </option>
                      ))}
                    </select>
                  </header>
                  {!hasReference(p.id, language) && (
                    <div className="trace-notice">
                      Write your{" "}
                      {language === "cpp"
                        ? "C++"
                        : language === "java"
                          ? "Java"
                          : "JavaScript"}{" "}
                      solution here. The complete guided reference for this
                      problem is available in Python.
                    </div>
                  )}
                  <div className="editor-actions">
                    <button
                      disabled={running || mode === "guided"}
                      className="text-action"
                      onClick={() => {
                        setCode(sourceFor(p, language));
                        setPlaying(false);
                        setBatch([]);
                      }}
                    >
                      <RotateCcw size={13} /> Reset code
                    </button>
                    <span>⌘ / Ctrl + Enter</span>
                    <button
                      className="run-code"
                      disabled={
                        running || !runtime?.languages.includes(language)
                      }
                      onClick={() => void run(true)}
                    >
                      <Play size={13} />
                      {running
                        ? ["cpp", "java"].includes(language)
                          ? "Compiling & running…"
                          : "Running…"
                        : "Run & visualize"}
                    </button>
                  </div>
                  <div
                    className="code-view-switch"
                    role="group"
                    aria-label="Code view"
                  >
                    <button
                      aria-pressed={codeView === "algorithm"}
                      onClick={() => setCodeView("algorithm")}
                    >
                      Algorithm
                    </button>
                    <button
                      aria-pressed={codeView === "full"}
                      onClick={() => {
                        setCodeView("full");
                        setPlaying(false);
                      }}
                    >
                      Full code & editor
                    </button>
                    <small>
                      {codeView === "algorithm"
                        ? "Algorithm excerpt · source line numbers"
                        : "Complete runnable source"}
                    </small>
                  </div>
                  {codeView === "algorithm" ? (
                    <ReadableCode
                      source={activeCode}
                      language={language}
                      line={!stale ? (frame?.line ?? 0) : 0}
                    />
                  ) : (
                    <Editor
                      language={language}
                      value={activeCode}
                      breakpoints={breakpoints}
                      onBreakpoint={(n) =>
                        setBreakpoints((v) =>
                          v.includes(n) ? v.filter((x) => x !== n) : [...v, n],
                        )
                      }
                      readOnly={mode === "guided" || running}
                      onChange={(value) => {
                        setQuestion(null);
                        setBreakpoints([]);
                        lastBreakpoint.current = -1;
                        setCode(value);
                        setPlaying(false);
                        setBatch([]);
                      }}
                      line={!stale ? (frame?.line ?? 0) : 0}
                      onRun={() => void run(true)}
                    />
                  )}
                  <div className="scalar-state">
                    {watches.map((path) => {
                      const value = watchValue(frame?.vars ?? {}, path),
                        old = watchValue(prev?.vars ?? {}, path);
                      return (
                        <div
                          key={`watch:${path}`}
                          className={
                            old.found &&
                            display(old.value) !== display(value.value)
                              ? "changed"
                              : ""
                          }
                        >
                          <label>Watch · {path}</label>
                          <strong>
                            {value.found
                              ? display(value.value).slice(0, 2000)
                              : "Unavailable"}
                          </strong>
                        </div>
                      );
                    })}
                    {Object.entries(frame?.vars ?? {})
                      .filter(
                        ([k, v]) =>
                          k !== "data" &&
                          !watches.includes(k) &&
                          (v === null ||
                            ["number", "boolean", "string"].includes(typeof v)),
                      )
                      .map(([key, value]) => (
                        <div
                          key={key}
                          className={
                            prev && display(prev.vars[key]) !== display(value)
                              ? "changed"
                              : ""
                          }
                        >
                          <label>{key}</label>
                          <strong
                            className="step-transition"
                            key={display(value)}
                          >
                            {display(value)}
                          </strong>
                        </div>
                      ))}
                  </div>
                  <details
                    className="code-console"
                    open={consoleOpen}
                    onToggle={(e) => setConsoleOpen(e.currentTarget.open)}
                  >
                    <summary>
                      Input & output{" "}
                      {result && !stale && !result.error
                        ? `· Result: ${display(result.result).slice(0, 80)}`
                        : ""}
                    </summary>
                    <div
                      className="console-tabs"
                      role="tablist"
                      aria-label="Code console"
                    >
                      {["input", "output", "help"].map((tab) => (
                        <button
                          key={tab}
                          role="tab"
                          aria-selected={panel === tab}
                          onClick={() => setPanel(tab)}
                        >
                          {tab === "input"
                            ? "Input JSON"
                            : tab === "output"
                              ? "Output & errors"
                              : "Runtime guide"}
                        </button>
                      ))}
                    </div>
                    {panel === "input" ? (
                      <div className="input-panel">
                        <label htmlFor="problem-input">
                          Edit the values passed to solve(data).
                        </label>
                        <textarea
                          id="problem-input"
                          disabled={running}
                          value={input}
                          onChange={(e) => {
                            setInput(e.target.value);
                            setCustomMode(true);
                            setQuestion(null);
                            setPlaying(false);
                            setResult(null);
                            setStep(0);
                          }}
                          spellCheck={false}
                        />
                        <button
                          className="text-action"
                          disabled={running}
                          onClick={() => chooseExample(0)}
                        >
                          Restore example input
                        </button>
                      </div>
                    ) : panel === "output" ? (
                      <div className="output-panel" aria-live="polite">
                        {result ? (
                          <>
                            <div className="output-status">
                              <Terminal size={14} />
                              {result.error
                                ? "Runtime error"
                                : sample
                                  ? match
                                    ? "Example passed"
                                    : "Different from example answer"
                                  : "Executed · custom answer not verified"}
                            </div>
                            {result.error ? (
                              <pre className="runtime-error">
                                {result.error}
                              </pre>
                            ) : (
                              <pre>
                                {JSON.stringify(result.result, null, 2)}
                              </pre>
                            )}
                            {sample && !match && !result.error && (
                              <p>
                                Expected:{" "}
                                <code>{display(sample.expected)}</code>
                              </p>
                            )}
                            {result.stdout && (
                              <>
                                <label>Standard output</label>
                                <pre>{result.stdout}</pre>
                              </>
                            )}
                            {result.truncated && (
                              <p className="trace-notice">
                                Trace limited to the first 1,200 states. The
                                result is from the completed execution.
                              </p>
                            )}
                            {!result.frames.some(
                              (f) =>
                                f.event === "checkpoint" || f.event === "line",
                            ) && (
                              <p>
                                This run captured input and output only. Add
                                trace checkpoints to inspect intermediate
                                variables.
                              </p>
                            )}
                          </>
                        ) : (
                          <p>
                            Run your code to see the returned result and
                            compiler or runtime errors.
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="runtime-guide">
                        <p>
                          <strong>Python 3</strong> — complete solutions for all
                          100 problems. Standard Python with automatic line
                          tracing. tree() and linked() return values and
                          index-based links.
                        </p>
                        <p>
                          <strong>C++17</strong> — compiled in your browser with
                          Clang WebAssembly, or with local Clang in development.
                          Define <code>json solve(json data)</code>; main() is
                          provided. Use{" "}
                          <code>TRACE({`{{"nums",nums},{"i",i}}`});</code> to
                          add custom state. My code mode also captures supported
                          local variables automatically. Pointer and custom
                          types may require explicit serializable checkpoints.
                          trace.hpp includes the STL and nlohmann JSON.
                        </p>
                        <p>
                          <strong>Java 8</strong> — define{" "}
                          <code>
                            public Object solve(Map&lt;String, Object&gt; data)
                          </code>{" "}
                          inside{" "}
                          <code>public class Solution extends Trace</code>. The
                          runner supplies main(). Read arrays with{" "}
                          <code>ints(data, "nums")</code>, integers with{" "}
                          <code>num(data, "k")</code>, and strings with{" "}
                          <code>str(data, "s")</code>. Add{" "}
                          <code>trace("nums", nums, "i", i)</code> to capture
                          intermediate state. Java uses explicit checkpoints;
                          edited code without them shows input and output only.
                        </p>
                        <p>
                          <strong>JavaScript</strong> — define{" "}
                          <code>solve(data)</code> and return JSON. Use{" "}
                          <code>trace({`{nums, i}`})</code> for visual
                          checkpoints. My code mode automatically captures
                          ordinary statements and local values. Explicit trace
                          calls remain available for additional detail.
                        </p>
                        <p>
                          All 100 problems include complete, editable Python,
                          C++, Java and JavaScript references. Java compiles and
                          runs on your device using{" "}
                          <a
                            href="https://cheerpj.com"
                            target="_blank"
                            rel="noreferrer"
                          >
                            CheerpJ
                          </a>{" "}
                          and OpenJDK. No execution API key is needed. C++ uses
                          64-bit integers for counts; JavaScript integers are
                          exact through 2⁵³−1. Inputs are bounded for learning.
                        </p>
                        <p>
                          Java runs in a disposable browser worker. The first
                          run downloads its compiler and JVM; subsequent runs
                          reuse cached downloads. Python, C++ and JavaScript run
                          in separate browser workers when a server runtime is
                          not connected. C++ downloads about 28 MB of compiler
                          assets on first use and may compile more slowly on
                          older devices. Browser C++ does not support C++
                          exceptions. Runs can be cancelled. Drafts stay in this
                          browser.
                        </p>
                      </div>
                    )}
                  </details>
                  {runtime && !canRun && (
                    <div className="trace-notice">
                      This language runtime is unavailable. Your code is saved;
                      please reload and try again.
                    </div>
                  )}
                </section>
              }
              explanation={<RoadmapInsights id={p.id} mobile />}
            />
          </div>
          <RoadmapDock
            count={result?.frames.length ?? 0}
            step={step}
            playing={playing}
            speed={speed}
            disabled={
              running || !ready || !runtime?.languages.includes(language)
            }
            onToggle={togglePlayback}
            onSeek={(n) => {
              setQuestion(null);
              setPlaying(false);
              setStep(n);
            }}
            onSpeed={setSpeed}
          />
          <details id="lesson-tools" className="lesson-tools">
            <summary>Examples, playback options & advanced tools</summary>
            <div className="studio-run-toolbar">
              <div role="group" aria-label="Code source">
                <button
                  disabled={running}
                  aria-pressed={mode === "mine"}
                  onClick={() => {
                    setMode("mine");
                    setPlaying(false);
                    setResult(null);
                    setBatch([]);
                  }}
                >
                  My code
                </button>
                <button
                  disabled={running}
                  aria-pressed={mode === "guided"}
                  onClick={() => {
                    setMode("guided");
                    setPlaying(false);
                    setResult(null);
                    setBatch([]);
                  }}
                >
                  Guided solution
                </button>
              </div>
              <button
                disabled={
                  running || !ready || !runtime?.languages.includes(language)
                }
                onClick={() => void runExamples()}
              >
                Check all 5 examples
              </button>
              {running && <button onClick={stop}>Cancel run</button>}
              <span>
                {mode === "mine"
                  ? language === "java"
                    ? "Your actual execution · trace checkpoints"
                    : "Your actual execution · automatic tracing"
                  : "Reference code · guided checkpoints"}
              </span>
            </div>
            <LessonActions
              inputError={previewError}
              lesson={{
                version: 1,
                problemId: p.id,
                title: shared?.title ?? p.title,
                instructions: shared?.instructions ?? lessons[p.id].idea,
                input: preview,
                language,
                code: activeCode,
              }}
              step={step}
              presenting={presenting}
              onPresentation={() => {
                setPresenting((v) => !v);
                focusPlayback();
              }}
            />
            <div className="learning-preferences">
              <label>
                <input
                  type="checkbox"
                  checked={beginner}
                  onChange={(e) => {
                    setBeginner(e.target.checked);
                    setSpeed(e.target.checked ? 0.5 : 1);
                  }}
                />{" "}
                Beginner pace
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={predict}
                  onChange={(e) => {
                    setPredict(e.target.checked);
                    setQuestion(null);
                    predicted.current.clear();
                  }}
                />{" "}
                Predict the next state
              </label>
              {beginner && (
                <span>
                  Half speed. Pause on a change and explain it in your own
                  words.
                </span>
              )}
            </div>
            <InputBuilder
              problem={p}
              input={preview}
              inputError={previewError}
              disabled={running}
              onApply={applyInput}
            />
            <VisualDebugger
              frames={result?.frames ?? []}
              step={step}
              code={activeCode}
              breakpoints={breakpoints}
              onBreakpoints={setBreakpoints}
              onSeek={seekDebug}
              watches={watches}
              onWatches={setWatches}
            />
            <ExampleShelf
              examples={examples}
              selected={selectedExample}
              onSelect={chooseExample}
              disabled={running}
              batch={batch}
            />
            <p className="example-run-hint">
              {selectedExample >= 0
                ? `Example ${selectedExample + 1}: ${examples[selectedExample].label}`
                : "Custom input"}{" "}
              · Edit the input or run the solution to inspect each step.
            </p>
          </details>
          <details className="lesson-tools">
            <summary>Why this approach works · time & memory</summary>
            <RoadmapInsights id={p.id} />
          </details>
          <details className="lesson-tools">
            <summary>
              Compare approaches, find mistakes & save experiments
            </summary>
            <AlgorithmComparison
              problem={p}
              input={result ? runInput : preview}
            />
            {result && <TraceStats frames={result.frames} />}
            <LearningHints key={p.id} id={p.id} />
            <FindMistake
              problem={p}
              language={language}
              code={activeCode}
              runtime={runtime}
              disabled={running}
              onInspect={inspectCase}
            />
            <StudyTools
              problem={p}
              language={language}
              code={activeCode}
              input={preview}
              inputError={previewError}
              onRestore={restoreExperiment}
            />
          </details>
          {published && (
            <section className="product-card">
              <h2>{published.title}</h2>
              <p>{published.explanation}</p>
              <small>
                Additional teaching notes · updated{" "}
                {new Date(published.updated_at).toLocaleDateString()}
              </small>
            </section>
          )}
          <section id="problem-try" className="journey-anchor">
            <ProblemInteraction
              key={`${snapshot.code}:${snapshot.input}:${language}`}
              problem={p}
              run={!stale ? result : null}
              input={result && !stale ? runInput : preview}
              source={activeCode}
              language={language}
              busy={running}
              onRun={() => void run(false)}
            />
          </section>
          <MasteryPanel
            id={p.id}
            onPractice={() => switchExperience("practice")}
          />
          <ProblemNotes id={p.id} />
          <a
            className="feedback-link"
            href={`https://github.com/anshulr0019/trace-dsa/issues/new?title=${encodeURIComponent("Feedback: " + p.title)}`}
            target="_blank"
            rel="noreferrer"
          >
            Report an issue or suggest an improvement ↗
          </a>
          <details
            id="problem-understand"
            className="studio-learning journey-anchor"
          >
            <summary>
              Problem details & walkthrough · 5 explained examples
            </summary>{" "}
            <div className="learning-note">
              <p>
                <strong>The idea:</strong> {lessons[p.id].idea}
              </p>
              <p>
                <strong>Watch for:</strong>{" "}
                {p.caveat ||
                  "Explain which decision changes the state and why it is safe."}
              </p>
              {frame && (
                <code>{snapshot.code.split("\n")[frame.line - 1]}</code>
              )}
              <small>
                {language === "python"
                  ? "Python frames show state before each highlighted line; return frames show state at function exit."
                  : language === "java"
                    ? "Java checkpoints show state at each trace(...) call in your solution."
                    : "Automatic steps show state before a statement. Explicit checkpoints show state when called. Unknown custom types remain labeled rather than guessed."}
              </small>
            </div>
            <TrackProject track="dsa" />
            <ProblemSolvingClinic key={`clinic:${p.id}`} problem={p} />
            <CourseGuide
              track="dsa"
              goal={p.goal}
              challenge={
                p.caveat ? `Test this constraint: ${p.caveat}` : undefined
              }
            />
            {result && step > 0 && (
              <details className="learning-state-review">
                <summary>Inspect before → after at step {step + 1}</summary>
                <EvidenceBoard
                  changes={recordChanges(
                    result.frames[step - 1].vars,
                    result.frames[step].vars,
                  )}
                />
              </details>
            )}
            <ConceptIntro key={p.id} id={p.id} />
            <LearningGuide
              key={selectedExample}
              problem={p}
              selected={selectedExample}
              onSelect={chooseExample}
              running={
                running || !ready || !runtime?.languages.includes(language)
              }
              onPlay={(example) => {
                const next = formatInput(example.input);
                setCustomMode(false);
                setInput(next);
                void run(true, next);
                document
                  .getElementById("visual-workbench")
                  ?.scrollIntoView({ behavior: "instant" });
              }}
            />
          </details>
          <div className="practice-entry">
            <div>
              <h3>Ready to try it yourself?</h3>
              <p>
                Three practice cases, progressive hints, and feedback on your
                own solution.
              </p>
            </div>
            <button
              disabled={running}
              onClick={() => {
                switchExperience("practice");
                window.scrollTo({
                  top: 0,
                  behavior: window.matchMedia(
                    "(prefers-reduced-motion: reduce)",
                  ).matches
                    ? "instant"
                    : "smooth",
                });
              }}
            >
              Practice this concept <ArrowRight size={16} />
            </button>
          </div>
        </>
      )}
      <div className="problem-footer">
        <span>
          {problems.findIndex((x) => x.id === p.id) + 1} of 100 · Your progress
          is saved locally
        </span>
        <button
          disabled={p.id === problems.at(-1)?.id}
          onClick={() =>
            onProblem(problems[problems.findIndex((x) => x.id === p.id) + 1].id)
          }
        >
          Next problem <ArrowRight size={14} />
        </button>
      </div>
    </section>
  );
}
export function Curriculum({
  onExisting,
  navigationRequest = 0,
}: {
  onExisting: (id: string) => void;
  navigationRequest?: number;
}) {
  const [selected, setSelected] = useState<string | null>(null),
    [query, setQuery] = useState(""),
    [tier, setTier] = useState(0),
    [stage, setStage] = useState("all"),
    [completed, setCompleted] = useState<string[]>([]);
  useEffect(() => {
    const sync = () => {
      const id = new URLSearchParams(location.search).get("problem");
      setSelected(id && problemById[id] ? id : null);
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [navigationRequest]);
  const [, refreshProgress] = useState(0);
  useEffect(() => {
    const update = () => {
      setCompleted(
        problems
          .filter((p) =>
            learningEvidence(p.id).some((e) => e.kind === "independent"),
          )
          .map((p) => p.id),
      );
      refreshProgress((n) => n + 1);
    };
    update();
    window.addEventListener("trace:notebook", update);
    window.addEventListener("trace:restore", update);
    return () => {
      window.removeEventListener("trace:notebook", update);
      window.removeEventListener("trace:restore", update);
    };
  }, [selected]);
  function select(id: string | null) {
    setSelected(id);
    window.history.pushState(
      null,
      "",
      id ? `?view=curriculum&problem=${id}` : "?view=curriculum",
    );
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  if (selected)
    return (
      <ProblemStudio
        key={selected}
        problem={problemById[selected]}
        onBack={() => select(null)}
        onProblem={select}
        onExisting={onExisting}
      />
    );
  const filtered = problems.filter(
    (p) =>
      (!tier || p.tier === tier) &&
      (stage === "all" || p.stage === stage) &&
      `${p.title} ${patterns[p.group - 1]} ${p.scene}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <section className="curriculum">
      <div className="curriculum-heading">
        <div>
          <div className="eyebrow mint">THE COMPLETE PATTERN ROADMAP</div>
          <h1>
            Learn the pattern.
            <br />
            <span>See the code come alive.</span>
          </h1>
          <p>
            25 patterns. Four levels of understanding. Edit, run, and inspect
            the state behind every decision.
          </p>
        </div>
        <div className="curriculum-count">
          <strong>
            {completed.length}
            <span>/100</span>
          </strong>
          <small>solved independently</small>
          <div>
            <i style={{ width: `${completed.length}%` }} />
          </div>
        </div>
      </div>
      <div className="curriculum-search">
        <label>
          <Search size={16} />
          <input
            aria-label="Search problems or patterns"
            placeholder="Search problems, patterns, or structures…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <select
          aria-label="Problem progression"
          value={stage}
          onChange={(e) => setStage(e.target.value)}
        >
          <option value="all">All progression levels</option>
          {["Concept", "Direct", "Disguised", "Edge-case trap"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="tier-filter">
        <button
          className={tier === 0 ? "selected" : ""}
          onClick={() => setTier(0)}
        >
          All tiers <span>100</span>
        </button>
        {tiers.map((t, i) => (
          <button
            title={t}
            key={t}
            className={tier === i + 1 ? "selected" : ""}
            onClick={() => setTier(i + 1)}
          >
            Tier {i + 1}
            <span>{[28, 24, 20, 28][i]}</span>
          </button>
        ))}
      </div>
      <p className="curriculum-summary">
        {filtered.length} problems · Concept → Direct → Disguised → Edge-case
        trap · Existing lessons are linked
      </p>
      {tiers.map((t, i) => {
        const items = filtered.filter((p) => p.tier === i + 1);
        if (!items.length) return null;
        return (
          <div key={t} className="curriculum-tier">
            <h2>
              <span>0{i + 1}</span>
              {t}
            </h2>
            {patterns.map((pattern, g) => {
              const group = items.filter((p) => p.group === g + 1);
              if (!group.length) return null;
              return (
                <div className="pattern-group" key={pattern}>
                  <div className="pattern-label">
                    <span>{String(g + 1).padStart(2, "0")}</span>
                    <h3>{pattern}</h3>
                  </div>
                  <div className="problem-grid">
                    {group.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => select(p.id)}
                        className={`problem-card ${completed.includes(p.id) ? "done" : ""}`}
                      >
                        <span className="problem-stage">
                          {p.stage}
                          {completed.includes(p.id) ? (
                            <Check size={13} />
                          ) : (
                            <ArrowRight size={13} />
                          )}
                        </span>
                        <strong>{p.title}</strong>
                        <span className="problem-card-bottom">
                          {p.existing
                            ? "Existing lesson linked"
                            : learningStatus(learningEvidence(p.id))}
                          <span>Explore ↗</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
      {!filtered.length && (
        <p className="trace-empty">
          No matching problems. Try a broader search or another tier.
        </p>
      )}
    </section>
  );
}
