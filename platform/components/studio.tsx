"use client";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  Home,
  PanelLeftClose,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Code2,
  Copy,
  Cpu,
  FlaskConical,
  Gauge,
  GitCompareArrows,
  Layers3,
  Lightbulb,
  ListFilter,
  Play,
  Pause,
  RotateCcw,
  Share2,
  SkipBack,
  SkipForward,
  Sparkles,
  Target,
  Terminal,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  lessons,
  lessonCode,
  lessonInputs,
  validateInput,
  compareAlgorithms,
  type Lesson,
} from "@/lib/lessons";
import { runCode, type Frame, type RunResult } from "@/lib/trace/interpreter";
import { Workbench } from "./experience/workbench";
import { PlaybackDock } from "./experience/playback-dock";
import { CodePanel } from "./experience/code-panel";
import { Overview } from "./experience/overview";
import { AccountProvider } from "./product/account";
import { useOwnerAccess } from "./lab/owner-access";
import { OwnerDashboard } from "./lab/owner-dashboard";
import { Classroom } from "./lab/classroom";
import "./lab/lab.css";
import { TeacherWorkspace } from "./product/teacher";
import { Notebook } from "./product/notebook";
import { GuidedTour } from "./product/learning-tools";
import "./product/product.css";
import { Curriculum } from "./curriculum/curriculum";
import { LessonPreview } from "./experience/lesson-preview";
import { ComparisonLab } from "./experience/comparison-lab";
import {
  PredictionCard,
  predictionAt,
  type Prediction,
} from "./experience/prediction";
import { Switch } from "@/components/ui/switch";
import { MotionStage, describeFrame } from "./experience/motion-stage";
import { usePlayback } from "./experience/use-playback";
import TraceWorker from "@/lib/trace/runner.worker?worker";
const initial = lessons[0];
type Saved = {
  mastered: string[];
  answered: Record<string, number[]>;
  attempts: number;
  lastLesson: string;
};
const emptySaved: Saved = {
  mastered: [],
  answered: {},
  attempts: 0,
  lastLesson: initial.id,
};
const format = (v: unknown) =>
  v === null
    ? "None"
    : typeof v === "boolean"
      ? v
        ? "True"
        : "False"
      : Array.isArray(v)
        ? `[${v.join(", ")}]`
        : String(v);
