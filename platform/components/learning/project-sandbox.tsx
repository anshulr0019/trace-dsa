"use client";
import { useMemo, useState } from "react";
import { moduleById } from "@/lib/computer-science/catalog";
import { deepSpecs } from "@/lib/computer-science/deeper-catalog";
import type { Settings } from "@/lib/computer-science/models";
import { initialScenario } from "@/lib/computer-science/examples";
import { buildLab } from "@/lib/computer-science/models";
import { simulateArchitecture } from "@/lib/computer-science/architecture";
import { ArchitectureEditor } from "../computer-science/architecture-editor";
import { LabControls } from "../computer-science/controls";
import { StateScene } from "../computer-science/scene";
import { useFramePlayback } from "../curriculum/use-frame-playback";
import { usePlaybackFocus } from "../experience/use-playback-focus";
import { SqlProject } from "./sql-project";
import { HandsOn } from "./hands-on";
import type { LearningTrack } from "@/lib/learning/references";
export function ProjectSandbox({
  track,
  labIds,
  onEvidence,
}: {
  track: LearningTrack;
  labIds: string[];
  onEvidence: (text: string) => void;
}) {
  if (track === "databases") return <SqlProject onEvidence={onEvidence} />;
  if (track === "dsa") return <HandsOn />;
  if (track === "interviews")
    return (
      <p>
        Use the interview prompts below to explain your design, then record
        evidence against the project milestones.
      </p>
    );
  const ids = labIds.filter((id) => moduleById[id]);
  if (!ids.length) return null;
  return <ModelExperiment key={track} ids={ids} onEvidence={onEvidence} />;
}
function ModelExperiment({
  ids,
  onEvidence,
}: {
  ids: string[];
  onEvidence: (text: string) => void;
}) {
  const [id, setId] = useState(ids[0]),
    [scenario, setScenario] = useState(() => initialScenario(ids[0])),
    [speed, setSpeed] = useState(1),
    [captured, setCaptured] = useState("");
  const m = moduleById[id],
    architectural = m.kind === "architecture";
  const lab = useMemo(() => {
    const reference = buildLab(m, scenario.settings);
    return architectural
      ? {
          ...reference,
          ...simulateArchitecture(scenario.architecture),
          nodes: scenario.architecture.nodes,
          edges: scenario.architecture.edges,
        }
      : reference;
  }, [m, scenario, architectural]);
  const { step, setStep, playing, setPlaying } = useFramePlayback(
      lab.frames.length,
      speed,
    ),
    focus = usePlaybackFocus(playing, id);
  const relevantKeys: (keyof Settings)[] = deepSpecs[id]
    ? ["variant", "quantity"]
    : m.kind === "scheduler"
      ? ["bursts", "policy", "quantum"]
      : m.kind === "memory"
        ? ["pages", "slots", "pagePolicy"]
        : m.kind === "strategy"
          ? ["price", "discount"]
          : m.kind === "observer"
            ? ["price", "subscribers"]
            : m.kind === "factory"
              ? ["channel"]
              : id === "tcp-retries"
                ? ["drop"]
                : id === "dns-lookup"
                  ? ["warm"]
                  : id === "https-journey"
                    ? ["reuse"]
                    : m.kind === "transaction"
                      ? ["amount", "fail"]
                      : m.kind === "deadlock" || m.kind === "semaphore"
                        ? ["safe"]
                        : ["variant"];
  const settingsEvidence = architectural
    ? {
        traffic: scenario.architecture.traffic,
        hitRate: scenario.architecture.hitRate,
        backlog: scenario.architecture.backlog,
        components: scenario.architecture.nodes.map((n) => ({
          name: n.label,
          role: n.role,
          offline: n.failed,
        })),
        connections: scenario.architecture.edges.map(([a, b]) => [
          scenario.architecture.nodes.find((n) => n.id === a)?.label,
          scenario.architecture.nodes.find((n) => n.id === b)?.label,
        ]),
      }
    : Object.fromEntries(relevantKeys.map((k) => [k, scenario.settings[k]]));
  const current = lab.frames[Math.min(step, lab.frames.length - 1)];
  const update = (next: typeof scenario) => {
    setPlaying(false);
    setStep(0);
    setScenario(next);
    setCaptured("");
  };
  return (
    <section className="project-sandbox cs-hub">
      <small>EXECUTABLE MODEL EXPERIMENT</small>
      <h3>Change a condition. Inspect the consequence.</h3>
      <p>
        Run a baseline, change one setting, and capture the observed state into
        your project notes. These models use the same stated assumptions as the
        guided labs.
      </p>
      <label>
        Mechanism
        <select
          value={id}
          onChange={(e) => {
            setId(e.target.value);
            update(initialScenario(e.target.value));
          }}
        >
          {ids.map((v) => (
            <option key={v} value={v}>
              {moduleById[v].title}
            </option>
          ))}
        </select>
      </label>
      {!architectural && (
        <LabControls
          module={m}
          value={scenario.settings}
          onChange={(settings) => update({ ...scenario, settings })}
        />
      )}
      <div
        ref={focus.ref}
        className={`playback-surface cs-playback-surface ${focus.focused ? "is-playback-focused" : ""}`}
      >
        {focus.focused && (
          <div className="playback-focus-toolbar">
            <span>Project experiment</span>
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
        {architectural && (
          <ArchitectureEditor
            value={scenario.architecture}
            onChange={(architecture) => update({ ...scenario, architecture })}
            active={current.active}
            speed={speed}
            playing={playing}
          />
        )}
        <StateScene
          frame={current}
          previous={step ? lab.frames[step - 1] : undefined}
          nodes={lab.nodes}
          edges={lab.edges}
          index={step}
          speed={speed}
          playing={playing}
        />
        <div className="launch-feedback">
          <strong>{current.title}</strong>
          <p>{current.explanation}</p>
        </div>
        <div className="launch-actions">
          <button
            onClick={() => {
              if (step === lab.frames.length - 1) setStep(0);
              setPlaying(!playing);
            }}
          >
            {playing ? "Pause" : "Play experiment"}
          </button>
          <button
            disabled={step === 0}
            onClick={() => {
              setPlaying(false);
              setStep(step - 1);
            }}
          >
            ← Previous
          </button>
          <button
            disabled={step === lab.frames.length - 1}
            onClick={() => {
              setPlaying(false);
              setStep(step + 1);
            }}
          >
            Next →
          </button>
          <label>
            Speed
            <select
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            >
              {[0.5, 1, 2].map((s) => (
                <option key={s} value={s}>
                  {s}×
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={() => {
              onEvidence(
                `\n\nExperiment: ${m.title}\nSettings: ${JSON.stringify(settingsEvidence)}\nObserved step ${step + 1}/${lab.frames.length}: ${current.title}\n${current.explanation}\nMetrics: ${JSON.stringify(current.metrics)}\nAssumptions: ${lab.assumptions}\n`,
              );
              setCaptured(
                "This observed state was added to the selected project milestone.",
              );
            }}
          >
            Capture this state in project notes
          </button>
        </div>
        <small>
          {step + 1} / {lab.frames.length} steps
        </small>
        <p role="status">{captured}</p>
        <details>
          <summary>Model assumptions</summary>
          <p>{lab.assumptions}</p>
        </details>
      </div>
    </section>
  );
}
