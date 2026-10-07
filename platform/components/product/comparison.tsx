"use client";
import {usePlaybackFocus} from "../experience/use-playback-focus";
import { useState } from "react";
import { comparisonTraces } from "@/lib/trace/comparisons";
import { Scene, type ExecutionFrame } from "@/components/curriculum/scene";
import type { Problem } from "@/lib/curriculum/catalog";
import { useFramePlayback } from "@/components/curriculum/use-frame-playback";
import { validateProblemInput } from "@/lib/curriculum/validate";
const primary: Record<string, string> = {
  "two-sum-sorted": "two-sum",
  "binary-search-standard": "binary-search",
  "maximum-average-subarray": "sliding-window",
};
export function AlgorithmComparison({
  problem,
  input,
}: {
  problem: Problem;
  input: Record<string, unknown>;
}) {
  const [open, setOpen] = useState(false);
  const id = primary[problem.id];
  if (
    !id ||
    validateProblemInput(problem.id, input) ||
    !Array.isArray(input.nums) ||
    input.nums.some((n) => typeof n !== "number") ||
    input.nums.length > 40
  )
    return null;
  return (
    <details
      className="product-card"
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary>Compare approaches · see the work saved</summary>
      {open && <ComparisonBody problem={problem} input={input} id={id} />}
    </details>
  );
}
function ComparisonBody({
  problem,
  input,
  id,
}: {
  problem: Problem;
  input: Record<string, unknown>;
  id: string;
}) {
  const nums = input.nums as number[],
    target = Number(input.k ?? input.target),
    traces = comparisonTraces(id, nums, target),
    count = Math.max(...traces.map((t) => t.length));
  const { step, playing, setPlaying, setStep } = useFramePlayback(count, 1);
  const focus=usePlaybackFocus(playing,problem.id);
  const labels =
    id === "sliding-window"
      ? ["Recalculate each window", "Reuse the previous sum"]
      : id === "two-sum"
        ? ["Try every pair", "Move two pointers"]
        : ["Scan one by one", "Binary search"];
  const convert = (vars: Record<string, unknown>): ExecutionFrame => ({
    vars,
    line: 0,
    event: "checkpoint",
    function: "reference model",
    stack: [],
  });
  return (
    <div ref={focus.ref} className="playback-surface">
      <p>
        These are illustrative reference algorithms for the same input. Each
        captured state counts one array comparison or sum update; animation
        duration is not runtime.
      </p>
      <div className="comparison-grid">
        {traces.map((t, i) => {
          const f = t[Math.min(step, t.length - 1)];
          return (
            <section key={i}>
              <h3>{labels[i]}</h3>
              <strong>
                {Math.min(step, t.length - 1)} / {t.length - 1} operations
              </strong>
              <Scene
                problem={problem}
                input={input}
                frame={convert(f.vars)}
                previous={
                  step
                    ? convert(t[Math.min(step - 1, t.length - 1)].vars)
                    : undefined
                }
              />
              <p>{f.message}</p>
            </section>
          );
        })}
      </div>
      <div className="product-actions">
        <button
          onClick={() => {
            if (step === count - 1) setStep(0);
            setPlaying(!playing);
          }}
        >
          {playing ? "Pause comparison" : "Play comparison"}
        </button>
        <button
          onClick={() => {
            setPlaying(false);
            setStep(0);
          }}
        >
          Reset
        </button>
        <label>
          Comparison step
          <input
            aria-label="Comparison step"
            type="range"
            min={0}
            max={count - 1}
            value={step}
            onChange={(e) => {
              setPlaying(false);
              setStep(Number(e.target.value));
            }}
          />
        </label>
      </div>
    </div>
  );
}
export function TraceStats({ frames }: { frames: ExecutionFrame[] }) {
  const [open, setOpen] = useState(false);
  const sizes = frames.map((f) => {
    let values = 0;
    const count = (v: unknown): void => {
      values++;
      if (values > 20000) return;
      if (Array.isArray(v)) v.forEach(count);
      else if (v && typeof v === "object") Object.values(v).forEach(count);
    };
    Object.values(f.vars).forEach(count);
    return values;
  });
  const max = Math.max(1, ...sizes),
    samples = sizes.filter(
      (_, i) => i % Math.max(1, Math.ceil(sizes.length / 80)) === 0,
    );
  return (
    <details
      className="product-card"
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary>Explore captured work & state</summary>
      {open && (
        <>
          <p>
            {frames.length} captured states · up to {max} serialized values in
            one snapshot. This includes trace copies and input; it is not the
            algorithm’s auxiliary memory or operation count.
          </p>
          <div
            className="state-growth"
            role="img"
            aria-label="Serialized values per sampled execution state"
          >
            {samples.map((n, i) => (
              <span
                key={i}
                title={`Sample ${i + 1}: ${n} values`}
                style={{ height: `${(n / max) * 100}%` }}
              />
            ))}
          </div>
          <small>
            Left → right: execution progress · height: serialized values
          </small>
        </>
      )}
    </details>
  );
}
