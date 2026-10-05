"use client";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import type { Problem } from "@/lib/curriculum/catalog";
import type { PlaybackFrame } from "@/lib/curriculum/execution";
import type { ConceptCue } from "@/lib/curriculum/concept-cues";
import {
  list,
  record,
  text,
  integer,
  changed,
  type State,
} from "@/lib/curriculum/visual-state";
import { ArrayStage } from "../array-stage";
import {
  StageLabel,
  Readout,
  Legend,
  Stats,
  Track,
  Details,
  useStageMotion,
} from "./shared";
const metrics: [string, string][] = [
  ["total", "Total"],
  ["best", "Best"],
  ["target", "Target"],
  ["formed", "Requirements met"],
  ["required", "Required"],
  ["max_count", "Most frequent"],
  ["maxCount", "Most frequent"],
  ["farthest", "Reachable through"],
  ["jumps", "Jumps"],
  ["tank", "Tank"],
  ["start", "Candidate start"],
  ["needed", "Hours needed"],
  ["mid", "Candidate"],
  ["peak", "Peak"],
  ["result", "Recorded result"],
];
export function LinearStage({
  problem: p,
  input,
  frame,
  previous,
  speed = 1,
  cue,
}: {
  problem: Problem;
  input: State;
  frame?: PlaybackFrame;
  previous?: PlaybackFrame;
  speed?: number;
  cue?: ConceptCue;
}) {
  const v = frame?.vars ?? {},
    source = { ...input, ...v },
    old = previous?.vars ?? {},
    transition = useStageMotion(speed);
  let keys: string[];
  const byId: Record<string, string[]> = {
    "median-sorted-arrays": ["a", "b"],
    "car-fleet": ["position", "speed"],
    "koko-bananas": ["nums"],
    strstr: ["haystack", "needle", "lps"],
    "happy-prefix": ["s", "lps"],
    "shortest-palindrome": ["sequence", "lps"],
    "repeated-dna": ["s"],
    candy: ["ratings", "candies"],
    "gas-station": ["gas", "cost"],
    "next-greater": ["nums2", "nums1"],
    "daily-temperatures": ["temperatures", "result"],
    "largest-rectangle": ["heights"],
    "min-stack": ["operations"],
    "valid-parentheses": ["s"],
    "reverse-polish": ["tokens"],
    "calculator-ii": ["s"],
  };
  keys =
    byId[p.id] ??
    (p.scene === "string" ? ["s", "t"] : ["nums", "height", "piles"]);
  if (p.id === "median-sorted-arrays" && v.a === undefined)
    keys = ["nums1", "nums2"];
  if (p.id === "koko-bananas" && v.nums === undefined) keys = ["piles"];
  if (p.id === "shortest-palindrome" && v.sequence === undefined)
    keys = ["s", "lps"];
  return (
    <div className="viz-linear-stage">
      {["container-water", "trapping-rain", "largest-rectangle"].includes(
        p.id,
      ) && (
        <Bars problem={p} input={input} vars={v} previous={old} speed={speed} />
      )}
      {keys
        .filter(
          (key) =>
            Array.isArray(source[key]) || typeof source[key] === "string",
        )
        .map((key, index) => {
          const values =
            typeof source[key] === "string"
              ? [...String(source[key])]
              : list(source[key]);
          let range: [number, number] | undefined;
          if (
            ["array", "string"].includes(p.scene) &&
            [1, 2, 8, 9].includes(p.group) &&
            integer(v.left) &&
            integer(v.right) &&
            v.left >= 0 &&
            v.right < values.length &&
            v.left <= v.right
          )
            range = [v.left, v.right];
          if (
            p.id === "maximum-average-subarray" &&
            integer(v.left) &&
            integer(input.k)
          )
            range = [v.left, Math.min(values.length - 1, v.left + input.k - 1)];
          if (p.id === "repeated-dna" && integer(v.i) && v.i >= 9)
            range = [v.i - 9, v.i];
          const mapped = { ...v };
          if (p.id === "koko-bananas") {
            delete mapped.left;
            delete mapped.right;
            delete mapped.mid;
          }
          if (key === "needle") {
            delete mapped.i;
            delete mapped.left;
            delete mapped.right;
          }
          const found =
            frame?.event === "complete" && key === "nums"
              ? p.id === "binary-search-standard" &&
                integer(v.answer) &&
                v.answer >= 0
                ? [v.answer]
                : p.id === "two-sum-sorted"
                  ? list(v.answer).map((x) => Number(x) - 1)
                  : []
              : [];
          return (
            <ArrayStage
              key={key}
              name={key}
              values={values}
              state={mapped}
              previous={
                old[key] !== undefined
                  ? typeof old[key] === "string"
                    ? [...String(old[key])]
                    : list(old[key])
                  : undefined
              }
              cue={index === 0 ? cue : undefined}
              duration={transition.duration}
              range={range}
              found={found}
            />
          );
        })}
      {p.id === "koko-bananas" && (
        <div className="viz-formula">
          <small>Search the eating speed, rather than an array index</small>
          <p>
            Speed interval [{text(v.left)}, {text(v.right)}] · try {text(v.mid)}{" "}
            bananas/hour
          </p>
        </div>
      )}
      {p.id === "median-sorted-arrays" && (
        <Stats
          vars={v}
          keys={[
            ["i", "Partition A"],
            ["j", "Partition B"],
            ["al", "A left"],
            ["ar", "A right"],
            ["bl", "B left"],
            ["br", "B right"],
          ]}
        />
      )}
      {p.scene === "stack" && (
        <StackStage vars={v} previous={old} speed={speed} />
      )}
      <Stats
        vars={v}
        keys={metrics.filter(([k]) => !["object"].includes(typeof v[k]))}
      />
      {Object.entries(record(v.counts ?? v.have ?? v.need)).length > 0 && (
        <div className="viz-counts">
          <StageLabel
            title={
              v.have
                ? "Window character counts"
                : v.need
                  ? "Required character counts"
                  : "Recorded counts"
            }
          />
          {Object.entries(record(v.counts ?? v.have ?? v.need))
            .slice(0, 20)
            .map(([k, value]) => (
              <span key={k}>
                {k}
                <b>
                  {text(value)}
                  {v.have !== undefined && atCount(v.need, k) !== undefined
                    ? ` / ${text(atCount(v.need, k))} needed`
                    : ""}
                </b>
              </span>
            ))}
        </div>
      )}
      <Legend
        items={[
          ["active", "Current / pointer"],
          ["amber", "Boundary / scanning"],
          ["updated", "Changed / inspected"],
        ]}
      />
      <Details
        vars={v}
        exclude={[...keys, "stack", "counts", "have", "need"]
          .join(",")
          .split(",")}
      />
    </div>
  );
}
function atCount(value: unknown, key: string) {
  return record(value)[key];
}
function StackStage({
  vars: v,
  previous: old,
  speed,
}: {
  vars: State;
  previous: State;
  speed: number;
}) {
  const transition = useStageMotion(speed),
    values = list(v.stack),
    before = list(old.stack);
  return (
    <section className="viz-stack-section">
      <StageLabel
        title="Stack · last in, first out"
        detail="Top at the upper edge"
      />
      <div className="viz-stack">
        <AnimatePresence initial={false}>
          {[...values]
            .reverse()
            .slice(0, 12)
            .map((value, i) => (
              <motion.div
                layout
                key={values.length - i}
                initial={{ opacity: 0, x: -25 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 25 }}
                transition={transition}
                className={i === 0 ? "active" : ""}
              >
                <span>{text(value)}</span>
                <small>{i === 0 ? "← top" : `depth ${i}`}</small>
              </motion.div>
            ))}
        </AnimatePresence>
        {!values.length && <div className="viz-empty">Empty stack</div>}
      </div>
      <Readout>
        <span>
          {values.length > before.length
            ? "Push observed"
            : values.length < before.length
              ? "Pop observed"
              : "Recorded stack"}
        </span>
        <b>{values.length} items</b>
      </Readout>
      {values.length > 12 && (
        <p className="viz-helper">Showing the top 12 values.</p>
      )}
    </section>
  );
}
function Bars({
  problem: p,
  input,
  vars: v,
  previous,
  speed,
}: {
  problem: Problem;
  input: State;
  vars: State;
  previous: State;
  speed: number;
}) {
  const values = list(v.height ?? v.heights ?? input.height ?? input.heights)
      .map(Number)
      .slice(0, 50),
    max = Math.max(1, ...values),
    transition = useStageMotion(speed),
    [selected, setSelected] = useState<number | null>(null);
  return (
    <section>
      <StageLabel
        title={
          p.id === "container-water"
            ? "Two boundaries hold a container"
            : p.id === "trapping-rain"
              ? "Read the terrain height"
              : "Find a contiguous rectangle"
        }
        detail="Bar heights match the input"
      />
      <div className="viz-bars" tabIndex={0}>
        {values.map((value, i) => (
          <button
            key={i}
            aria-label={`Bar ${i}, height ${value}`}
            onClick={() => setSelected(i)}
            className={`${v.left === i ? "active" : ""} ${v.right === i ? "amber" : ""} ${v.i === i ? "updated" : ""}`}
          >
            <motion.span
              initial={false}
              animate={{ height: 20 + (value / max) * 110 }}
              transition={transition}
            >
              <b>{value}</b>
            </motion.span>
            <small>{i}</small>
          </button>
        ))}
      </div>
      {selected !== null && (
        <Readout>
          <span>Bar {selected}</span>
          <b>height {values[selected]}</b>
          <button
            aria-label="Close bar inspector"
            onClick={() => setSelected(null)}
          >
            ×
          </button>
        </Readout>
      )}
      <Stats
        vars={v}
        keys={[
          ["left_max", "Left maximum"],
          ["right_max", "Right maximum"],
          ["leftMax", "Left maximum"],
          ["rightMax", "Right maximum"],
          ["area", "Recorded area"],
          ["water", "Water"],
        ]}
      />
    </section>
  );
}
export function BacktrackStage({
  problem: p,
  input,
  frame,
  previous,
  speed = 1,
}: {
  problem: Problem;
  input: State;
  frame?: PlaybackFrame;
  previous?: PlaybackFrame;
  speed?: number;
}) {
  const v = frame?.vars ?? {},
    old = previous?.vars ?? {},
    path = typeof v.path === "string" ? [...v.path] : list(v.path),
    before = typeof old.path === "string" ? [...old.path] : list(old.path),
    transition = useStageMotion(speed),
    answers = list(v.result);
  const digits = String(input.digits ?? ""),
    letters: Record<string, string> = {
      "2": "abc",
      "3": "def",
      "4": "ghi",
      "5": "jkl",
      "6": "mno",
      "7": "pqrs",
      "8": "tuv",
      "9": "wxyz",
    };
  return (
    <div className="viz-backtrack">
      <StageLabel
        title="Choose → explore → undo"
        detail={
          path.length < before.length
            ? "Returning from a branch"
            : path.length > before.length
              ? "Extending a branch"
              : "Current recorded choices"
        }
      />
      <div className="viz-choice-path">
        <span className="viz-choice-root">∅</span>
        <AnimatePresence initial={false}>
          {path.map((value, i) => (
            <motion.span
              layout
              className="viz-choice"
              key={i}
              initial={{ opacity: 0, x: 20, y: -10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: -15, y: 10 }}
              transition={transition}
            >
              <small>Choice {i + 1}</small>
              <b>{text(value)}</b>
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
      {path.length === 0 && (
        <p className="viz-helper">
          The path is empty. Start a branch from the root.
        </p>
      )}
      {p.id === "phone-letters" ? (
        <div className="viz-keypad">
          {[...digits].map((digit, i) => (
            <div className={i === v.i ? "active" : ""} key={i}>
              <b>{digit}</b>
              <span>{letters[digit]}</span>
            </div>
          ))}
        </div>
      ) : (
        <Track
          title="Available values"
          values={input.nums ?? input.candidates}
        />
      )}
      <Stats
        vars={v}
        keys={[
          ["remaining", "Remaining target"],
          ["start", "Next candidate from"],
          ["i", "Choice index"],
        ]}
      />
      <div className="viz-solutions">
        <StageLabel
          title="Completed answers · recorded"
          detail={`${answers.length} collected`}
        />
        <div>
          {answers.slice(-8).map((answer, i) => (
            <motion.span
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              key={answers.length - Math.min(8, answers.length) + i}
            >
              {text(answer)}
            </motion.span>
          ))}
          {!answers.length && <small>No answers recorded yet</small>}
        </div>
      </div>
      <Details vars={v} exclude={["path", "result"]} />
    </div>
  );
}
export function IntervalStage({
  problem: p,
  input,
  frame,
  previous,
  speed = 1,
}: {
  problem: Problem;
  input: State;
  frame?: PlaybackFrame;
  previous?: PlaybackFrame;
  speed?: number;
}) {
  const v = frame?.vars ?? {},
    values = list(v.intervals ?? input.intervals ?? input.points),
    pairs = values.map((x) => list(x).map(Number)).filter((a) => a.length >= 2),
    all = pairs.flat(),
    lo = Math.min(0, ...all),
    hi = Math.max(lo + 1, ...all),
    transition = useStageMotion(speed);
  return (
    <div>
      <StageLabel
        title="Compare intervals on one shared timeline"
        detail={
          p.id === "meeting-rooms"
            ? "Half-open: a room is free at its end"
            : "Closed intervals include both endpoints"
        }
      />
      <div className="viz-intervals">
        <div className="viz-timeline-axis">
          <span>{lo}</span>
          <span>{(lo + hi) / 2}</span>
          <span>{hi}</span>
        </div>
        {pairs.slice(0, 20).map(([a, b], i) => (
          <div className="viz-interval-row" key={i}>
            <small>{i}</small>
            <div>
              <motion.span
                layout
                initial={false}
                animate={{
                  left: `${((a - lo) / (hi - lo)) * 100}%`,
                  width: `${Math.max(1, ((b - a) / (hi - lo)) * 100)}%`,
                }}
                transition={transition}
                className={v.i === i ? "active" : ""}
              >
                {a} — {b}
              </motion.span>
            </div>
          </div>
        ))}
      </div>
      <Stats
        vars={v}
        keys={[
          ["start", "Start"],
          ["end", "End"],
          ["arrows", "Arrows"],
          ["best", "Best"],
          ["rooms", "Rooms"],
        ]}
      />
      {v.heap !== undefined && (
        <Track title="Occupied rooms · ending times" values={v.heap} />
      )}
      <Track title="Recorded merged output" values={v.result} />
      <Details vars={v} exclude={["intervals", "points", "result", "heap"]} />
    </div>
  );
}
export function BitsStage({
  problem: p,
  input,
  frame,
  previous,
  speed = 1,
}: {
  problem: Problem;
  input: State;
  frame?: PlaybackFrame;
  previous?: PlaybackFrame;
  speed?: number;
}) {
  const v = frame?.vars ?? input,
    old = previous?.vars ?? {},
    transition = useStageMotion(speed);
  return (
    <div>
      <StageLabel
        title="Follow the bits through the operation"
        detail="32-bit display · most significant bit on the left"
      />
      {input.nums !== undefined && (
        <Track title="Input values" values={input.nums} />
      )}
      <div className="viz-bit-rows">
        {["a", "b", "n", "value", "result", "carry", "rolling"]
          .filter((k) => typeof v[k] === "number")
          .map((k) => {
            const bits = (Number(v[k]) >>> 0).toString(2).padStart(32, "0"),
              before = (Number(old[k]) >>> 0).toString(2).padStart(32, "0");
            return (
              <section key={k}>
                <StageLabel title={k} detail={text(v[k])} />
                <div>
                  {[...bits].map((bit, i) => (
                    <motion.span
                      initial={false}
                      animate={{
                        backgroundColor: bit === "1" ? "#345038" : "#19262c",
                      }}
                      transition={transition}
                      className={
                        old[k] !== undefined && before[i] !== bit
                          ? "updated"
                          : ""
                      }
                      key={i}
                      title={`Bit ${31 - i}: ${bit}`}
                    >
                      {bit}
                    </motion.span>
                  ))}
                </div>
              </section>
            );
          })}
      </div>
      {v.dp !== undefined && (
        <Track title="Number of set bits at each index" values={v.dp} />
      )}
      <Stats vars={v} keys={[["i", "Iteration"]]} />
      <Legend
        items={[
          ["land", "Bit is 1"],
          ["water", "Bit is 0"],
          ["updated", "Changed bit"],
        ]}
      />
      <Details
        vars={v}
        exclude={["a", "b", "n", "value", "result", "carry", "rolling", "dp"]}
      />
    </div>
  );
}
