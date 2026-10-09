"use client";
import { useState } from "react";
import { lessons } from "@/lib/curriculum/learning";
import { display } from "@/lib/curriculum/display";
import type { ExecutionFrame } from "@/components/curriculum/scene";
import type { SharedLesson } from "@/lib/product/lessons";
import { lessonURL } from "@/lib/product/lessons";
export function nextPrediction(
  frame: ExecutionFrame | undefined,
  next: ExecutionFrame | undefined,
) {
  if (!frame || !next || next.event === "error") return null;
  const changed = Object.entries(next.vars).find(
    ([k, v]) =>
      k !== "answer" &&
      ["number", "boolean"].includes(typeof v) &&
      Number.isFinite(typeof v === "number" ? v : 0) &&
      frame.vars[k] !== undefined &&
      display(frame.vars[k]) !== display(v),
  );
  if (!changed) return null;
  const [name, value] = changed;
  const options =
    typeof value === "boolean"
      ? ["true", "false"]
      : [
          ...new Set([
            String(value),
            String(Number(value) + 1),
            String(Number(value) - 1),
          ]),
        ];
  const offset = next.line % options.length;
  const shuffled = [...options.slice(offset), ...options.slice(0, offset)];
  return {
    name,
    answer: String(value),
    options: shuffled,
    prompt: `What will ${name} be in the next captured state?`,
    explanation: `${name} changes from ${display(frame.vars[name])} to ${display(value)}. Step forward and compare the highlighted code with this change.`,
  };
}
export function RecordedPrediction({
  question,
  onContinue,
}: {
  question: NonNullable<ReturnType<typeof nextPrediction>>;
  onContinue: () => void;
}) {
  const [choice, setChoice] = useState<string | null>(null);
  return (
    <section className="product-prediction">
      <div className="eyebrow mint">PREDICT · PLAYBACK PAUSED</div>
      <h3>{question.prompt}</h3>
      <div className="product-actions">
        {question.options.map((o) => (
          <button
            key={o}
            disabled={choice !== null}
            aria-pressed={choice === o}
            onClick={() => setChoice(o)}
          >
            {o}
          </button>
        ))}
      </div>
      {choice !== null && (
        <p role="status">
          {choice === question.answer ? "Correct. " : "Follow the change. "}
          {question.explanation}
        </p>
      )}
      <button onClick={onContinue}>
        {choice === null ? "Show through execution" : "Continue →"}
      </button>
    </section>
  );
}
export function LearningHints({ id }: { id: string }) {
  const [count, setCount] = useState(0),
    guide = lessons[id];
  return (
    <details className="product-card">
      <summary>Need a hint?</summary>
      <p>Reveal one step at a time, then explain it before continuing.</p>
      <ol>
        {guide.steps.slice(0, count).map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <button
        disabled={count >= guide.steps.length}
        onClick={() => setCount((n) => n + 1)}
      >
        {count >= guide.steps.length
          ? "All hints revealed"
          : "Reveal next hint"}
      </button>
    </details>
  );
}
export function LessonActions({
  lesson,
  step,
  onPresentation,
  presenting,
  inputError,
}: {
  lesson: SharedLesson;
  step: number;
  onPresentation: () => void;
  presenting: boolean;
  inputError?: string;
}) {
  const [message, setMessage] = useState(""),
    [link, setLink] = useState("");
  return (
    <div className="lesson-actions">
      <button onClick={onPresentation}>
        {presenting ? "Exit presentation" : "Presentation mode"}
      </button>
      <button
        onClick={() => {
          try {
            if (inputError) throw Error(inputError);
            setLink(lessonURL({ ...lesson, step }));
            setMessage(
              "Link ready. It includes the code, input, and selected step; recipients press Play to execute it.",
            );
          } catch (e) {
            setMessage(e instanceof Error ? e.message : "Cannot create link.");
          }
        }}
      >
        Share this example
      </button>
      {link && (
        <>
          <button
            onClick={() =>
              void navigator.clipboard
                .writeText(link)
                .then(() => setMessage("Lesson link copied."))
                .catch(() => setMessage("Select and copy the link below."))
            }
          >
            Copy link
          </button>
          <input
            aria-label="Shareable example link"
            readOnly
            value={link}
            onFocus={(e) => e.target.select()}
          />
        </>
      )}
      {message && <span role="status">{message}</span>}
    </div>
  );
}
export function GuidedTour() {
  const [open, setOpen] = useState(false),
    [step, setStep] = useState(0);
  const steps = [
    [
      "Start with a pattern",
      "Choose a concept from the roadmap, or try a foundation lesson.",
    ],
    [
      "Watch and question",
      "Press Play to follow the code and animation. Pause, inspect a value, or enable predictions.",
    ],
    [
      "Make it your own",
      "Change the input, explain the result in your notes, and practice a fresh case.",
    ],
    [
      "Teach with it",
      "Use Lessons & classes to share custom examples and collect student reflections.",
    ],
  ];
  return (
    <div className="product-tour">
      <button
        onClick={() => {
          setOpen(!open);
          setStep(0);
        }}
      >
        {open ? "Close tour" : "How Trace works · quick tour"}
      </button>
      {open && (
        <div role="region" aria-label="Quick tour">
          <small>
            {step + 1} / {steps.length}
          </small>
          <h2>{steps[step][0]}</h2>
          <p>{steps[step][1]}</p>
          <button
            onClick={() =>
              step === steps.length - 1 ? setOpen(false) : setStep((n) => n + 1)
            }
          >
            {step === steps.length - 1 ? "Start exploring" : "Next →"}
          </button>
        </div>
      )}
    </div>
  );
}
