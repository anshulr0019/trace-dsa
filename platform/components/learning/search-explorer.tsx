"use client";
import { useTraceReducedMotion } from "@/components/experience/use-preferences";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Check,
  Code2,
  GripVertical,
  Pause,
  Pencil,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
} from "lucide-react";
import {
  searchSnapshots,
  searchPresets,
  linearInspections,
  validateSearchInput,
  type SearchDecision,
} from "@/lib/learning/search-explorer";
import { recordLearning } from "@/lib/product/mastery";
import "./search-explorer.css";

const reference = [
  "left, right = 0, len(nums) - 1",
  "while left <= right:",
  "    mid = left + (right - left) // 2",
  "    if nums[mid] == target: return mid",
  "    if nums[mid] < target: left = mid + 1",
  "    else: right = mid - 1",
  "return -1",
];

export function SearchExplorer({
  compact = false,
  initialInput,
  onLesson,
  onApply,
}: {
  compact?: boolean;
  initialInput?: { nums: number[]; target: number };
  onLesson?: (nums: number[], target: number) => void;
  onApply?: (nums: number[], target: number) => void;
}) {
  const id = useId(),
    reduced = useTraceReducedMotion();
  const [nums, setNums] = useState<number[]>([
    ...(initialInput?.nums ?? searchPresets[0].nums),
  ]);
  const [target, setTarget] = useState(initialInput?.target ?? 14),
    [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false),
    [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState(nums.join(", ")),
    [targetRaw, setTargetRaw] = useState(String(target));
  const [selected, setSelected] = useState<number | null>(null),
    [cellRaw, setCellRaw] = useState("");
  const [error, setError] = useState(""),
    [feedback, setFeedback] = useState("");
  const [tab, setTab] = useState<"decide" | "compare">("decide");
  const [dragging, setDragging] = useState(false);
  const [dragPoint, setDragPoint] = useState<{ x: number; y: number } | null>(
    null,
  );
  const dragOrigin = useRef({ x: 0, y: 0 });
  const dragMoved = useRef(false);
  const frames = useMemo(() => searchSnapshots(nums, target), [nums, target]);
  const frame = frames[Math.min(cursor, frames.length - 1)],
    done = frame.result !== null;
  const last = frames.at(-1)!;
  const linearCount = linearInspections(nums, target);
  const highlightedLine = done
    ? frame.result === -1
      ? 6
      : 3
    : frame.comparisons === 0
      ? 2
      : frames[cursor - 1]?.decision === "right"
        ? 4
        : 5;

  useEffect(() => {
    if (!playing) return;
    if (cursor >= frames.length - 1) {
      setPlaying(false);
      return;
    }
    const timer = setTimeout(() => {
      setCursor((n) => n + 1);
      setFeedback("");
    }, 1100);
    return () => clearTimeout(timer);
  }, [playing, cursor, frames.length]);

  function reset(values = nums, nextTarget = target) {
    setPlaying(false);
    setCursor(0);
    setSelected(null);
    setFeedback("");
    setError("");
    setNums([...values]);
    setTarget(nextTarget);
    setRaw(values.join(", "));
    setTargetRaw(String(nextTarget));
  }
  function seek(next: number) {
    setPlaying(false);
    setCursor(next);
    setFeedback("");
    setSelected(null);
  }
  function decide(decision: SearchDecision) {
    setPlaying(false);
    if (done || frame.mid === null) return;
    if (decision !== frame.decision) {
      setFeedback(
        decision === "found"
          ? `${nums[frame.mid]} and ${target} are different. Compare them before choosing a half.`
          : `${nums[frame.mid]} is ${nums[frame.mid] < target ? "smaller" : "larger"} than ${target}. Keep the ${nums[frame.mid] < target ? "right" : "left"} half so the target remains possible.`,
      );
      return;
    }
    setCursor((n) => n + 1);
    setSelected(null);
    setFeedback("Good decision. " + frames[cursor + 1].explanation);
    recordLearning(
      "foundation:binary-search",
      "exercise",
      `Correct binary-search decision on ${nums.length} values`,
    );
  }
  function inspect(index: number) {
    setPlaying(false);
    setSelected(index);
    setCellRaw(String(nums[index]));
    if (!done && tab === "decide")
      setFeedback(
        index === frame.mid
          ? `Yes. floor((${frame.left} + ${frame.right}) / 2) = ${index}. Compare ${nums[index]} with ${target}.`
          : `Index ${index} holds ${nums[index]}. The midpoint of [${frame.left}, ${frame.right}] is index ${frame.mid}.`,
      );
  }
  function apply(values: number[], nextTarget: number) {
    try {
      validateSearchInput(values, nextTarget);
      reset(values, nextTarget);
      setEditing(false);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <section
      className={`search-explorer ${compact ? "search-compact" : "search-full"}`}
      aria-label="Binary search playground"
    >
      <div className="search-lab-header">
        <div>
          <span className="search-live-dot" />{" "}
          <span>THE BINARY SEARCH PLAYGROUND</span>
        </div>
        <span className="search-live-label">LIVE DEMO</span>
      </div>
      <div
        className="search-lab-tabs"
        role="group"
        aria-label="Playground mode"
      >
        <button
          aria-pressed={tab === "decide"}
          onClick={() => {
            setTab("decide");
            setPlaying(false);
          }}
        >
          Make the next move
        </button>
        <button
          aria-pressed={tab === "compare"}
          onClick={() => {
            setTab("compare");
            setPlaying(false);
          }}
        >
          Compare approaches
        </button>
      </div>
      <div className="search-task">
        <div>
          <span>YOUR TARGET</span>
          <strong>{target}</strong>
        </div>
        <p>
          {done
            ? frame.result === -1
              ? "No match. You ruled out every candidate."
              : `Found at index ${frame.result}. Every move had a reason.`
            : "One comparison. Half the possibilities. Your move."}
        </p>
        <button
          className="search-edit-toggle"
          aria-expanded={editing}
          onClick={() => {
            setEditing((v) => !v);
            setPlaying(false);
          }}
        >
          <Pencil size={14} /> Edit input
        </button>
      </div>
      <div
        className="search-preset-row"
        role="group"
        aria-label="Try an edge case"
      >
        {searchPresets.map((preset) => (
          <button
            key={preset.id}
            aria-pressed={
              JSON.stringify(nums) === JSON.stringify(preset.nums) &&
              target === preset.target
            }
            onClick={() => reset([...preset.nums], preset.target)}
          >
            {preset.label}
          </button>
        ))}
      </div>
      {editing && (
        <form
          className="search-input-form"
          onSubmit={(e) => {
            e.preventDefault();
            const parts = raw.trim() ? raw.split(",").map((n) => n.trim()) : [];
            if (parts.some((n) => !n) || !targetRaw.trim()) {
              setError(
                "Enter comma-separated numbers and a target. Leave the values empty for an empty array.",
              );
              return;
            }
            apply(parts.map(Number), Number(targetRaw));
          }}
        >
          <label>
            Sorted values
            <input
              aria-label="Playground sorted values"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder="2, 4, 7, 9, 11, 14, 18, 21"
            />
          </label>
          <label>
            Target
            <input
              aria-label="Playground target"
              value={targetRaw}
              onChange={(e) => setTargetRaw(e.target.value)}
              inputMode="numeric"
            />
          </label>
          <button type="submit">
            Apply & reset <ArrowRight size={14} />
          </button>
          <span>Up to 12 sorted whole numbers. Duplicates are welcome.</span>
        </form>
      )}
      {error && (
        <p className="search-error" role="alert">
          {error}
        </p>
      )}
      <div
        className="search-stage"
        role="group"
        aria-label="Search values; select a cell to inspect or edit it"
      >
        {nums.length ? (
          <div
            className="search-array"
            style={{
              gridTemplateColumns: `repeat(${nums.length}, minmax(0, 1fr))`,
            }}
          >
            {nums.map((value, index) => {
              const eliminated = index < frame.left || index > frame.right;
              return (
                <div
                  className="search-cell-wrap"
                  key={index}
                  data-search-index={index}
                >
                  {index === frame.mid && (
                    <motion.div
                      layoutId={`${id}-midpoint`}
                      className="search-midpoint"
                      transition={
                        reduced
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 240, damping: 28 }
                      }
                    >
                      <button
                        onPointerDown={(e) => {
                          if (done) return;
                          dragMoved.current = false;
                          dragOrigin.current = { x: e.clientX, y: e.clientY };
                          e.currentTarget.setPointerCapture(e.pointerId);
                          setDragging(true);
                        }}
                        onPointerMove={(e) => {
                          if (!dragging) return;
                          if (
                            Math.hypot(
                              e.clientX - dragOrigin.current.x,
                              e.clientY - dragOrigin.current.y,
                            ) > 4
                          ) {
                            dragMoved.current = true;
                            setDragPoint({ x: e.clientX, y: e.clientY });
                          }
                        }}
                        onPointerUp={(e) => {
                          if (dragMoved.current) {
                            const cell = document
                              .elementFromPoint(e.clientX, e.clientY)
                              ?.closest<HTMLElement>("[data-search-index]");
                            if (
                              cell &&
                              e.currentTarget
                                .closest(".search-explorer")
                                ?.contains(cell)
                            )
                              inspect(Number(cell.dataset.searchIndex));
                          }
                          setDragging(false);
                          setDragPoint(null);
                          if (e.currentTarget.hasPointerCapture(e.pointerId))
                            e.currentTarget.releasePointerCapture(e.pointerId);
                        }}
                        onPointerCancel={() => {
                          setDragging(false);
                          setDragPoint(null);
                          dragMoved.current = false;
                        }}
                        onClick={(e) => {
                          if (dragMoved.current) {
                            e.preventDefault();
                            dragMoved.current = false;
                          } else inspect(index);
                        }}
                        aria-label="Inspect midpoint; drag to another value to propose a midpoint"
                      >
                        <GripVertical size={11} /> mid <ArrowDown size={12} />
                      </button>
                    </motion.div>
                  )}
                  <button
                    className={`search-cell ${eliminated ? "is-eliminated" : ""} ${index === frame.mid ? "is-midpoint" : ""} ${frame.result === index ? "is-found" : ""} ${selected === index ? "is-selected" : ""} ${dragging ? "is-drop-target" : ""}`}
                    aria-label={`Inspect value ${value} at index ${index}${eliminated ? ", eliminated" : ""}`}
                    aria-pressed={selected === index}
                    onClick={() => inspect(index)}
                  >
                    <span>{value}</span>
                    {frame.result === index && <Check size={12} />}
                    <small>{index}</small>
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="search-empty">
            <span>∅</span>
            <strong>No values. Still a useful lesson.</strong>
            <p>
              The interval starts empty. Binary search returns −1 without
              inspecting a value.
            </p>
          </div>
        )}
        {!!nums.length && (
          <div className="search-boundaries">
            <span>
              left <b>{frame.left}</b>
            </span>
            <span>
              {done ? "RESULT" : "CANDIDATE INTERVAL"}{" "}
              <b>{done ? frame.result : `[${frame.left} … ${frame.right}]`}</b>
            </span>
            <span>
              right <b>{frame.right}</b>
            </span>
          </div>
        )}
      </div>
      {dragPoint && (
        <div
          className="search-drag-ghost"
          aria-hidden="true"
          style={{ left: dragPoint.x, top: dragPoint.y }}
        >
          mid ? <ArrowDown size={12} />
        </div>
      )}
      {selected !== null && (
        <form
          className="search-cell-editor"
          onSubmit={(e) => {
            e.preventDefault();
            if (!cellRaw.trim()) {
              setError("Enter a whole number for this value.");
              return;
            }
            const values = [...nums];
            values[selected] = Number(cellRaw);
            apply(values, target);
          }}
        >
          <label>
            nums[{selected}]
            <input
              aria-label={`Edit value at index ${selected}`}
              inputMode="numeric"
              value={cellRaw}
              onChange={(e) => setCellRaw(e.target.value)}
            />
          </label>
          <button type="submit">Update value</button>
          <button type="button" onClick={() => setSelected(null)}>
            Close
          </button>
        </form>
      )}
      {tab === "decide" ? (
        <>
          <div className="search-decision-row">
            <button disabled={done || playing} onClick={() => decide("left")}>
              <ArrowLeft size={15} /> Keep left
            </button>
            <button disabled={done || playing} onClick={() => decide("found")}>
              <Check size={15} /> Found it
            </button>
            <button disabled={done || playing} onClick={() => decide("right")}>
              Keep right <ArrowRight size={15} />
            </button>
          </div>
          <div
            className={`search-explanation ${done ? "search-success" : ""}`}
            role="status"
            aria-live={playing ? "off" : "polite"}
          >
            <span>{done ? <Check size={16} /> : <Code2 size={16} />}</span>
            <p>{feedback || frame.explanation}</p>
          </div>
          {!compact && (
            <div className="search-reference">
              <div>
                <Code2 size={14} /> Reference logic · Python
              </div>
              <pre>
                {reference.map((line, i) => (
                  <span
                    className={i === highlightedLine ? "is-current" : ""}
                    key={line}
                  >
                    <small>{i + 1}</small>
                    {line}
                    {"\n"}
                  </span>
                ))}
              </pre>
            </div>
          )}
        </>
      ) : (
        <div className="search-comparison">
          <p>
            Both searches use these same values and target. Counts measure
            inspected values, not elapsed time.
          </p>
          {[
            { name: "Binary search", count: last.comparisons, tone: "binary" },
            { name: "Linear search", count: linearCount, tone: "linear" },
          ].map((row) => (
            <div className={`search-comparison-row ${row.tone}`} key={row.name}>
              <div>
                <strong>{row.name}</strong>
                <span>
                  {row.count} {row.count === 1 ? "inspection" : "inspections"}
                </span>
              </div>
              <div className="search-comparison-track">
                <motion.i
                  initial={false}
                  animate={{
                    width: `${nums.length ? (row.count / nums.length) * 100 : 0}%`,
                  }}
                  transition={{ duration: reduced ? 0 : 0.4 }}
                />
              </div>
            </div>
          ))}
          <p className="search-comparison-note">
            {last.comparisons < linearCount
              ? `Binary search inspects ${linearCount - last.comparisons} fewer values here.`
              : last.comparisons > linearCount
                ? "Linear search finds this target sooner. A smaller input or an early match can favour a simple scan."
                : "The inspection counts match on this input."}{" "}
            Binary search requires sorted input; sorting work is excluded.
          </p>
        </div>
      )}
      <div className="search-transport">
        <button aria-label="Reset playground" onClick={() => reset()}>
          <RotateCcw size={15} />
        </button>
        <button
          aria-label="Previous search decision"
          disabled={!cursor}
          onClick={() => seek(cursor - 1)}
        >
          <SkipBack size={15} />
        </button>
        <button
          className="search-replay"
          disabled={frames.length < 2}
          aria-label={playing ? "Pause search replay" : "Play search replay"}
          onClick={() => {
            if (done) setCursor(0);
            setFeedback("");
            setPlaying((v) => !v);
          }}
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
          {playing ? "Pause" : "Replay"}
        </button>
        <button
          aria-label="Next search decision"
          disabled={done}
          onClick={() => seek(cursor + 1)}
        >
          <SkipForward size={15} />
        </button>
        <input
          type="range"
          aria-label="Search decision timeline"
          min={0}
          max={frames.length - 1}
          value={cursor}
          disabled={frames.length < 2}
          onChange={(e) => seek(Number(e.target.value))}
        />
        <span>{frame.comparisons} checked</span>
      </div>
      {(onLesson || onApply) && (
        <div className="search-lab-footer">
          <span>
            {done
              ? "Take the idea into real code."
              : "Click a value to inspect it. Every decision is reversible."}
          </span>
          {onApply ? (
            <button onClick={() => onApply(nums, target)}>
              Run this input in the lesson <ArrowRight size={14} />
            </button>
          ) : (
            <button onClick={() => onLesson?.(nums, target)}>
              Explore the full lesson <ArrowRight size={14} />
            </button>
          )}
        </div>
      )}
    </section>
  );
}
