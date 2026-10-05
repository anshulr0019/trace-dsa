"use client";
import { useState } from "react";
import { display, type ExecutionFrame } from "@/components/curriculum/scene";
import { nextDebugStep, watchValue } from "@/lib/lab/debug";
export function VisualDebugger({
  frames,
  step,
  code,
  breakpoints,
  onBreakpoints,
  onSeek,
  watches,
  onWatches,
}: {
  frames: ExecutionFrame[];
  step: number;
  code: string;
  breakpoints: number[];
  onBreakpoints: (n: number[]) => void;
  onSeek: (n: number) => void;
  watches: string[];
  onWatches: (values: string[]) => void;
}) {
  const [watch, setWatch] = useState(""),
    [line, setLine] = useState(1),
    [notice, setNotice] = useState("");
  const frame = frames[step],
    previous = frames[step - 1],
    depth = frame?.stack?.length ?? 0;
  return (
    <details className="product-card visual-debugger">
      <summary>Visual debugger · breakpoints, watches & calls</summary>
      <p>
        Explore the recorded execution. Breakpoints pause playback at captured
        source lines. The code has already executed; stepping backward selects
        an earlier snapshot.
      </p>
      <div className="product-actions">
        <button
          disabled={!frames.length || step === 0}
          onClick={() => onSeek(step - 1)}
        >
          Previous state
        </button>
        <button
          disabled={!frames.length || step === frames.length - 1}
          onClick={() => onSeek(nextDebugStep(frames, step, "into"))}
        >
          Step into next state
        </button>
        <button
          disabled={!frames.length || step === frames.length - 1 || !depth}
          onClick={() => onSeek(nextDebugStep(frames, step, "over"))}
        >
          Step over call
        </button>
        <button
          disabled={!depth || step === frames.length - 1}
          onClick={() => onSeek(nextDebugStep(frames, step, "out"))}
        >
          Step out of call
        </button>
      </div>
      <div className="lab-columns">
        <section>
          <h3>Breakpoints</h3>
          <p>
            Use the dots beside the source, or add a line here. Lines without
            captured states will not pause.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (line < 1 || line > code.split("\n").length) {
                setNotice("Choose a line within your code.");
                return;
              }
              onBreakpoints([...new Set([...breakpoints, line])]);
              setNotice("Breakpoint added.");
            }}
          >
            <label>
              Source line
              <input
                type="number"
                min={1}
                max={code.split("\n").length}
                value={line}
                onChange={(e) => setLine(Number(e.target.value))}
              />
            </label>
            <button>Add breakpoint</button>
          </form>
          <div className="product-actions">
            {breakpoints.map((n) => (
              <button
                key={n}
                onClick={() =>
                  onBreakpoints(breakpoints.filter((v) => v !== n))
                }
              >
                Line {n} ×
              </button>
            ))}
            {breakpoints.length > 0 && (
              <button onClick={() => onBreakpoints([])}>
                Clear breakpoints
              </button>
            )}
          </div>
        </section>
        <section>
          <h3>Watch expressions</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const name = watch.trim();
              if (!/^[A-Za-z_]\w*(?:(?:\.\w+)|(?:\[\d+\]))*$/.test(name)) {
                setNotice(
                  "Use a variable path such as total, nums[2], or data.k.",
                );
                return;
              }
              onWatches([...new Set([...watches, name])].slice(0, 12));
              setWatch("");
            }}
          >
            <label>
              Variable or path
              <input
                value={watch}
                onChange={(e) => setWatch(e.target.value)}
                placeholder="nums[2]"
              />
            </label>
            <button>Add watch</button>
          </form>
          <dl className="watch-list">
            {watches.map((path) => {
              const value = watchValue(frame?.vars ?? {}, path),
                old = watchValue(previous?.vars ?? {}, path);
              return (
                <div
                  key={path}
                  className={
                    old.found && display(old.value) !== display(value.value)
                      ? "changed"
                      : ""
                  }
                >
                  <dt>
                    {path}
                    <button
                      aria-label={`Remove watch ${path}`}
                      onClick={() =>
                        onWatches(watches.filter((p) => p !== path))
                      }
                    >
                      ×
                    </button>
                  </dt>
                  <dd>
                    {value.found
                      ? display(value.value).slice(0, 2000)
                      : "Unavailable in this captured state"}
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>
      </div>
      <h3>Captured call stack</h3>
      {depth ? (
        <ol className="debug-stack">
          {frame.stack.map((call, i) => (
            <li key={i}>
              <code>{call.name}</code> · line {call.line}
              {i === depth - 1 ? " · current call" : ""}
            </li>
          ))}
        </ol>
      ) : (
        <p>
          This state has no captured call stack. Step over/out need recorded
          stack frames; Java and explicit checkpoints may capture variables
          only.
        </p>
      )}
      <p role="status">{notice}</p>
    </details>
  );
}
