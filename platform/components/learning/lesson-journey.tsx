"use client";
import { useEffect, useState } from "react";
import {
  learningEvidence,
  learningStatus,
  recordLearning,
  reviewDue,
} from "@/lib/product/mastery";
import { modules } from "@/lib/computer-science/catalog";
import { lessons as foundations } from "@/lib/lessons";
import { problems } from "@/lib/curriculum/catalog";
import "./launch.css";
export const journeySteps = [
  "Understand",
  "Watch",
  "Try",
  "Solve",
  "Review",
] as const;
export type JourneyStep = (typeof journeySteps)[number];
export function LessonJourney({
  onStep,
  disabled = false,
  active: selected,
}: {
  onStep: (step: JourneyStep) => void;
  disabled?: boolean;
  active?: JourneyStep;
}) {
  const [active, setActive] = useState<JourneyStep>("Watch");
  return (
    <nav className="lesson-journey" aria-label="Your learning steps">
      {journeySteps.map((step, i) => (
        <button
          key={step}
          disabled={disabled}
          aria-pressed={(selected ?? active) === step}
          onClick={() => {
            setActive(step);
            onStep(step);
          }}
        >
          <span>0{i + 1}</span>
          {step}
        </button>
      ))}
    </nav>
  );
}
export function MasteryPanel({
  id,
  onPractice,
  onSelfReview,
}: {
  id: string;
  onPractice?: () => void;
  onSelfReview?: () => void;
}) {
  const [revision, setRevision] = useState(0),
    [status, setStatus] = useState("");
  useEffect(() => {
    const update = () => setRevision((n) => n + 1);
    update();
    window.addEventListener("trace:notebook", update);
    window.addEventListener("trace:restore", update);
    return () => {
      window.removeEventListener("trace:notebook", update);
      window.removeEventListener("trace:restore", update);
    };
  }, [id]);
  void revision;
  const rows = learningEvidence(id);
  return (
    <section
      id={`review-${id}`}
      className="launch-card"
      aria-label="Learning evidence"
    >
      <small>YOUR LEARNING EVIDENCE</small>
      <h3>{reviewDue(rows) ? "Due for revision" : learningStatus(rows)}</h3>
      <ol className="mastery-path" aria-label="Your progress">
        {[
          "Explored",
          "Practised",
          "Solved independently",
          "Due for revision",
        ].map((label, i) => (
          <li
            key={label}
            className={
              (i === 0 && rows.length) ||
              (i === 1 &&
                rows.some((r) =>
                  ["exercise", "assisted", "independent"].includes(r.kind),
                )) ||
              (i === 2 && rows.some((r) => r.kind === "independent")) ||
              (i === 3 && reviewDue(rows))
                ? "reached"
                : ""
            }
          >
            {label}
          </li>
        ))}
      </ol>
      <p>
        Exploring a trace records a visit. Correct visual predictions record
        practice. A successful code submission records whether hints or review
        support were used. Self-review records your own assessment.
      </p>
      <div className="launch-actions">
        {onPractice && (
          <button onClick={onPractice}>Continue practice →</button>
        )}
        <button
          onClick={() => {
            recordLearning(
              id,
              "self-review",
              "Learner marked the explanation reviewed",
            );
            onSelfReview?.();
            setStatus(
              "Self-review saved. Complete a practice submission to record a solved result.",
            );
          }}
        >
          I can explain the idea
        </button>
      </div>
      {reviewDue(rows) && (
        <p>Time to revisit this concept with a fresh input.</p>
      )}
      <p role="status">{status}</p>
      <ol className="evidence-history">
        {rows
          .slice(-4)
          .reverse()
          .map((r, i) => (
            <li key={`${r.at}:${i}`}>
              <strong>
                {r.kind === "watched"
                  ? "Explored"
                  : r.kind === "exercise"
                    ? "Practised a visual exercise"
                    : r.kind === "assisted"
                      ? "Solved with support"
                      : r.kind === "independent"
                        ? "Solved independently"
                        : "Self-reviewed"}
              </strong>
              <span>
                {r.detail} · {new Date(r.at).toLocaleDateString()}
              </span>
            </li>
          ))}
      </ol>
    </section>
  );
}
export function LearningBadge({
  id,
  onClick,
}: {
  id: string;
  onClick?: () => void;
}) {
  const [, refresh] = useState(0);
  useEffect(() => {
    const update = () => refresh((n) => n + 1);
    window.addEventListener("trace:notebook", update);
    window.addEventListener("trace:restore", update);
    update();
    return () => {
      window.removeEventListener("trace:notebook", update);
      window.removeEventListener("trace:restore", update);
    };
  }, [id]);
  const rows = learningEvidence(id);
  const label = reviewDue(rows) ? "Due for revision" : learningStatus(rows);
  return (
    <button
      className="learning-badge"
      onClick={onClick}
      title="View your learning progress"
    >
      {label} <span>→</span>
    </button>
  );
}
const learningTargets = [
  ...problems.map((p) => ({
    id: p.id,
    title: p.title,
    url: `/?view=curriculum&problem=${p.id}&practice=1`,
  })),
  ...modules.map((m) => ({
    id: `cs:${m.id}`,
    title: m.title,
    url: `/?view=cs&topic=${m.topic}&module=${m.id}`,
  })),
  ...foundations.map((l) => ({
    id: `foundation:${l.id}`,
    title: l.title,
    url: `/?lesson=${l.id}`,
  })),
  {
    id: "project:databases",
    title: "SQLite project practice",
    url: "/?view=cs&topic=databases",
  },
];

