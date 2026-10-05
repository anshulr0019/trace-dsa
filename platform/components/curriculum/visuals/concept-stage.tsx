"use client";
import type { Problem } from "@/lib/curriculum/catalog";
import type { PlaybackFrame } from "@/lib/curriculum/execution";
import type { ConceptCue } from "@/lib/curriculum/concept-cues";
import { text, type State } from "@/lib/curriculum/visual-state";
import { GridStage } from "./grid-stage";
import { DPStage } from "./dp-stage";
import {
  GraphStage,
  TreeStage,
  LinkedStage,
  TrieStage,
  HeapStage,
} from "./network-stage";
import {
  LinearStage,
  BacktrackStage,
  IntervalStage,
  BitsStage,
} from "./linear-stage";
import { Readout } from "./shared";
import "./concept-stage.css";
export function ConceptStage({
  problem,
  input,
  frame,
  previous,
  speed = 1,
  language = "python",
  cue,
  source = "",
}: {
  problem: Problem;
  input: State;
  frame?: PlaybackFrame;
  previous?: PlaybackFrame;
  speed?: number;
  language?: string;
  cue?: ConceptCue;
  source?: string;
}) {
  const props = { problem, input, frame, previous, speed },
    event = frame?.event;
  let content;
  if (problem.scene === "grid" || problem.id === "n-queens")
    content = <GridStage {...props} source={source} />;
  else if (problem.scene === "dp") content = <DPStage {...props} />;
  else if (problem.scene === "graph") content = <GraphStage {...props} />;
  else if (problem.scene === "tree") content = <TreeStage {...props} />;
  else if (problem.scene === "linked") content = <LinkedStage {...props} />;
  else if (problem.scene === "trie") content = <TrieStage {...props} />;
  else if (problem.scene === "heap")
    content = <HeapStage {...props} language={language} />;
  else if (problem.scene === "backtrack")
    content = <BacktrackStage {...props} />;
  else if (problem.scene === "interval") content = <IntervalStage {...props} />;
  else if (problem.scene === "bits") content = <BitsStage {...props} />;
  else content = <LinearStage {...props} cue={cue} />;
  return (
    <div
      className="live-scene motion-stage concept-stage"
      data-visual-family={problem.id === "n-queens" ? "chess" : problem.scene}
    >
      <div className="scene-caption">
        <span className="live-dot" />
        {event === "complete"
          ? "Execution complete"
          : event === "error"
            ? "Execution stopped"
            : !frame || event === "input"
              ? "Explore the input"
              : frame.event === "line"
                ? `Before line ${frame.line}`
                : `After checkpoint · line ${frame.line}`}
        <span>{frame?.function ?? "Select a value to inspect it"}</span>
      </div>
      <div className="viz-content" key={problem.id}>
        {content}
      </div>
      {event === "complete" && (
        <Readout>
          <span>Returned answer</span>
          <strong>{text(frame?.vars.answer)}</strong>
        </Readout>
      )}
      {event === "error" && (
        <Readout>
          <span>Stopped here</span>
          <strong>{text(frame?.vars.error)}</strong>
        </Readout>
      )}
    </div>
  );
}