function Navigation({
  lesson,
  onLesson,
  view,
  setView,
  saved,
}: {
  lesson: Lesson;
  onLesson: (l: Lesson) => void;
  view: string;
  setView: (v: string) => void;
  saved: Saved;
}) {
  const { setOpenMobile } = useSidebar();
  const ownerAccess = useOwnerAccess();
  const navigate = (v: string) => {
    setView(v);
    setOpenMobile(false);
  };
  return (
    <Sidebar className="studio-sidebar" collapsible="offcanvas">
      <SidebarHeader>
        <a className="brand" href="/" aria-label="Trace home">
          <span className="brand-mark">
            <Layers3 size={21} />
          </span>
          trace<span className="brand-dot">.</span>
          <span className="beta">BETA</span>
        </a>
      </SidebarHeader>
      <SidebarContent>
        <div className="side-nav">
          <SidebarMenu>
            {[
              { id: "home", label: "Overview", Icon: Home },
              { id: "studio", label: "Learning studio", Icon: FlaskConical },
              { id: "library", label: "Guided foundations", Icon: BookOpen },
              { id: "curriculum", label: "100-problem roadmap", Icon: Code2 },
              { id: "progress", label: "My progress", Icon: Gauge },
              { id: "teacher", label: "Lessons & classes", Icon: BookOpen },
              { id: "notebook", label: "Student notebook", Icon: BookOpen },
              { id: "classroom", label: "Live classroom", Icon: FlaskConical },
              { id: "owner", label: "Workspace checks", Icon: Gauge },
            ]
              .filter(
                (item) =>
                  item.id !== "owner" || ownerAccess.local || ownerAccess.owner,
              )
              .map(({ id, label, Icon }) => (
                <SidebarMenuItem key={id}>
                  <SidebarMenuButton
                    isActive={view === id}
                    onClick={() => navigate(id)}
                  >
                    <Icon />
                    <span>{label}</span>
                    {view === id && <span className="nav-dot" />}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
          </SidebarMenu>
        </div>
        <div className="side-section">
          <div className="eyebrow side-label">
            YOUR LEARNING PATH <span>01</span>
          </div>
          <h3>Build your foundations</h3>
          <div className="side-progress">
            <Progress value={(saved.mastered.length / lessons.length) * 100} />
            <span>
              {saved.mastered.length} / {lessons.length}
            </span>
          </div>
          <SidebarMenu className="lesson-menu">
            {lessons.map((l, i) => (
              <SidebarMenuItem key={l.id}>
                <SidebarMenuButton
                  className="lesson-nav"
                  isActive={view === "studio" && lesson.id === l.id}
                  onClick={() => {
                    onLesson(l);
                    setOpenMobile(false);
                  }}
                >
                  <span
                    className={
                      "lesson-number " +
                      (saved.mastered.includes(l.id) ? "complete" : "")
                    }
                  >
                    {saved.mastered.includes(l.id) ? (
                      <Check size={13} />
                    ) : (
                      String(i + 1).padStart(2, "0")
                    )}
                  </span>
                  <span>{l.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>
        <div className="sidebar-note">
          <span className="tiny-symbol">
            <Lightbulb size={17} />
          </span>
          <strong>
            A little understanding,
            <br />a lot less memorizing.
          </strong>
          <p>
            Watch it. Question it.
            <br />
            Make it your own.
          </p>
        </div>
      </SidebarContent>
      <SidebarFooter>
        <div className="learner">
          <div className="avatar">Y</div>
          <div>
            <strong>Your workspace</strong>
            <span>Progress saved on this browser</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
export default function Studio() {
  const [lesson, setLesson] = useState(initial);
  const [view, setView] = useState("home");
  const [roadmapNavigation, setRoadmapNavigation] = useState(0);
  const [tab, setTab] = useState("learn");
  const [nums, setNums] = useState(initial.input);
  const [parameter, setParameter] = useState(initial.target);
  const [raw, setRaw] = useState(initial.input.join(", "));
  const [paramRaw, setParamRaw] = useState(String(initial.target));
  const [code, setCode] = useState(initial.code);
  const [executedCode, setExecutedCode] = useState(initial.code);
  const [editing, setEditing] = useState(false);
  const [custom, setCustom] = useState(false);
  const [run, setRun] = useState<RunResult>(() =>
    runCode(initial.code, lessonInputs(initial, initial.input, initial.target)),
  );
  const [speed, setSpeed] = useState("1");
  const [predicting, setPredicting] = useState(false);
  const [checkpoint, setCheckpoint] = useState<Prediction | null>(null);
  const answeredSteps = useRef(new Set<number>());
  const playback = usePlayback(run.frames.length, Number(speed), (cursor) => {
    if (!predicting || custom || answeredSteps.current.has(cursor))
      return false;
    const q = predictionAt(run.frames, cursor, lesson);
    if (!q) return false;
    setCheckpoint(q);
    return true;
  });
  const { step, setStep, playing, setPlaying } = playback;
  const [running, setRunning] = useState(false);
  const [inputError, setInputError] = useState("");
  const [notice, setNotice] = useState("");
  const [guide, setGuide] = useState(false);
  const [hint, setHint] = useState(0);
  const [about, setAbout] = useState(false);
  const [saved, setSaved] = useState<Saved>(emptySaved);
  const [storageReady, setStorageReady] = useState(false);
  const [question, setQuestion] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [filter, setFilter] = useState("All");
  const worker = useRef<Worker | null>(null);
  const requestId = useRef(0);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingStep = useRef(0);
  const frame = run.frames[Math.min(step, run.frames.length - 1)];
  const completed = step === run.frames.length - 1 && run.finished;
  const dirty = code !== executedCode;
  const runTrace = useCallback(
    (l: Lesson, values: number[], p: number, source: string, seek = 0) => {
      setPlaying(false);
      setCheckpoint(null);
      answeredSteps.current.clear();
      setRunning(true);
      setInputError("");
      setExecutedCode(source);
      pendingStep.current = seek;
      const id = ++requestId.current;
      const apply = (result: RunResult) => {
        setRun(result);
        setStep(Math.min(seek, result.frames.length - 1));
        setRunning(false);
      };
      if (worker.current) {
        worker.current.postMessage({
          id,
          code: source,
          inputs: lessonInputs(l, values, p),
        });
        if (timeout.current) clearTimeout(timeout.current);
        timeout.current = setTimeout(() => {
          worker.current?.terminate();
          worker.current = null;
          setRunning(false);
          setInputError(
            "The runner timed out. Reload the page to restart the worker.",
          );
        }, 4000);
      } else apply(runCode(source, lessonInputs(l, values, p)));
    },
    [],
  );
  const changeLesson = useCallback(
    (l: Lesson) => {
      setLesson(l);
      setNums(l.input);
      setParameter(l.target);
      setRaw(l.input.join(", "));
      setParamRaw(String(l.target));
      setCode(l.code);
      setCustom(false);
      setEditing(false);
      setView("studio");
      setTab("learn");
      setHint(0);
      setQuestion(0);
      setChoice(null);
      setChecked(false);
      runTrace(l, l.input, l.target, l.code);
      setSaved((s) => ({ ...s, lastLesson: l.id }));
      window.history.replaceState(null, "", `?lesson=${l.id}`);
    },
    [runTrace],
  );
  useEffect(() => {
    try {
      const w = new TraceWorker();
      worker.current = w;
      w.onmessage = (event) => {
        if (event.data.id !== requestId.current) return;
        if (timeout.current) clearTimeout(timeout.current);
        setRun(event.data);
        setStep(Math.min(pendingStep.current, event.data.frames.length - 1));
        setRunning(false);
      };
      w.onerror = () => {
        if (timeout.current) clearTimeout(timeout.current);
        w.terminate();
        worker.current = null;
        setRunning(false);
        setInputError("The execution worker could not load. Reload to retry.");
      };
    } catch (error) {
      console.warn("Trace worker initialization failed", error);
      setNotice(
        "Worker unavailable. The bounded interpreter will run locally.",
      );
    }
    let stored = emptySaved;
    try {
      const data = JSON.parse(
        localStorage.getItem("trace-progress-v1") || "null",
      );
      if (
        data &&
        Array.isArray(data.mastered) &&
        data.answered &&
        typeof data.attempts === "number"
      ) {
        const ids = lessons.map((l) => l.id);
        const answered: Record<string, number[]> = {};
        for (const l of lessons)
          if (Array.isArray(data.answered[l.id]))
            answered[l.id] = data.answered[l.id].filter(
              (n: unknown) =>
                typeof n === "number" && n >= 0 && n < l.questions.length,
            );
        stored = {
          mastered: data.mastered.filter((id: unknown) =>
            ids.includes(id as string),
          ),
          answered,
          attempts: data.attempts,
          lastLesson: ids.includes(data.lastLesson)
            ? data.lastLesson
            : initial.id,
        };
        setSaved(stored);
      }
    } catch {
      setNotice(
        "Browser storage is unavailable. Progress will last for this session.",
      );
    }
    setStorageReady(true);
    try {
      if (window.location.hash.startsWith("#replay=")) {
        const replay = JSON.parse(
          decodeURIComponent(window.location.hash.slice(8)),
        );
        const l = lessons.find((l) => l.id === replay.lesson);
        if (
          !l ||
          !Array.isArray(replay.nums) ||
          typeof replay.code !== "string" ||
          replay.code.length > 16000
        )
          throw new Error("Invalid replay.");
        const validated = validateInput(
          l,
          replay.nums.join(","),
          String(replay.parameter),
        );
        setView("studio");
        setLesson(l);
        setNums(validated.nums);
        setRaw(validated.nums.join(", "));
        setParameter(validated.parameter);
        setParamRaw(String(validated.parameter));
        setCode(replay.code);
        setCustom(replay.code !== lessonCode(l, validated.nums.length));
        runTrace(
          l,
          validated.nums,
          validated.parameter,
          replay.code,
          Number.isInteger(replay.step) && replay.step >= 0 ? replay.step : 0,
        );
      } else {
        const initialSearch = window.location.search;
        const initialHash = window.location.hash;
        const id =
          new URLSearchParams(window.location.search).get("lesson") ||
          stored.lastLesson;
        const l = lessons.find((l) => l.id === id);
        const requestedView = new URLSearchParams(window.location.search).get(
          "view",
        );
        const hasLesson = new URLSearchParams(window.location.search).has(
          "lesson",
        );
        if (l) changeLesson(l);
        if (!hasLesson) {
          setView(
            [
              "library",
              "progress",
              "home",
              "curriculum",
              "teacher",
              "notebook",
              "classroom",
              "owner",
            ].includes(requestedView ?? "")
              ? requestedView!
              : "home",
          );
          window.history.replaceState(
            null,
            "",
            [
              "curriculum",
              "teacher",
              "notebook",
              "classroom",
              "owner",
            ].includes(requestedView ?? "")
              ? initialSearch + initialHash
              : requestedView
                ? `?view=${requestedView}`
                : "/",
          );
        }
      }
    } catch {
      setNotice(
        "This replay link could not be read. The default lesson is ready.",
      );
    }
    return () => {
      worker.current?.terminate();
      if (timeout.current) clearTimeout(timeout.current);
    };
  }, [changeLesson, runTrace]);
  useEffect(() => {
    if (storageReady)
      try {
        localStorage.setItem("trace-progress-v1", JSON.stringify(saved));
        window.dispatchEvent(new Event("trace:notebook"));
      } catch {
        setNotice("Progress could not be saved on this browser.");
      }
  }, [saved, storageReady]);
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(id);
  }, [notice]);
  const seek = useCallback(
    (n: number) => {
      setPlaying(false);
      setCheckpoint(null);
      setStep(Math.max(0, Math.min(n, run.frames.length - 1)));
    },
    [run.frames.length],
  );
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (
        el.closest(
          'input,textarea,button,[role="slider"],[role="tab"],[role="dialog"],[role="combobox"]',
        ) ||
        view !== "studio" ||
        tab !== "learn" ||
        guide ||
        about
      )
        return;
      if (e.code === "Space") {
        e.preventDefault();
        if (!running) setPlaying((p) => !p);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        seek(step + 1);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        seek(step - 1);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [step, seek, view, tab, guide, about, running]);
  const applyInputs = () => {
    try {
      const v = validateInput(lesson, raw, paramRaw);
      setNums(v.nums);
      setParameter(v.parameter);
      const source = custom ? executedCode : lessonCode(lesson, v.nums.length);
      if (!dirty) setCode(source);
      runTrace(lesson, v.nums, v.parameter, source);
    } catch (e) {
      setInputError((e as Error).message);
    }
  };
  const runEdits = () => {
    setCustom(code !== lessonCode(lesson, nums.length));
    setEditing(false);
    runTrace(lesson, nums, parameter, code);
  };
  const resetCode = () => {
    const source = lessonCode(lesson, nums.length);
    setCode(source);
    setCustom(false);
    setEditing(false);
    runTrace(lesson, nums, parameter, source);
  };
  const randomize = () => {
    let values = Array.from(
      { length: 8 },
      () => Math.floor(Math.random() * 20) + 1,
    );
    if (lesson.sorted) values = values.sort((a, b) => a - b);
    const p =
      lesson.parameter === "k"
        ? 3
        : lesson.id === "two-sum"
          ? values[2] + values[6]
          : lesson.id === "binary-search"
            ? values[5]
            : 0;
    setRaw(values.join(", "));
    setParamRaw(String(p));
    setNums(values);
    setParameter(p);
    const source = custom ? executedCode : lessonCode(lesson, values.length);
    if (!dirty) setCode(source);
    runTrace(lesson, values, p, source);
  };
  const share = async () => {
    const url = new URL(window.location.href);
    url.search = "";
    url.hash =
      "replay=" +
      encodeURIComponent(
        JSON.stringify({
          lesson: lesson.id,
          nums,
          parameter,
          code: executedCode,
          step,
        }),
      );
    try {
      await navigator.clipboard.writeText(url.toString());
      setNotice("Replay link copied with this input, code, and step.");
    } catch {
      setNotice("Clipboard unavailable. Use Export replay to save this run.");
    }
  };
  const exportReplay = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            version: 1,
            lesson: lesson.id,
            nums,
            parameter,
            code: executedCode,
            step,
            frames: run.frames,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trace-${lesson.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const checkAnswer = () => {
    if (choice === null) return;
    setChecked(true);
    const correct = choice === lesson.questions[question].answer;
    setSaved((s) => {
      const answers = [
        ...new Set([
          ...(s.answered[lesson.id] || []),
          ...(correct ? [question] : []),
        ]),
      ];
      return {
        ...s,
        attempts: s.attempts + 1,
        answered: { ...s.answered, [lesson.id]: answers },
        mastered:
          answers.length === lesson.questions.length
            ? [...new Set([...s.mastered, lesson.id])]
            : s.mastered,
      };
    });
  };
  const comparison = useMemo(
    () => compareAlgorithms(lesson.id, nums, parameter),
    [lesson.id, nums, parameter],
  );
  useEffect(() => {
    const restore = () => {
      try {
        const value = JSON.parse(
          localStorage.getItem("trace-progress-v1") ?? "null",
        );
        if (
          value &&
          Array.isArray(value.mastered) &&
          typeof value.attempts === "number"
        )
          setSaved(value);
      } catch {}
    };
    window.addEventListener("trace:restore", restore);
    return () => window.removeEventListener("trace:restore", restore);
  }, []);
  const activeQuestion = lesson.questions[question];
  return (
    <AccountProvider>
      <SidebarProvider style={{ "--sidebar-width": "238px" } as CSSProperties}>
        <Navigation
          lesson={lesson}
          onLesson={changeLesson}
          view={view}
          setView={(v) => {
            setPlaying(false);
            setView(v);
            if (v === "curriculum") {
              setRoadmapNavigation((n) => n + 1);
              window.scrollTo({ top: 0, behavior: "instant" });
            }
            window.history.replaceState(
              null,
              "",
              v === "studio" ? `?lesson=${lesson.id}` : `?view=${v}`,
            );
          }}
          saved={saved}
        />
        <div className="main-shell">
          <header className="topbar">
            <div className="breadcrumb">
              <SidebarTrigger className="mobile-menu navigation-toggle" />
              <span>Workspace</span>
              <ChevronRight size={14} />
              <strong>
                {view === "studio"
                  ? "Learning studio"
                  : view === "library"
                    ? "Guided foundations"
                    : view === "home"
                      ? "Overview"
                      : view === "curriculum"
                        ? "100-problem roadmap"
                        : view === "teacher"
                          ? "Lessons & classes"
                          : view === "owner"
                            ? "Workspace checks"
                            : view === "classroom"
                              ? "Live classroom"
                              : view === "notebook"
                                ? "Student notebook"
                                : "My progress"}
              </strong>
            </div>
            <div className="top-actions">
              <span className="local-status">
                <span />
                Local learning workspace
              </span>
              <button
                className="icon-button"
                onClick={() => setAbout(true)}
                aria-label="About this workspace"
              >
                <Cpu size={18} />
              </button>
              <span className="avatar small">Y</span>
            </div>
          </header>
          <main
            id="main-content"
            className={`workspace ${view === "studio" && tab === "learn" ? "has-playback" : ""}`}
          >
            {view === "owner" ? (
              <OwnerDashboard />
            ) : view === "classroom" ? (
              <Classroom />
            ) : view === "teacher" ? (
              <TeacherWorkspace />
            ) : view === "notebook" ? (
              <Notebook />
            ) : view === "curriculum" ? (
              <Curriculum
                navigationRequest={roadmapNavigation}
                onExisting={(id) =>
                  changeLesson(lessons.find((l) => l.id === id)!)
                }
              />
            ) : view === "home" ? (
              <>
                <div className="product-intro">
                  <h1>Make every step of DSA visible.</h1>
                  <p>
                    Explore algorithms in four languages, predict what happens
                    next, and build lessons your students can investigate.
                  </p>
                  <GuidedTour />
                  <div className="product-actions">
                    <button
                      onClick={() => {
                        setView("curriculum");
                        window.history.replaceState(
                          null,
                          "",
                          "?view=curriculum",
                        );
                      }}
                    >
                      Explore the roadmap →
                    </button>
                    <button
                      onClick={() => {
                        setView("teacher");
                        window.history.replaceState(null, "", "?view=teacher");
                      }}
                    >
                      Create a lesson →
                    </button>
                  </div>
                  <div className="showcase-links">
                    {[
                      ["maximum-average-subarray", "Sliding window"],
                      ["binary-search-standard", "Binary search"],
                      ["maximum-depth", "Tree recursion"],
                    ].map(([id, label]) => (
                      <a key={id} href={`/?view=curriculum&problem=${id}`}>
                        {label} ↗
                      </a>
                    ))}
                  </div>
                </div>
                <button
                  className="curriculum-launch"
                  onClick={() => {
                    setView("curriculum");
                    window.history.replaceState(null, "", "?view=curriculum");
                  }}
                >
                  <span>
                    Explore your complete 100-problem roadmap
                    <small>
                      25 patterns · Python, C++, Java & JavaScript · Live
                      execution
                    </small>
                  </span>
                  <ArrowRight size={18} />
                </button>
                <Overview
                  onLesson={changeLesson}
                  onLibrary={() => setView("library")}
                  lastLesson={saved.lastLesson}
                  completed={saved.mastered.length}
                />
              </>
            ) : view === "studio" ? (
              <>
                <div className="lesson-heading">
                  <div>
                    <div className="eyebrow mint">
                      <span className="chapter-line" /> FOUNDATIONS /{" "}
                      {lesson.category.toUpperCase()}
                    </div>
                    <h1>{lesson.title}</h1>
                    <p>{lesson.description}</p>
                    <div className="lesson-meta">
                      <span className="difficulty">Foundational</span>
                      <span>
                        <BookOpen size={13} />
                        {lesson.duration}
                      </span>
                      <span>
                        <Code2 size={13} />
                        Python subset
                      </span>
                    </div>
                  </div>
                  <div className="heading-actions">
                    <button className="button secondary" onClick={share}>
                      <Share2 size={15} />
                      Share replay
                    </button>
                    <button
                      className="button guide-button"
                      onClick={() => {
                        setPlaying(false);
                        setGuide(true);
                      }}
                    >
                      <Sparkles size={15} />
                      Lesson guide
                    </button>
                  </div>
                </div>
                <Tabs
                  value={tab}
                  onValueChange={(v) => {
                    setTab(v);
                    setPlaying(false);
                  }}
                  className="lesson-tabs"
                >
                  <div className="tabs-row">
                    <TabsList className="tab-list" variant="line">
                      <TabsTrigger value="learn">
                        <FlaskConical size={16} />
                        Explore
                      </TabsTrigger>
                      <TabsTrigger value="compare">
                        <GitCompareArrows size={16} />
                        Compare approaches
                      </TabsTrigger>
                      <TabsTrigger value="practice">
                        <Target size={16} />
                        Test your understanding
                        <span className="tab-count">
                          {(saved.answered[lesson.id] || []).length}/3
                        </span>
                      </TabsTrigger>
                    </TabsList>
                    <label className="prediction-toggle">
                      <Switch
                        checked={predicting}
                        disabled={custom}
                        onCheckedChange={(v) => {
                          setPredicting(v);
                          setCheckpoint(null);
                        }}
                        aria-label="Predict the next move"
                      />{" "}
                      Predict the next move
                    </label>
                  </div>
                  <TabsContent value="learn">
                    <Workbench
                      onSwitch={() => setPlaying(false)}
                      visual={
                        <section className="visual-panel panel">
                          <div className="panel-title">
                            <span>
                              <span className="panel-icon">
                                <Layers3 size={16} />
                              </span>
                              Visualization
                            </span>
                            <span className="live-badge">
                              {running
                                ? "RUNNING"
                                : completed
                                  ? "COMPLETE"
                                  : "INTERACTIVE"}
                            </span>
                          </div>
                          <form
                            className="input-toolbar"
                            onSubmit={(e) => {
                              e.preventDefault();
                              applyInputs();
                            }}
                          >
                            <label className="array-input">
                              Input array
                              <input
                                value={raw}
                                onChange={(e) => {
                                  setPlaying(false);
                                  setRaw(e.target.value);
                                }}
                                aria-label="Input array"
                                spellCheck={false}
                              />
                            </label>
                            {lesson.parameter !== "none" && (
                              <label className="target-input">
                                {lesson.parameter === "k"
                                  ? "Window size"
                                  : "Target"}
                                <input
                                  type="number"
                                  value={paramRaw}
                                  onChange={(e) => {
                                    setPlaying(false);
                                    setParamRaw(e.target.value);
                                  }}
                                  aria-label={
                                    lesson.parameter === "k"
                                      ? "Window size"
                                      : "Target"
                                  }
                                />
                              </label>
                            )}
                            <button
                              type="submit"
                              className="button small-button"
                              disabled={running}
                            >
                              Apply
                            </button>
                            <button
                              type="button"
                              className="icon-button shuffle"
                              title="Try a random input"
                              aria-label="Try a random input"
                              onClick={randomize}
                              disabled={running}
                            >
                              <RotateCcw size={16} />
                            </button>
                          </form>
                          {inputError && (
                            <div className="inline-error" role="alert">
                              {inputError}
                            </div>
                          )}
                          {checkpoint && (
                            <PredictionCard
                              key={checkpoint.step}
                              question={checkpoint}
                              onContinue={() => {
                                answeredSteps.current.add(checkpoint.step);
                                setCheckpoint(null);
                                setPlaying(true);
                              }}
                            />
                          )}
                          <MotionStage
                            key={lesson.id}
                            frame={frame}
                            nextFrame={run.frames[playback.target] ?? frame}
                            phase={playback.phase}
                            lesson={lesson}
                            custom={custom}
                          />
                          <div
                            className="step-narrative"
                            aria-live={playing ? "off" : "polite"}
                          >
                            <span className="step-symbol">
                              <ChevronRight size={16} />
                            </span>
                            <div
                              className="step-transition"
                              key={`${step}:${frame.message}`}
                            >
                              <strong>
                                {step === 0
                                  ? "Ready when you are"
                                  : completed
                                    ? "You reached the result"
                                    : `Line ${frame.line}`}
                              </strong>
                              <p>
                                {step === 0
                                  ? "Press play, or move one step at a time. Watch the code and state change together."
                                  : describeFrame(frame, lesson, custom)}
                              </p>
                            </div>
                          </div>
                        </section>
                      }
                      code={
                        <CodePanel
                          frame={frame}
                          nextLine={
                            playback.target !== step
                              ? run.frames[playback.target]?.line
                              : undefined
                          }
                          lesson={lesson}
                          editing={editing}
                          setEditing={setEditing}
                          setPlaying={setPlaying}
                          code={code}
                          setCode={setCode}
                          executedCode={executedCode}
                          dirty={dirty}
                          custom={custom}
                          running={running}
                          error={run.error}
                          resetCode={resetCode}
                          runEdits={runEdits}
                        />
                      }
                      explanation={
                        <div className="mobile-explanation panel">
                          <span className="eyebrow mint">THE IDEA</span>
                          <h2>Every move has a reason.</h2>
                          <p>{lesson.intuition}</p>
                          <h3>What stays true</h3>
                          <p>{lesson.invariant}</p>
                          <div className="explanation-complexity">
                            <span>
                              Time <b>{lesson.complexity}</b>
                            </span>
                            <span>
                              Extra space <b>{lesson.space}</b>
                            </span>
                          </div>
                        </div>
                      }
                    />
                    <PlaybackDock
                      playback={playback}
                      count={run.frames.length}
                      speed={speed}
                      setSpeed={setSpeed}
                      running={running}
                      onSeek={seek}
                    />
                    <div className="insight-grid">
                      <section className="insight-card">
                        <div className="eyebrow">
                          <Lightbulb size={15} />
                          THE IDEA
                        </div>
                        <h2>Every move has a reason.</h2>
                        <p>{lesson.intuition}</p>
                      </section>
                      <section className="insight-card invariant">
                        <div className="eyebrow mint">
                          <CheckCircle2 size={15} />
                          WHAT STAYS TRUE
                        </div>
                        <h2>The invariant</h2>
                        <p>{lesson.invariant}</p>
                      </section>
                      <section className="complexity-card">
                        <div className="complexity-row">
                          <span>Time complexity</span>
                          <strong>{lesson.complexity}</strong>
                        </div>
                        <div className="complexity-row">
                          <span>Extra space</span>
                          <strong>{lesson.space}</strong>
                        </div>
                        <p>Reference algorithm · excluding trace storage</p>
                        <button
                          className="text-button mint"
                          onClick={() => setTab("compare")}
                        >
                          See the work saved
                          <ArrowRight size={14} />
                        </button>
                      </section>
                    </div>
                    <div className="bottom-strip">
                      <span>
                        <span className="keycap">←</span>
                        <span className="keycap">→</span>to step{" "}
                        <span className="keycap">space</span>to play or pause
                      </span>
                      <button
                        className="text-button"
                        onClick={() => setTab("practice")}
                      >
                        Ready to try it yourself?
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  </TabsContent>
                  <TabsContent value="compare">
                    <ComparisonLab
                      key={`${lesson.id}:${nums.join(",")}:${parameter}`}
                      lesson={lesson}
                      nums={nums}
                      parameter={parameter}
                    />
                  </TabsContent>
                  <TabsContent value="practice">
                    <div className="practice-layout">
                      <section className="question-card">
                        <div className="question-top">
                          <span className="eyebrow mint">
                            {question === 0
                              ? "PREDICT"
                              : question === 1
                                ? "EXPLAIN"
                                : "TRANSFER"}
                          </span>
                          <span>
                            Question {question + 1} of {lesson.questions.length}
                          </span>
                        </div>
                        <Progress
                          value={
                            ((question + 1) / lesson.questions.length) * 100
                          }
                        />
                        <h2>{activeQuestion.prompt}</h2>
                        <div
                          className="answer-options"
                          role="group"
                          aria-label="Answer choices"
                        >
                          {activeQuestion.options.map((option, i) => (
                            <button
                              key={i}
                              aria-pressed={choice === i}
                              className={
                                "answer-option " +
                                (choice === i ? "selected " : "") +
                                (checked && i === activeQuestion.answer
                                  ? "correct "
                                  : checked && i === choice
                                    ? "incorrect"
                                    : "")
                              }
                              onClick={() => {
                                if (!checked) setChoice(i);
                              }}
                              disabled={checked}
                            >
                              <span className="answer-letter">
                                {String.fromCharCode(65 + i)}
                              </span>
                              <span>{option}</span>
                              {checked && i === activeQuestion.answer && (
                                <CheckCircle2 size={18} />
                              )}
                            </button>
                          ))}
                        </div>
                        {checked && (
                          <div
                            className={
                              "answer-feedback " +
                              (choice === activeQuestion.answer
                                ? "success"
                                : "")
                            }
                            role="status"
                          >
                            <strong>
                              {choice === activeQuestion.answer
                                ? "That’s right."
                                : "Let’s look at the reasoning."}
                            </strong>
                            <p>{activeQuestion.explanation}</p>
                          </div>
                        )}
                        <div className="question-actions">
                          <button
                            className="text-button muted"
                            onClick={() => {
                              setTab("learn");
                            }}
                          >
                            Back to the visualization
                          </button>
                          {!checked ? (
                            <button
                              className="button"
                              disabled={choice === null}
                              onClick={checkAnswer}
                            >
                              Check answer
                              <ArrowRight size={15} />
                            </button>
                          ) : question < lesson.questions.length - 1 ? (
                            <button
                              className="button"
                              onClick={() => {
                                setQuestion((q) => q + 1);
                                setChoice(null);
                                setChecked(false);
                              }}
                            >
                              Next question
                              <ArrowRight size={15} />
                            </button>
                          ) : (
                            <button
                              className="button"
                              onClick={() => {
                                setQuestion(0);
                                setChoice(null);
                                setChecked(false);
                                setNotice(
                                  "Practice restarted. Your correct answers remain saved.",
                                );
                              }}
                            >
                              Practice again
                              <RotateCcw size={15} />
                            </button>
                          )}
                        </div>
                      </section>
                      <aside className="practice-aside">
                        <div className="practice-icon">
                          <Target size={28} />
                        </div>
                        <h2>Make the idea yours.</h2>
                        <p>
                          Understanding means being able to predict, explain,
                          and apply. Take your time.
                        </p>
                        <div className="practice-progress">
                          <CheckCircle2 size={18} />
                          <span>
                            {(saved.answered[lesson.id] || []).length} of 3
                            concepts checked
                          </span>
                        </div>
                        {saved.mastered.includes(lesson.id) && (
                          <div className="mastered-note">
                            <Trophy size={20} />
                            <strong>Lesson completed</strong>
                            <p>
                              Try a new input, then come back tomorrow to see
                              what you remember.
                            </p>
                          </div>
                        )}
                        <button
                          className="text-button mint"
                          onClick={() => setGuide(true)}
                        >
                          Need a nudge?
                          <Lightbulb size={15} />
                        </button>
                        <p className="practice-note">
                          Completion reflects these knowledge checks, not a
                          guarantee of independent mastery.
                        </p>
                      </aside>
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            ) : view === "library" ? (
              <>
                <div className="page-heading">
                  <div className="eyebrow mint">YOUR NEXT AHA MOMENT</div>
                  <h1>Small lessons. Lasting understanding.</h1>
                  <p>
                    Six guided introductions with visual explanations and
                    checkpoints. Then use the 100-problem roadmap to practice
                    these ideas across more problems.
                  </p>
                </div>
                <div className="library-filter">
                  <ListFilter size={16} />
                  {[
                    "All",
                    "Arrays",
                    "Search",
                    "Two pointers",
                    "Sliding window",
                    "Sorting",
                  ].map((f) => (
                    <button
                      className={filter === f ? "selected" : ""}
                      key={f}
                      onClick={() => setFilter(f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <div className="library-grid">
                  {lessons
                    .filter((l) => filter === "All" || l.category === filter)
                    .map((l, i) => (
                      <button
                        className="library-card"
                        key={l.id}
                        onClick={() => changeLesson(l)}
                      >
                        <LessonPreview lesson={l} />
                        <div className="library-card-content">
                          <div className="eyebrow">
                            {l.category}
                            {saved.mastered.includes(l.id) && (
                              <CheckCircle2 size={16} />
                            )}
                          </div>
                          <h2>{l.title}</h2>
                          <p>{l.description}</p>
                          <div className="library-bottom">
                            <span>
                              {l.duration} · {l.complexity}
                            </span>
                            <ArrowUpRight size={18} />
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              </>
            ) : (
              <>
                <div className="page-heading">
                  <div className="eyebrow mint">ONE IDEA AT A TIME</div>
                  <h1>Your understanding is taking shape.</h1>
                  <p>
                    Progress stays on this browser. Revisit a lesson whenever
                    you need a refresher.
                  </p>
                </div>
                <div className="progress-stats">
                  <div>
                    <span>Lessons mastered</span>
                    <strong>
                      {saved.mastered.length}
                      <small> / 6</small>
                    </strong>
                  </div>
                  <div>
                    <span>Concepts checked</span>
                    <strong>
                      {Object.values(saved.answered).reduce(
                        (s, a) => s + a.length,
                        0,
                      )}
                      <small> / 18</small>
                    </strong>
                  </div>
                  <div>
                    <span>Practice attempts</span>
                    <strong>{saved.attempts}</strong>
                  </div>
                </div>
                <section className="progress-list panel">
                  <div className="panel-title">
                    <span>
                      <BookOpen size={17} />
                      Your foundations
                    </span>
                    <span>
                      {Math.round((saved.mastered.length / 6) * 100)}% complete
                    </span>
                  </div>
                  {lessons.map((l, i) => (
                    <button
                      className="progress-lesson"
                      key={l.id}
                      onClick={() => changeLesson(l)}
                    >
                      <span className="progress-number">
                        {saved.mastered.includes(l.id) ? (
                          <CheckCircle2 size={20} />
                        ) : (
                          String(i + 1).padStart(2, "0")
                        )}
                      </span>
                      <div>
                        <h3>{l.title}</h3>
                        <p>
                          {l.category} · {l.duration}
                        </p>
                      </div>
                      <Progress
                        value={((saved.answered[l.id] || []).length / 3) * 100}
                      />
                      <span>{(saved.answered[l.id] || []).length}/3</span>
                      <ArrowRight size={17} />
                    </button>
                  ))}
                </section>
              </>
            )}
          </main>
          <footer className="app-footer">
            <span>
              trace. <span>Understand the why.</span>
            </span>
            <button
              className="text-button muted"
              onClick={() => setAbout(true)}
            >
              About this workspace
              <ArrowUpRight size={13} />
            </button>
          </footer>
        </div>
        <Dialog open={guide} onOpenChange={setGuide}>
          <DialogContent className="guide-dialog">
            <DialogHeader>
              <div className="dialog-icon">
                <Lightbulb size={24} />
              </div>
              <DialogTitle>One nudge at a time.</DialogTitle>
              <DialogDescription>
                Authored guidance for {lesson.title.toLowerCase()}. These hints
                explain the reference algorithm.
              </DialogDescription>
            </DialogHeader>
            <div className="guide-state">
              <span className="eyebrow">YOUR CURRENT STEP</span>
              <p>{frame.message}</p>
            </div>
            {lesson.hints.slice(0, hint + 1).map((h, i) => (
              <div className="hint" key={i}>
                <span>0{i + 1}</span>
                <p>{h}</p>
              </div>
            ))}
            <button
              className="button"
              disabled={hint >= lesson.hints.length - 1}
              onClick={() => setHint((h) => h + 1)}
            >
              {hint >= lesson.hints.length - 1
                ? "All hints revealed"
                : "Give me another nudge"}
              <ArrowRight size={15} />
            </button>
            <p className="dialog-footnote">
              A lesson guide, with no AI service connected.
            </p>
          </DialogContent>
        </Dialog>
        <Dialog open={about} onOpenChange={setAbout}>
          <DialogContent className="about-dialog">
            <DialogHeader>
              <DialogTitle>Built for understanding.</DialogTitle>
              <DialogDescription>
                Trace combines six guided foundations with a 100-problem
                practice roadmap.
              </DialogDescription>
            </DialogHeader>
            <p>
              The six guided foundations run in your browser using a bounded
              educational Python subset. It supports numeric lists, variables,
              indexing, arithmetic, comparisons, if/else, for/range, while,
              break, len, min, max, and abs. Use spaces for indentation.
            </p>
            <p>
              Imports, strings, functions, recursion, classes, and external
              access are not supported. Runs stop after 2,400 steps. No code is
              sent to an execution server from these guided lessons. The
              100-problem roadmap uses a separate full-language execution
              service.
            </p>
            <p>
              Lesson completion and practice answers are saved on this browser.
              Accounts, cloud sync, AI tutoring, and multiplayer are not
              connected in this version.
            </p>
            <button className="button secondary" onClick={exportReplay}>
              <Copy size={15} />
              Export current replay
            </button>
          </DialogContent>
        </Dialog>
        {notice && (
          <div className="toast" role="status">
            <CheckCircle2 size={18} />
            <span>{notice}</span>
            <button
              onClick={() => setNotice("")}
              aria-label="Dismiss notification"
            >
              <X size={15} />
            </button>
          </div>
        )}
      </SidebarProvider>
    </AccountProvider>
  );
}