export function RevisionRecommendations() {
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const update = () => setRevision((n) => n + 1);
    update();
    window.addEventListener("trace:notebook", update);
    return () => window.removeEventListener("trace:notebook", update);
  }, []);
  void revision;
  const due = learningTargets
    .filter((p) => reviewDue(learningEvidence(p.id)))
    .slice(0, 3);
  const started = learningTargets
    .filter((p) => {
      const r = learningEvidence(p.id);
      return r.length && !r.some((e) => e.kind === "independent");
    })
    .slice(0, 3);
  const picks = due.length ? due : started;
  if (!picks.length) return null;
  return (
    <section className="launch-card">
      <small>YOUR NEXT SESSION</small>
      <h2>
        {due.length ? "Ready for revision" : "Turn exploration into practice"}
      </h2>
      <p>
        These suggestions use your recorded activity. Revisit supported work
        after two days and independent work after seven.
      </p>
      <div className="launch-actions">
        {picks.map((p) => (
          <a key={p.id} href={p.url}>
            {p.title} →
          </a>
        ))}
      </div>
    </section>
  );
}

export function LearningDashboard() {
  const [, refresh] = useState(0);
  useEffect(() => {
    const update = () => refresh((n) => n + 1);
    update();
    window.addEventListener("trace:notebook", update);
    window.addEventListener("trace:restore", update);
    return () => {
      window.removeEventListener("trace:notebook", update);
      window.removeEventListener("trace:restore", update);
    };
  }, []);
  const started = learningTargets
    .map((target) => ({ ...target, rows: learningEvidence(target.id) }))
    .filter((t) => t.rows.length);
  const stats = [
    ["Explored", started.length],
    [
      "Practised",
      started.filter((t) =>
        t.rows.some((e) =>
          ["exercise", "assisted", "independent"].includes(e.kind),
        ),
      ).length,
    ],
    [
      "Solved independently",
      started.filter((t) => t.rows.some((e) => e.kind === "independent"))
        .length,
    ],
    ["Due for revision", started.filter((t) => reviewDue(t.rows)).length],
  ];
  return (
    <section className="launch-card">
      <small>YOUR PROGRESS ACROSS ALL TRACKS</small>
      <div className="learning-stat-grid">
        {stats.map(([label, count]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{count}</strong>
          </div>
        ))}
      </div>
      <p>
        Visual exercises and quizzes record practice. Passing a fresh code or
        SQL task independently records a solved result.
      </p>
      <div className="learning-recent-list">
        {started
          .sort(
            (a, b) =>
              Date.parse(b.rows.at(-1)!.at) - Date.parse(a.rows.at(-1)!.at),
          )
          .slice(0, 8)
          .map((t) => (
            <a key={t.id} href={t.url}>
              <strong>{t.title}</strong>
              <span>
                {reviewDue(t.rows)
                  ? "Due for revision"
                  : learningStatus(t.rows)}{" "}
                →
              </span>
            </a>
          ))}
      </div>
      {!started.length && (
        <p>
          Open a lesson, try a prediction, or solve a fresh case to start your
          progress.
        </p>
      )}
      <RevisionRecommendations />
    </section>
  );
}
