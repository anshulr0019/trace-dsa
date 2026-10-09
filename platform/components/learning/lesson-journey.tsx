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
}: {
  onStep: (step: JourneyStep) => void;
  disabled?: boolean;
}) {
  const [active, setActive] = useState<JourneyStep>("Understand");
  return (
    <nav className="lesson-journey" aria-label="Your learning steps">
      {journeySteps.map((step, i) => (
        <button
          key={step}
          disabled={disabled}
          aria-pressed={active === step}
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
}: {
  id: string;
  onPractice?: () => void;
}) {
  const [revision, setRevision] = useState(0),
    [status, setStatus] = useState("");
  useEffect(() => {
    const update = () => setRevision((n) => n + 1);
    update();
    window.addEventListener("trace:notebook", update);
    return () => window.removeEventListener("trace:notebook", update);
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
      <h3>{learningStatus(rows)}</h3>
      <p>
        Exploring a trace records a visit. A successful practice submission
        records whether hints or review support were used. Self-review records
        your own assessment.
      </p>
      <div className="launch-actions">
        {onPractice && (
          <button onClick={onPractice}>Test this independently →</button>
        )}
        <button
          onClick={() => {
            recordLearning(
              id,
              "self-review",
              "Learner marked the explanation reviewed",
            );
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
export function RevisionRecommendations() {
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const update = () => setRevision((n) => n + 1);
    update();
    window.addEventListener("trace:notebook", update);
    return () => window.removeEventListener("trace:notebook", update);
  }, []);
  void revision;
  const candidates = [
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
  ];
  const due = candidates
    .filter((p) => reviewDue(learningEvidence(p.id)))
    .slice(0, 3);
  const started = candidates
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
