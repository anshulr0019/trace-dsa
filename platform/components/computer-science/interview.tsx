"use client";
import { useEffect, useState } from "react";
import { TrackProject } from "../learning/track-project";
import { CourseSources } from "../learning/course-study";
import { CourseGuide } from "../learning/course-guide";
import { interviewQuestions, topics } from "@/lib/computer-science/catalog";
export type InterviewDraft = { text: string; checks: number[] };
export function InterviewPractice({
  drafts,
  onChange,
}: {
  drafts: Record<string, InterviewDraft>;
  onChange: (key: string, v: InterviewDraft) => void;
}) {
  const [filter, setFilter] = useState("all"),
    [question, setQuestion] = useState(0),
    [minutes, setMinutes] = useState(15),
    [remaining, setRemaining] = useState(900),
    [deadline, setDeadline] = useState<number | null>(null),
    [review, setReview] = useState(false);
  const ids = interviewQuestions
      .map((q, i) => ({ q, i }))
      .filter(({ q }) => filter === "all" || q.topic === filter),
    item = ids.find((x) => x.i === question) ?? ids[0];
  const key = String(item.i),
    draft = drafts[key] ?? { text: "", checks: [] };
  useEffect(() => {
    if (deadline === null) return;
    const tick = () => {
      const next = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(next);
      if (next === 0) {
        setDeadline(null);
        setReview(true);
      }
    };
    tick();
    const timer = setInterval(tick, 250);
    return () => clearInterval(timer);
  }, [deadline]);
  const choose = (id: number) => {
    setQuestion(id);
    setDeadline(null);
    setRemaining(minutes * 60);
    setReview(false);
  };
  const [reasoningStep, setReasoningStep] = useState(0);
  const reasoning = [
    {
      title: "Clarify",
      prompt:
        "State the inputs, the desired result and two assumptions you need to confirm.",
    },
    {
      title: "Compare",
      prompt:
        "Describe a straightforward approach and an alternative. Explain their costs.",
    },
    {
      title: "Trace",
      prompt:
        "Walk through a small example. Name the state that changes at each decision.",
    },
    {
      title: "Challenge",
      prompt:
        "Try a boundary or failure case. Explain why the design still works, or revise it.",
    },
  ];
  return (
    <section className="cs-interview">
      <TrackProject track="interviews" />
      <CourseSources track="interviews" />
      <div className="cs-controls">
        <label>
          Topic
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setDeadline(null);
              setRemaining(minutes * 60);
              setReview(false);
            }}
          >
            <option value="all">All topics</option>
            {topics
              .filter((t) => t.id !== "interviews")
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            <option value="dsa">DSA</option>
          </select>
        </label>
        <label>
          Prompt
          <select
            value={item.i}
            onChange={(e) => choose(Number(e.target.value))}
          >
            {ids.map(({ q, i }, n) => (
              <option value={i} key={i}>
                {n + 1}. {q.prompt.slice(0, 70)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Session length
          <select
            value={minutes}
            onChange={(e) => {
              const n = Number(e.target.value);
              setMinutes(n);
              setRemaining(n * 60);
              setDeadline(null);
            }}
          >
            {[5, 15, 30].map((n) => (
              <option value={n} key={n}>
                {n} minutes
              </option>
            ))}
          </select>
        </label>
      </div>
      <CourseGuide track="interviews" goal={item.q.prompt} />
      <article className="cs-interview-prompt">
        <small>EXPLAIN YOUR REASONING</small>
        <h2>{item.q.prompt}</h2>
        <div className="cs-timer">
          <strong role="timer" aria-label="Time remaining">
            {Math.floor(remaining / 60)}:
            {String(remaining % 60).padStart(2, "0")}
          </strong>
          <button
            className="cs-primary"
            disabled={remaining === 0}
            onClick={() =>
              setDeadline(
                deadline === null ? Date.now() + remaining * 1000 : null,
              )
            }
          >
            {deadline === null ? "Start / resume" : "Pause"}
          </button>
          <button
            onClick={() => {
              setDeadline(null);
              setRemaining(minutes * 60);
            }}
          >
            Reset timer
          </button>
        </div>
        <p className="cs-muted">
          Your answer and self-review are saved in this browser. Leaving this
          page ends the timer; your writing stays.
        </p>
      </article>
      <div className="learning-reasoning" aria-label="Reasoning walkthrough">
        {reasoning.map((r, i) => (
          <button
            key={r.title}
            aria-pressed={reasoningStep === i}
            onClick={() => setReasoningStep(i)}
          >
            <span>0{i + 1} →</span>
            {r.title}
          </button>
        ))}
      </div>
      <p role="status">{reasoning[reasoningStep].prompt}</p>
      <label className="cs-notes">
        Your answer
        <textarea
          value={draft.text}
          maxLength={20000}
          rows={12}
          placeholder="Clarify assumptions, draw the flow in words, compare choices, and explain failures…"
          onChange={(e) => onChange(key, { ...draft, text: e.target.value })}
        />
      </label>
      <button
        onClick={() => {
          setDeadline(null);
          setReview(!review);
        }}
      >
        {review ? "Hide review checklist" : "Review my answer"}
      </button>
      {review && (
        <article className="cs-review">
          <h3>Self-review checklist</h3>
          <p>
            {remaining === 0 ? "Time is up. " : ""}Check the points you
            explained clearly. This is your assessment, not an automated grade.
          </p>
          {item.q.rubric.map((point, i) => (
            <label key={point} className="cs-toggle">
              <input
                type="checkbox"
                checked={draft.checks.includes(i)}
                onChange={(e) =>
                  onChange(key, {
                    ...draft,
                    checks: e.target.checked
                      ? [...draft.checks, i]
                      : draft.checks.filter((v) => v !== i),
                  })
                }
              />
              {point}
            </label>
          ))}
          <p>
            {draft.checks.length} / {item.q.rubric.length} points covered
          </p>
        </article>
      )}
      <button
        onClick={() =>
          choose(ids[(ids.findIndex((x) => x.i === item.i) + 1) % ids.length].i)
        }
      >
        Next prompt →
      </button>
    </section>
  );
}
