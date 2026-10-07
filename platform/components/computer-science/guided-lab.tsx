"use client";
import { useEffect, useMemo, useState } from "react";
import { examplesFor, initialScenario } from "@/lib/computer-science/examples";
import type { Module } from "@/lib/computer-science/catalog";
import {
  buildLab,
  sampleTables,
  type Settings,
} from "@/lib/computer-science/models";
import {
  simulateArchitecture,
  type Architecture,
} from "@/lib/computer-science/architecture";
import { LabControls } from "./controls";
import { StateScene } from "./scene";
import { ArchitectureEditor } from "./architecture-editor";
export type Scenario = { settings: Settings; architecture: Architecture };
export function GuidedLab({
  module: m,
  scenario,
  onChange,
}: {
  module: Module;
  scenario: Scenario;
  onChange: (v: Scenario) => void;
}) {
  const [step, setStep] = useState(0),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(1);
  const examples = useMemo(() => examplesFor(m), [m]);
  const [exampleNotice, setExampleNotice] = useState("");
  const architectural = m.kind === "architecture";
  const lab = useMemo(
    () => buildLab(m, scenario.settings),
    [m, scenario.settings],
  );
  const architecture = useMemo(
    () => simulateArchitecture(scenario.architecture),
    [scenario.architecture],
  );
  const frames = architectural ? architecture.frames : lab.frames,
    current = frames[Math.min(step, frames.length - 1)];
  const update = (v: Scenario) => {
    setExampleNotice("");
    setPlaying(false);
    setStep(0);
    onChange(v);
  };
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(
      () =>
        setStep((n) => {
          if (n >= frames.length - 1) {
            setPlaying(false);
            return n;
          }
          return n + 1;
        }),
      1400 / speed,
    );
    return () => clearInterval(timer);
  }, [playing, speed, frames.length]);
  const jump = (n: number) => {
    setPlaying(false);
    setStep(Math.max(0, Math.min(frames.length - 1, n)));
  };
  return (
    <section className="cs-lab">
      <div className="cs-example-list" aria-label="Worked examples">
        {examples.map((example, i) => (
          <button
            key={example.title}
            aria-pressed={
              JSON.stringify(example.scenario) === JSON.stringify(scenario)
            }
            onClick={() => {
              update(example.scenario);
              setExampleNotice(example.why);
            }}
          >
            <small>EXAMPLE {i + 1}</small>
            <strong>{example.title}</strong>
            <span>{example.why}</span>
          </button>
        ))}
      </div>
      {exampleNotice && <p role="status">{exampleNotice}</p>}
      <div className="cs-section-head">
        <span>EXPLORE THE MODEL</span>
        <button onClick={() => update(initialScenario(m.id))}>
          Reset this scenario
        </button>
      </div>
      {!architectural && (
        <LabControls
          module={m}
          value={scenario.settings}
          onChange={(settings) => update({ ...scenario, settings })}
        />
      )}
      {lab.error && !architectural ? (
        <p role="alert" className="cs-error">
          {lab.error}
        </p>
      ) : (
        current && (
          <>
            <div className={`cs-lab-grid ${architectural ? "cs-wide" : ""}`}>
              <div className="cs-stage">
                {architectural && (
                  <ArchitectureEditor
                    value={scenario.architecture}
                    active={current.active}
                    onChange={(a) => update({ ...scenario, architecture: a })}
                  />
                )}
                <StateScene
                  frame={current}
                  nodes={architectural ? [] : lab.nodes}
                  edges={lab.edges}
                  directed={!lab.undirected}
                  index={step}
                />
                <div
                  className="cs-explanation"
                  aria-live={playing ? "off" : "polite"}
                >
                  <span>
                    STEP {step + 1} / {frames.length}
                  </span>
                  <h3>{current.title}</h3>
                  <p>{current.explanation}</p>
                </div>
              </div>
              {!architectural && (
                <aside className="cs-reference">
                  <h3>Reference logic</h3>
                  <p>
                    Illustrative code. The visual teaching model produces the
                    steps.
                  </p>
                  <pre>
                    <code>{lab.code}</code>
                  </pre>
                  <p>{lab.assumptions}</p>
                  {m.kind === "sql" && (
                    <details>
                      <summary>Source tables</summary>
                      <h4>Customers</h4>
                      <pre>
                        {sampleTables.customers
                          .map((c) => `${c[0]}  ${c[1]}`)
                          .join("\n")}
                      </pre>
                      <h4>Orders (id · customer · amount)</h4>
                      <pre>
                        {sampleTables.orders
                          .map((o) => `${o[0]}  ${o[1]}  ${o[2]}`)
                          .join("\n")}
                      </pre>
                    </details>
                  )}
                </aside>
              )}
            </div>
            <div className="cs-playback">
              <button
                aria-label="First step"
                onClick={() => jump(0)}
                disabled={step === 0}
              >
                ↤
              </button>
              <button
                aria-label="Previous step"
                onClick={() => jump(step - 1)}
                disabled={step === 0}
              >
                ←
              </button>
              <button
                className="cs-primary"
                onClick={() => {
                  if (step >= frames.length - 1) setStep(0);
                  setPlaying(!playing);
                }}
              >
                {playing ? "Pause" : "Play"}
              </button>
              <button
                aria-label="Next step"
                onClick={() => jump(step + 1)}
                disabled={step >= frames.length - 1}
              >
                →
              </button>
              <input
                aria-label="Lesson step"
                type="range"
                min={0}
                max={frames.length - 1}
                value={Math.min(step, frames.length - 1)}
                onChange={(e) => jump(Number(e.target.value))}
              />
              <label>
                Speed
                <select
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                >
                  {[0.5, 1, 2].map((s) => (
                    <option value={s} key={s}>
                      {s}×
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {architectural &&
              scenario.architecture.nodes.some((n) => n.role === "queue") && (
                <button
                  onClick={() =>
                    update({
                      ...scenario,
                      architecture: {
                        ...scenario.architecture,
                        backlog: architecture.queue,
                      },
                    })
                  }
                >
                  Continue from trace end: {architecture.queue} queued jobs
                </button>
              )}
          </>
        )
      )}
      <div className="cs-insights">
        <article>
          <small>THE IDEA</small>
          <h3>Why it works</h3>
          <p>{m.idea}</p>
        </article>
        <article>
          <small>WHAT STAYS TRUE</small>
          <h3>The invariant</h3>
          <p>{m.invariant}</p>
        </article>
        <article>
          <small>YOUR TURN</small>
          <h3>Try an experiment</h3>
          <p>{m.challenge}</p>
        </article>
      </div>
    </section>
  );
}
