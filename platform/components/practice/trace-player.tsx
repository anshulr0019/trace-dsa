"use client";
import { useState } from "react";
import { Play, Pause, ArrowLeft, ArrowRight } from "lucide-react";
import type { Problem } from "@/lib/curriculum/catalog";
import type { PracticeRun } from "@/lib/practice/types";
import { Scene } from "../curriculum/scene";
import { ExecutionInspector } from "../curriculum/execution-inspector";
import { useFramePlayback } from "../curriculum/use-frame-playback";

export function TracePlayer({
  run,
  problem,
  input,
  language,
  code,
}: {
  run: PracticeRun;
  problem: Problem;
  input: Record<string, unknown>;
  language: string;
  code: string;
}) {
  const [speed, setSpeed] = useState(1);
  const { step, setStep, playing, setPlaying } = useFramePlayback(
    run.frames.length,
    speed,
  );
  const frame = run.frames[step];
  return (
    <section className="practice-trace" aria-label="Your solution playback">
      <div className="practice-section-heading">
        <h3>Your code, step by step</h3>
        <span>
          {step + 1} / {run.frames.length} states
        </span>
      </div>
      {run.error && (
        <p className="practice-error" role="alert">
          {run.error}
        </p>
      )}
      <Scene
        problem={problem}
        input={input}
        frame={frame}
        previous={run.frames[step - 1]}
        language={language}
        speed={speed}
      />
      <ExecutionInspector
        frame={frame}
        previous={run.frames[step - 1]}
        code={code}
      />
      <div className="practice-actions">
        <button
          aria-label="Previous practice step"
          disabled={step === 0}
          onClick={() => {
            setPlaying(false);
            setStep((s) => s - 1);
          }}
        >
          <ArrowLeft size={16} />
        </button>
        <button
          disabled={run.frames.length < 2}
          onClick={() => {
            if (step === run.frames.length - 1) setStep(0);
            setPlaying((v) => !v);
          }}
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}{" "}
          {playing ? "Pause" : "Play"}
        </button>
        <button
          aria-label="Next practice step"
          disabled={step >= run.frames.length - 1}
          onClick={() => {
            setPlaying(false);
            setStep((s) => s + 1);
          }}
        >
          <ArrowRight size={16} />
        </button>
        <select
          aria-label="Practice playback speed"
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
        >
          {[0.5, 1, 2, 4].map((s) => (
            <option key={s} value={s}>
              {s}× speed
            </option>
          ))}
        </select>
      </div>
      <input
        className="practice-scrubber"
        aria-label="Practice trace position"
        type="range"
        min={0}
        max={Math.max(0, run.frames.length - 1)}
        value={step}
        onChange={(e) => {
          setPlaying(false);
          setStep(Number(e.target.value));
        }}
      />
      {run.truncated && (
        <p>
          Showing the first 1,200 recorded states. The final answer comes from
          the completed run.
        </p>
      )}
    </section>
  );
}
