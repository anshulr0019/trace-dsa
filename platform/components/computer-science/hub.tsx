"use client";
import { useEffect, useState } from "react";
import {
  topics,
  modules,
  moduleById,
  interviewQuestions,
  type TopicId,
} from "@/lib/computer-science/catalog";
import { defaultSettings, type Settings } from "@/lib/computer-science/models";
import { validArchitecture } from "@/lib/computer-science/architecture";
import { GuidedLab, type Scenario } from "./guided-lab";
import { InterviewPractice, type InterviewDraft } from "./interview";
import { initialScenario } from "@/lib/computer-science/examples";
import {
  trackModules,
  stages,
  stageFor,
  neighbors,
} from "@/lib/computer-science/roadmaps";
import "./styles.css";
type Study = {
  completed: string[];
  notes: Record<string, string>;
  scenarios: Record<string, Scenario>;
  drafts: Record<string, InterviewDraft>;
};
const empty: Study = { completed: [], notes: {}, scenarios: {}, drafts: {} };
const storageKey = "trace-computer-science-v1";
function readStudy(raw: string | null): Study {
  if (!raw) return empty;
  const v = JSON.parse(raw),
    result: Study = { completed: [], notes: {}, scenarios: {}, drafts: {} };
  if (!v || typeof v !== "object") return result;
  result.completed = Array.isArray(v.completed)
    ? v.completed.filter(
        (id: unknown) =>
          typeof id === "string" && modules.some((m) => m.id === id),
      )
    : [];
  for (const m of modules) {
    if (typeof v.notes?.[m.id] === "string")
      result.notes[m.id] = v.notes[m.id].slice(0, 10000);
    const saved = v.scenarios?.[m.id];
    if (saved && validArchitecture(saved.architecture)) {
      const settings = { ...defaultSettings };
      for (const key of Object.keys(defaultSettings) as (keyof Settings)[]) {
        const val = saved.settings?.[key];
        if (key === "subscribers") {
          if (Array.isArray(val))
            settings.subscribers = [
              ...new Set(
                val.filter(
                  (x: unknown): x is string =>
                    typeof x === "string" &&
                    ["chart", "alert", "audit"].includes(x),
                ),
              ),
            ];
        } else if (
          typeof val === typeof defaultSettings[key] &&
          (typeof val !== "number" || Number.isFinite(val))
        ) {
          Object.assign(settings, {
            [key]: typeof val === "string" ? val.slice(0, 100) : val,
          });
        }
      }
      result.scenarios[m.id] = { settings, architecture: saved.architecture };
    }
  }
  for (let i = 0; i < interviewQuestions.length; i++) {
    const d = v.drafts?.[String(i)];
    if (d && typeof d.text === "string" && Array.isArray(d.checks))
      result.drafts[String(i)] = {
        text: d.text.slice(0, 20000),
        checks: [
          ...new Set<number>(
            d.checks.filter(
              (n: unknown): n is number =>
                typeof n === "number" && Number.isInteger(n) && n >= 0 && n < 4,
            ),
          ),
        ],
      };
  }
  return result;
}
export default function ComputerScience() {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [reviewFilter, setReviewFilter] = useState("all");
  const [topic, setTopic] = useState<TopicId | null>(null),
    [moduleId, setModuleId] = useState<string | null>(null),
    [study, setStudy] = useState<Study>(empty),
    [ready, setReady] = useState(false),
    [status, setStatus] = useState("Loading saved work…"),
    [choice, setChoice] = useState<number | null>(null),
    [checked, setChecked] = useState(false);
  useEffect(() => {
    const p = new URLSearchParams(window.location.search),
      m = modules.find((m) => m.id === p.get("module")),
      t = topics.find((t) => t.id === p.get("topic"));
    setTopic(m?.topic ?? t?.id ?? null);
    setModuleId(m?.id ?? null);
    try {
      setStudy(readStudy(localStorage.getItem(storageKey)));
      setStatus("Saved on this browser");
    } catch {
      setStatus(
        "Saved work could not be read. New work stays in this session.",
      );
    }
    setReady(true);
  }, []);
  const save = (next: Study) => {
    setStudy(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setStatus("Saved on this browser");
    } catch {
      setStatus(
        "Browser storage is unavailable or full. New work stays in this session.",
      );
    }
  };
  const navigate = (t: TopicId | null, id: string | null = null) => {
    setSearch("");
    setStageFilter("all");
    setReviewFilter("all");
    setTopic(t);
    setModuleId(id);
    setChoice(null);
    setChecked(false);
    const p = new URLSearchParams({ view: "cs" });
    if (t) p.set("topic", t);
    if (id) p.set("module", id);
    window.history.replaceState(null, "", `?${p}`);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const m = moduleId ? moduleById[moduleId] : undefined,
    track = topics.find((t) => t.id === topic);
  const path = topic ? trackModules(topic) : [];
  const remaining = path.find((item) => !study.completed.includes(item.id));
  const filtered = path.filter(
    (item) =>
      (stageFilter === "all" || stageFor(item.id) === stageFilter) &&
      (reviewFilter === "all" ||
        study.completed.includes(item.id) === (reviewFilter === "reviewed")) &&
      `${item.title} ${item.summary}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const adjacent = m ? neighbors(m.id) : {};
  if (!ready) return <p>Loading computer science labs…</p>;
  return (
    <div className="cs-hub">
      <nav className="cs-breadcrumb" aria-label="Computer science navigation">
        <button onClick={() => navigate(null)}>All topics</button>
        {track && (
          <>
            <span>/</span>
            <button onClick={() => navigate(track.id)}>{track.title}</button>
          </>
        )}
        {m && (
          <>
            <span>/</span>
            <span>{m.title}</span>
          </>
        )}
      </nav>
      <header className="cs-heading">
        <div>
          <small>
            {m ? "GUIDED LAB" : topic ? "LEARNING TRACK" : "BEYOND ALGORITHMS"}
          </small>
          <h1>
            {m?.title ?? track?.title ?? "Make computer science visible."}
          </h1>
          <p>
            {m?.summary ??
              track?.subtitle ??
              "Follow requests, inspect data, schedule processes, and explain the decisions behind the code."}
          </p>
        </div>
        <span className="cs-save-status" role="status">
          {status}
        </span>
      </header>
      {!topic && (
        <>
          <div className="cs-cards">
            {topics.map((t) => {
              const list = modules.filter((m) => m.topic === t.id),
                done = list.filter((m) =>
                  study.completed.includes(m.id),
                ).length;
              return (
                <button
                  className="cs-topic-card"
                  key={t.id}
                  onClick={() => navigate(t.id)}
                >
                  <small>{t.symbol} / EXPLORE</small>
                  <h2>{t.title}</h2>
                  <p>{t.subtitle}</p>
                  <footer>
                    {t.id === "interviews"
                      ? `${interviewQuestions.length} interview prompts`
                      : `${list.length} interactive labs · ${done} reviewed`}
                    <span>↗</span>
                  </footer>
                </button>
              );
            })}
          </div>
          <p className="cs-muted">
            {modules.length} interactive labs across five technical tracks, plus
            interview practice. Your notes, scenarios, and reviewed lessons are
            stored locally in this browser.
          </p>
        </>
      )}
      {topic === "interviews" && (
        <InterviewPractice
          drafts={study.drafts}
          onChange={(key, draft) =>
            save({ ...study, drafts: { ...study.drafts, [key]: draft } })
          }
        />
      )}
      {topic && topic !== "interviews" && !m && (
        <>
          <section className="cs-track-progress">
            <div>
              <small>YOUR LEARNING PATH</small>
              <h2>
                {
                  path.filter((item) => study.completed.includes(item.id))
                    .length
                }{" "}
                / {path.length} labs reviewed
              </h2>
              <p>
                Follow the stages in order, or open any lesson. Review flags
                reflect your own assessment.
              </p>
              <progress
                aria-label="Track reviewed progress"
                value={
                  path.filter((item) => study.completed.includes(item.id))
                    .length
                }
                max={path.length}
              />
            </div>
            {remaining && (
              <button
                className="cs-primary"
                onClick={() => navigate(topic, remaining.id)}
              >
                Continue: {remaining.title} →
              </button>
            )}
          </section>
          <div className="cs-controls">
            <label>
              Find a lesson
              <input
                type="search"
                value={search}
                placeholder="Search concepts or lesson titles"
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <label>
              Stage
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
              >
                <option value="all">All stages</option>
                {stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Review status
              <select
                value={reviewFilter}
                onChange={(e) => setReviewFilter(e.target.value)}
              >
                <option value="all">All lessons</option>
                <option value="unreviewed">Not yet reviewed</option>
                <option value="reviewed">Reviewed</option>
              </select>
            </label>
          </div>
          {filtered.length === 0 && (
            <p role="status">
              No lessons match these filters. Try a different search or stage.
            </p>
          )}
          {stages.map((stage) => {
            const items = filtered.filter(
              (item) => stageFor(item.id) === stage.id,
            );
            return (
              items.length > 0 && (
                <section key={stage.id}>
                  <header className="cs-stage-heading">
                    <h2>{stage.title}</h2>
                    <p>{stage.description}</p>
                  </header>
                  <div className="cs-cards">
                    {items.map((item) => (
                      <button
                        className="cs-topic-card"
                        key={item.id}
                        onClick={() => navigate(topic, item.id)}
                      >
                        <small>
                          LAB {String(path.indexOf(item) + 1).padStart(2, "0")}{" "}
                          · {item.minutes} MIN · 3 EXAMPLES
                        </small>
                        <h2>{item.title}</h2>
                        <p>{item.summary}</p>
                        <footer>
                          {study.completed.includes(item.id)
                            ? "✓ Reviewed"
                            : "Open guided lab"}
                          <span>→</span>
                        </footer>
                      </button>
                    ))}
                  </div>
                </section>
              )
            );
          })}
        </>
      )}
      {m && (
        <>
          <div className="cs-section-head">
            <span>
              {stages.find((stage) => stage.id === stageFor(m.id))?.title}
            </span>
            {adjacent.previous && (
              <button onClick={() => navigate(m.topic, adjacent.previous!.id)}>
                ← Previous: {adjacent.previous.title}
              </button>
            )}
          </div>
          <GuidedLab
            key={m.id}
            module={m}
            scenario={study.scenarios[m.id] ?? initialScenario(m.id)}
            onChange={(scenario) =>
              save({
                ...study,
                scenarios: { ...study.scenarios, [m.id]: scenario },
              })
            }
          />
          {adjacent.next && (
            <div className="cs-next-lesson">
              <span>UP NEXT IN YOUR PATH</span>
              <button onClick={() => navigate(m.topic, adjacent.next!.id)}>
                {adjacent.next.title} →
              </button>
            </div>
          )}
          <div className="cs-study-grid">
            <section className="cs-review">
              <small>CHECK YOUR UNDERSTANDING</small>
              <h3>{m.quiz.question}</h3>
              <fieldset>
                <legend className="cs-sr-only">Choose your answer</legend>
                {m.quiz.choices.map((text, i) => (
                  <label className="cs-toggle" key={text}>
                    <input
                      type="radio"
                      name={`quiz-${m.id}`}
                      checked={choice === i}
                      onChange={() => {
                        setChoice(i);
                        setChecked(false);
                      }}
                    />
                    {text}
                  </label>
                ))}
              </fieldset>
              <button
                disabled={choice === null}
                onClick={() => setChecked(true)}
              >
                Check answer
              </button>
              {checked && (
                <p
                  role="status"
                  className={
                    choice === m.quiz.answer ? "cs-success" : "cs-error"
                  }
                >
                  {choice === m.quiz.answer ? "Correct. " : "Try again. "}
                  {m.quiz.explanation}
                </p>
              )}
            </section>
            <label className="cs-notes">
              Your notes
              <textarea
                rows={7}
                maxLength={10000}
                placeholder="What changed? Why did it happen? What would you try next?"
                value={study.notes[m.id] ?? ""}
                onChange={(e) =>
                  save({
                    ...study,
                    notes: { ...study.notes, [m.id]: e.target.value },
                  })
                }
              />
            </label>
          </div>
          <div className="cs-section-head">
            <label className="cs-toggle">
              <input
                type="checkbox"
                checked={study.completed.includes(m.id)}
                onChange={(e) =>
                  save({
                    ...study,
                    completed: e.target.checked
                      ? [...study.completed, m.id]
                      : study.completed.filter((id) => id !== m.id),
                  })
                }
              />
              Mark this lesson reviewed
            </label>
            <button onClick={() => navigate(m.topic)}>
              Back to {track?.title} →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
