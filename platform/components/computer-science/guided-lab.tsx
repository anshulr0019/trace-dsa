"use client";
import { useEffect, useMemo, useState } from "react";
import { MotionConfig, useReducedMotion } from "motion/react";
import { PLAYBACK_SPEEDS, stageTransition } from "@/lib/playback-motion";
import { useFramePlayback } from "../curriculum/use-frame-playback";
import { usePlaybackFocus } from "../experience/use-playback-focus";
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
import { csCourseContent } from "@/lib/learning/cs-course-content";
import { LessonJourney, type JourneyStep } from "../learning/lesson-journey";
import { recordLearning } from "@/lib/product/mastery";
import { CourseStudy } from "../learning/course-study";
import { CourseGuide } from "../learning/course-guide";
import { EvidenceBoard } from "../learning/evidence-board";
import { frameChanges } from "@/lib/learning/evidence";
import { PredictionCheckpoint } from "./prediction-checkpoint";
import { ExperimentComparison } from "./experiment-comparison";
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
  const [journey, setJourney] = useState<JourneyStep>("Watch");
  const [compare, setCompare] = useState(false);
  const [speed, setSpeed] = useState(1);
  const reduced = useReducedMotion();
  const [focusPanel, setFocusPanel] = useState("visual");
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
  const frames = architectural ? architecture.frames : lab.frames;
  const { step, setStep, playing, setPlaying } = useFramePlayback(
    frames.length,
    speed,
  );
  const focus = usePlaybackFocus(playing, m.id);
  useEffect(() => {
    if (playing) {
      setJourney("Watch");
      recordLearning(`cs:${m.id}`, "watched", "Played the guided lab");
    }
  }, [playing, m.id]);
  useEffect(() => {
    setFocusPanel("visual");
  }, [focus.focusRequest]);
  const current = frames[Math.min(step, frames.length - 1)];
  const update = (v: Scenario) => {
    setExampleNotice("");
    setPlaying(false);
    setStep(0);
    onChange(v);
  };
  const jump = (n: number) => {
    setPlaying(false);
    setStep(Math.max(0, Math.min(frames.length - 1, n)));
  };
  return (
    <section className="cs-lab">
      <LessonJourney
        active={journey}
        onStep={(stage) => {
          setJourney(stage);
          setPlaying(false);
          focus.setFocused(false);
          if (stage === "Watch") {
            focus.focus();
            return;
          }
          const target =
            stage === "Understand"
              ? `cs-understand-${m.id}`
              : stage === "Try"
                ? `cs-try-${m.id}`
                : stage === "Review"
                  ? `review-cs:${m.id}`
                  : undefined;
          if (stage === "Solve") {
            document
              .querySelector(".cs-study-grid")
              ?.scrollIntoView({ block: "start", behavior: "instant" });
            return;
          }
          requestAnimationFrame(() => {
            const details = document.getElementById(
              target!,
            ) as HTMLDetailsElement | null;
            if (details?.tagName === "DETAILS") details.open = true;
            document
              .getElementById(target!)
              ?.scrollIntoView({ block: "start", behavior: "instant" });
          });
        }}
      />
      {lab.error && !architectural ? (
        <p role="alert" className="cs-error">
          {lab.error}
        </p>
      ) : (
        current && (
          <div
            ref={focus.ref}
            className={`playback-surface cs-playback-surface ${focus.focused ? "is-playback-focused" : ""} ${focusPanel === "code" ? "cs-show-code" : ""}`}
          >
            {focus.focused && (
              <div className="playback-focus-toolbar">
                <span>Playback view</span>
                {!architectural && (
                  <div className="cs-focus-tabs">
                    <button
                      aria-pressed={focusPanel === "visual"}
                      onClick={() => {
                        setPlaying(false);
                        setFocusPanel("visual");
                      }}
                    >
                      Visualization
                    </button>
                    <button
                      aria-pressed={focusPanel === "code"}
                      onClick={() => {
                        setPlaying(false);
                        setFocusPanel("code");
                      }}
                    >
                      Reference logic
                    </button>
                  </div>
                )}
                <button
                  onClick={() => {
                    setPlaying(false);
                    focus.setFocused(false);
                  }}
                >
                  Full layout
                </button>
              </div>
            )}
            <MotionConfig
              transition={stageTransition(speed, !!reduced)}
              reducedMotion="user"
            >
              <div className={`cs-lab-grid ${architectural ? "cs-wide" : ""}`}>
                <div className="cs-stage">
                  {architectural && (
                    <ArchitectureEditor
                      speed={speed}
                      playing={playing}
                      value={scenario.architecture}
                      active={current.active}
                      onChange={(a) => update({ ...scenario, architecture: a })}
                    />
                  )}
                  <StateScene
                    speed={speed}
                    playing={playing}
                    frame={current}
                    previous={step > 0 ? frames[step - 1] : undefined}
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
            </MotionConfig>
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
                  {PLAYBACK_SPEEDS.map((s) => (
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
          </div>
        )
      )}
      <details
        id={`cs-understand-${m.id}`}
        className="lesson-tools journey-anchor"
      >
        <summary>Understand the idea · worked lesson & reasoning</summary>
        <CourseGuide track={m.topic} goal={m.idea} challenge={m.challenge} />
        <CourseStudy
          key={`study:${m.id}`}
          id={m.id}
          unit={csCourseContent[m.id]}
          track={m.topic}
          onExplore={() =>
            focus.ref.current?.scrollIntoView({
              block: "start",
              behavior: "smooth",
            })
          }
        />
      </details>
      <details id={`cs-try-${m.id}`} className="lesson-tools journey-anchor">
        <summary>Change this scenario · examples & model settings</summary>
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
      </details>
      {!lab.error && frames.length > 1 && (
        <>
          <PredictionCheckpoint
            learningId={`cs:${m.id}`}
            key={JSON.stringify(scenario)}
            frames={frames}
            step={step}
            onPause={() => setPlaying(false)}
            onJump={jump}
          />
          <details className="learning-state-review">
            <summary>What changed in this step?</summary>
            <EvidenceBoard
              changes={step > 0 ? frameChanges(frames[step - 1], current) : []}
            />
          </details>
        </>
      )}
      <button
        aria-expanded={compare}
        onClick={() => {
          setPlaying(false);
          setCompare(!compare);
        }}
      >
        {compare
          ? "Close experiment comparison"
          : "Compare examples side by side"}
      </button>
      {compare && (
        <ExperimentComparison key={`experiment:${m.id}`} module={m} />
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
