"use client";
import { useState } from "react";
import type { Frame } from "@/lib/computer-science/models";
import {
  checkpoint,
  frameChanges,
  matchesPrediction,
} from "@/lib/learning/evidence";
import { EvidenceBoard } from "../learning/evidence-board";
import { recordLearning } from "@/lib/product/mastery";
export function PredictionCheckpoint({
  frames,
  step,
  onJump,
  onPause,
  learningId,
}: {
  frames: Frame[];
  step: number;
  onJump: (n: number) => void;
  onPause: () => void;
  learningId?: string;
}) {
  const [question, setQuestion] = useState<ReturnType<typeof checkpoint>>(null),
    [origin, setOrigin] = useState(0),
    [guess, setGuess] = useState(""),
    [revealed, setRevealed] = useState(false);
  const next = checkpoint(frames, step);
  return (
    <section className="learning-checkpoint" aria-label="Prediction checkpoint">
      <div>
        <strong>Pause and predict</strong>
        <p>Test your mental model before revealing the next recorded change.</p>
      </div>
      <button
        disabled={!next}
        onClick={() => {
          onPause();
          setOrigin(step);
          setQuestion(next);
          setGuess("");
          setRevealed(false);
        }}
      >
        Predict a change
      </button>
      {!next && !question && (
        <p>End of this trace. Rewind to try another prediction.</p>
      )}
      {question && (
        <div className="learning-question">
          <p>
            At step {question.target + 1}, what will{" "}
            <strong>{question.change.label}</strong> be? At step {origin + 1},
            it is <code>{question.change.before}</code>.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!guess.trim()) return;
              if (learningId && matchesPrediction(guess, question.change.after))
                recordLearning(
                  learningId,
                  "exercise",
                  `Predicted ${question.change.label} in the guided lab`,
                );
              onPause();
              setRevealed(true);
              onJump(question.target);
            }}
          >
            <label>
              Your prediction
              <input
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                maxLength={120}
                disabled={revealed}
                autoComplete="off"
              />
            </label>
            <button disabled={revealed || !guess.trim()}>
              Reveal and inspect
            </button>
            <button type="button" onClick={() => setQuestion(null)}>
              Close checkpoint
            </button>
          </form>
          {revealed && (
            <div role="status">
              <p>
                {matchesPrediction(guess, question.change.after)
                  ? "Your prediction matches the trace."
                  : "Compare your prediction with the recorded result."}{" "}
                Expected: <strong>{question.change.after}</strong>.
              </p>
              <p>{frames[question.target].explanation}</p>
              <EvidenceBoard
                changes={frameChanges(frames[origin], frames[question.target])}
              />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
