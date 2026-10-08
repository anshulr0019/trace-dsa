"use client";
import { useMemo, useState } from "react";
import { MotionConfig, useReducedMotion } from "motion/react";
import type { Module } from "@/lib/computer-science/catalog";
import { examplesFor } from "@/lib/computer-science/examples";
import { buildLab } from "@/lib/computer-science/models";
import { simulateArchitecture } from "@/lib/computer-science/architecture";
import { recordChanges } from "@/lib/learning/evidence";
import { stageTransition, PLAYBACK_SPEEDS } from "@/lib/playback-motion";
import { useFramePlayback } from "../curriculum/use-frame-playback";
import { usePlaybackFocus } from "../experience/use-playback-focus";
import { StateScene } from "./scene";
import { EvidenceBoard } from "../learning/evidence-board";
export function ExperimentComparison({ module: m }: { module: Module }) {
  const examples = useMemo(() => examplesFor(m), [m]);
  const [left, setLeft] = useState(0),
    [right, setRight] = useState(1),
    [speed, setSpeed] = useState(1);
  const runs = useMemo(
    () =>
      [left, right].map((i) => {
        const s = examples[i].scenario;
        if (m.kind === "architecture") {
          const r = simulateArchitecture(s.architecture);
          return {
            ...r,
            nodes: s.architecture.nodes,
            edges: s.architecture.edges,
            undirected: false,
            error: undefined,
          };
        }
        return buildLab(m, s.settings);
      }),
    [m, examples, left, right],
  );
  const count = Math.max(...runs.map((r) => r.frames.length));
  const { step, playing, setStep, setPlaying } = useFramePlayback(count, speed),
    focus = usePlaybackFocus(playing, m.id),
    reduced = useReducedMotion();
  const change = (side: number, value: number) => {
    setPlaying(false);
    setStep(0);
    side === 0 ? setLeft(value) : setRight(value);
  };
  const settings = (i: number) =>
    m.kind === "architecture"
      ? {
          traffic: examples[i].scenario.architecture.traffic,
          hitRate: examples[i].scenario.architecture.hitRate,
          backlog: examples[i].scenario.architecture.backlog,
          unavailable: examples[i].scenario.architecture.nodes
            .filter((n) => n.failed)
            .map((n) => n.label),
        }
      : examples[i].scenario.settings;
  const differences = recordChanges(settings(left), settings(right));
  return (
    <section
      className={`learning-experiment ${focus.focused ? "learning-experiment-focused" : ""}`}
      ref={focus.ref}
    >
      <header>
        <small>COMPARE & EXPLAIN</small>
        <h3>Same concept. Different conditions.</h3>
        <p>
          Compare the presets below, independently of your main input. Advance
          one recorded step in each example. Steps are teaching events, not
          equal amounts of real time. A finished example holds its final state.
        </p>
      </header>
      <div className="learning-pair-select">
        {[left, right].map((selected, i) => (
          <label key={i}>
            Example {i === 0 ? "A" : "B"}
            <select
              value={selected}
              onChange={(e) => change(i, Number(e.target.value))}
            >
              {examples.map((e, j) => (
                <option value={j} key={e.title}>
                  {e.title}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <details>
        <summary>
          What differs between these examples? ({differences.length})
        </summary>
        <EvidenceBoard changes={differences} />
      </details>
      {left === right && (
        <p role="status">
          Both sides use the same example. Choose a different example to compare
          conditions.
        </p>
      )}
      <MotionConfig
        transition={stageTransition(speed, !!reduced)}
        reducedMotion="user"
      >
        <div className="learning-comparison-grid">
          {runs.map((run, i) => {
            const index = Math.min(step, run.frames.length - 1),
              frame = run.frames[index];
            return (
              <article key={i}>
                <header>
                  <small>
                    {i === 0 ? "A" : "B"} · STEP {index + 1} /{" "}
                    {run.frames.length}
                    {index === run.frames.length - 1 ? " · FINISHED" : ""}
                  </small>
                  <h4>{examples[i === 0 ? left : right].title}</h4>
                  <p>{examples[i === 0 ? left : right].why}</p>
                </header>
                {frame ? (
                  <>
                    <StateScene
                      frame={frame}
                      previous={index > 0 ? run.frames[index - 1] : undefined}
                      index={index}
                      nodes={run.nodes}
                      edges={run.edges}
                      directed={!run.undirected}
                      speed={speed}
                      playing={playing && index < run.frames.length - 1}
                    />
                    <div className="learning-comparison-caption">
                      <strong>{frame.title}</strong>
                      <p>{frame.explanation}</p>
                    </div>
                  </>
                ) : (
                  <p role="alert">{run.error || "No recorded steps."}</p>
                )}
              </article>
            );
          })}
        </div>
      </MotionConfig>
      <div className="learning-transport">
        <button
          onClick={() => {
            setPlaying(false);
            setStep(0);
          }}
        >
          Reset comparison
        </button>
        <button
          className="cs-primary"
          onClick={() => {
            if (step >= count - 1) setStep(0);
            setPlaying(!playing);
          }}
        >
          {playing ? "Pause comparison" : "Play comparison"}
        </button>
        <button
          disabled={step >= count - 1}
          onClick={() => {
            setPlaying(false);
            setStep((n) => n + 1);
          }}
        >
          Next pair of steps →
        </button>
        <label>
          Comparison speed
          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          >
            {PLAYBACK_SPEEDS.map((s) => (
              <option value={s} key={s}>
                {s}×
              </option>
            ))}
          </select>
        </label>
      </div>
      <p>
        <strong>Explain the difference:</strong> {m.challenge}
      </p>
    </section>
  );
}
