"use client";
import {
  teachingReferences,
  type LearningTrack,
} from "@/lib/learning/references";
import "./learning.css";
export function CourseGuide({
  track,
  goal,
  challenge,
}: {
  track: LearningTrack;
  goal: string;
  challenge?: string;
}) {
  const ref = teachingReferences[track];
  return (
    <details className="learning-guide">
      <summary>
        Learn this actively{" "}
        <span>Predict · observe · experiment · explain</span>
      </summary>
      <div className="learning-route">
        <article>
          <small>01 / UNDERSTAND</small>
          <h3>What are we solving?</h3>
          <p>{goal}</p>
        </article>
        <article>
          <small>02 / PREDICT & WATCH</small>
          <h3>Make a prediction</h3>
          <p>{ref.observe}</p>
        </article>
        <article>
          <small>03 / EXPERIMENT</small>
          <h3>Change one condition</h3>
          <p>{challenge || ref.experiment}</p>
        </article>
        <article>
          <small>04 / EXPLAIN</small>
          <h3>Use the evidence</h3>
          <p>
            Point to a changed value or a decision in the trace. Explain what
            caused it and when your explanation would stop applying.
          </p>
        </article>
      </div>
      <footer>
        <p>{ref.method}</p>
        <a href={ref.url} target="_blank" rel="noreferrer">
          Further study: {ref.name} ↗
        </a>
      </footer>
    </details>
  );
}
