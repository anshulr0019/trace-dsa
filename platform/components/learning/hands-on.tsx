"use client";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import "./launch.css";
export function HandsOn({
  initial = "binary",
  scoped = false,
}: {
  scoped?: boolean;
  initial?: "binary" | "window" | "bubble" | "grid" | "pointers" | "prefix";
}) {
  const [mode, setMode] = useState(initial),
    [left, setLeft] = useState(0),
    [right, setRight] = useState(7),
    [done, setDone] = useState(false),
    [pointerLeft, setPointerLeft] = useState(0),
    [pointerRight, setPointerRight] = useState(3),
    [prefixAnswer, setPrefixAnswer] = useState(""),
    [step, setStep] = useState(0),
    [nums, setNums] = useState([5, 1, 4, 2]),
    [visited, setVisited] = useState<number[]>([]),
    [queue, setQueue] = useState([0]),
    [message, setMessage] = useState(
      "Choose the next action and explain it before checking.",
    );
  const reduced = useReducedMotion(),
    values = [2, 4, 7, 9, 11, 14, 18, 21],
    mid = Math.floor((left + right) / 2),
    windowValues = [2, 1, 5, 1, 3],
    blocked = [4],
    neighbors = (n: number) =>
      [n - 3, n + 1, n + 3, n - 1].filter(
        (x) =>
          x >= 0 &&
          x < 9 &&
          Math.abs((x % 3) - (n % 3)) +
            Math.abs(Math.floor(x / 3) - Math.floor(n / 3)) ===
            1 &&
          !blocked.includes(x),
      );
  const reset = () => {
    setPointerLeft(0);
    setPointerRight(3);
    setPrefixAnswer("");
    setLeft(0);
    setRight(7);
    setDone(false);
    setStep(0);
    setNums([5, 1, 4, 2]);
    setVisited([]);
    setQueue([0]);
    setMessage("Choose the next action and explain it before checking.");
  };
  const choose = (direction: string) => {
    const expected =
      values[mid] === 14 ? "found" : values[mid] < 14 ? "right" : "left";
    if (direction !== expected) {
      setMessage(
        `Inspect ${values[mid]} against target 14. Sorted order determines which half can contain the target.`,
      );
      return;
    }
    if (direction === "found") {
      setDone(true);
      setMessage(`Found 14 at index ${mid}. No other search step is needed.`);
    } else {
      if (direction === "right") setLeft(mid + 1);
      else setRight(mid - 1);
      setMessage(
        `Discard the inspected midpoint and the ${direction === "right" ? "smaller" : "larger"} values. The target, if present, remains inside the new interval.`,
      );
    }
  };
  return (
    <section className="launch-card" aria-label="Hands-on visual exercise">
      <small>MAKE THE NEXT MOVE</small>
      <h3>Control the algorithm yourself.</h3>
      <div className="launch-actions">
        {(["binary", "window", "pointers", "prefix", "bubble", "grid"] as const)
          .filter((v) => !scoped || v === initial)
          .map((v) => (
            <button
              key={v}
              aria-pressed={mode === v}
              onClick={() => {
                setMode(v);
                reset();
              }}
            >
              {v === "binary"
                ? "Binary search"
                : v === "window"
                  ? "Sliding window"
                  : v === "pointers"
                    ? "Two pointers"
                    : v === "prefix"
                      ? "Prefix sums"
                      : v === "bubble"
                        ? "Adjacent swaps"
                        : "Grid traversal"}
            </button>
          ))}
      </div>
      {mode === "binary" && (
        <>
          <p>
            Find <strong>14</strong>. Inspect the highlighted midpoint, then
            choose which values remain possible.
          </p>
          <div className="launch-cells">
            {values.map((v, i) => (
              <motion.button
                disabled
                key={i}
                className={`${i === mid ? "active" : ""} ${i < left || i > right ? "discarded" : ""}`}
                animate={{
                  opacity: i < left || i > right ? 0.35 : 1,
                  y: i === mid && !reduced ? -5 : 0,
                }}
                transition={{ duration: 0.3 }}
              >
                {v}
                <small>index {i}</small>
              </motion.button>
            ))}
          </div>
          <p>
            left = {left} · mid = {mid} · right = {right}
          </p>
          <div className="launch-actions">
            <button disabled={done} onClick={() => choose("left")}>
              Keep the left half
            </button>
            <button disabled={done} onClick={() => choose("right")}>
              Keep the right half
            </button>
            <button disabled={done} onClick={() => choose("found")}>
              Target found
            </button>
          </div>
        </>
      )}
      {mode === "pointers" && (
        <>
          <p>
            Find two different values adding to <strong>11</strong> in [1, 3, 4,
            8]. Compare the sum at the two highlighted ends.
          </p>
          <div className="launch-cells">
            {[1, 3, 4, 8].map((v, i) => (
              <button
                key={i}
                disabled
                className={
                  i === pointerLeft || i === pointerRight ? "active" : ""
                }
              >
                {v}
                <small>index {i}</small>
              </button>
            ))}
          </div>
          <p>
            Current sum:{" "}
            {[1, 3, 4, 8][pointerLeft] + [1, 3, 4, 8][pointerRight]}
          </p>
          <div className="launch-actions">
            {["Increase left", "Decrease right", "Pair found"].map(
              (label, i) => (
                <button
                  key={label}
                  disabled={done}
                  onClick={() => {
                    const sum =
                        [1, 3, 4, 8][pointerLeft] + [1, 3, 4, 8][pointerRight],
                      expected = sum === 11 ? 2 : sum < 11 ? 0 : 1;
                    if (i !== expected) {
                      setMessage(
                        "Use sorted order: increase the smaller value when the sum is too small; decrease the larger when it is too large.",
                      );
                      return;
                    }
                    if (i === 2) {
                      setDone(true);
                      setMessage(
                        `Found indices ${pointerLeft} and ${pointerRight}.`,
                      );
                    } else {
                      if (i === 0) setPointerLeft((n) => n + 1);
                      else setPointerRight((n) => n - 1);
                      setMessage(
                        "The discarded endpoint cannot form the target with any remaining value.",
                      );
                    }
                  }}
                >
                  {label}
                </button>
              ),
            )}
          </div>
        </>
      )}
      {mode === "prefix" && (
        <>
          <p>
            Build prefix totals for <strong>[2, -1, 4]</strong>. Start with 0,
            then add one input value at a time.
          </p>
          <div className="launch-cells">
            {[0, 2, 1, 5].slice(0, step + 1).map((v, i) => (
              <button disabled key={i} className={i === step ? "active" : ""}>
                {v}
                <small>prefix {i}</small>
              </button>
            ))}
          </div>
          {step < 3 ? (
            <>
              <label>
                Next prefix total
                <input
                  type="number"
                  value={prefixAnswer}
                  onChange={(e) => setPrefixAnswer(e.target.value)}
                />
              </label>
              <button
                onClick={() => {
                  if (
                    prefixAnswer.trim() === "" ||
                    Number(prefixAnswer) !== [2, 1, 5][step]
                  ) {
                    setMessage(
                      `Add ${[2, -1, 4][step]} to the previous prefix ${[0, 2, 1][step]}.`,
                    );
                    return;
                  }
                  setStep((n) => n + 1);
                  setPrefixAnswer("");
                  setMessage(
                    "This prefix contains every input value before its index.",
                  );
                }}
              >
                Check and append
              </button>
            </>
          ) : (
            <p>
              Now sum input indices 1 through 2: prefix[3] − prefix[1] = 5 − 2 ={" "}
              <strong>3</strong>.
            </p>
          )}
        </>
      )}
      {mode === "window" && (
        <>
          <p>
            Find the largest sum of <strong>3 consecutive values</strong>. Move
            the window once at a time; remove the outgoing value and add the
            incoming value.
          </p>
          <div className="launch-cells">
            {windowValues.map((v, i) => (
              <motion.button
                disabled
                key={i}
                className={i >= step && i < step + 3 ? "active" : ""}
                animate={{ y: i >= step && i < step + 3 && !reduced ? -5 : 0 }}
              >
                {v}
                <small>{i}</small>
              </motion.button>
            ))}
          </div>
          <p>
            Current sum = {windowValues.slice(step, step + 3).join(" + ")} ={" "}
            <strong>
              {windowValues.slice(step, step + 3).reduce((a, b) => a + b, 0)}
            </strong>
            . Best seen ={" "}
            {Math.max(
              ...Array.from({ length: step + 1 }, (_, i) =>
                windowValues.slice(i, i + 3).reduce((a, b) => a + b, 0),
              ),
            )}
            .
          </p>
          <div className="launch-actions">
            <button
              disabled={step === 2}
              onClick={() => {
                setMessage(
                  `Remove ${windowValues[step]}; add ${windowValues[step + 3]}. The window still has exactly 3 values.`,
                );
                setStep((n) => n + 1);
              }}
            >
              Slide one place →
            </button>
          </div>
        </>
      )}
      {mode === "bubble" && (
        <>
          <p>
            Click the <strong>left value of an adjacent pair</strong> that is
            out of order. Swap only when the left value is greater.
          </p>
          <div className="launch-cells">
            {nums.map((v, i) => (
              <motion.button
                layout
                transition={{ duration: reduced ? 0 : 0.45 }}
                key={v}
                disabled={i === nums.length - 1}
                onClick={() => {
                  if (nums[i] <= nums[i + 1]) {
                    setMessage(
                      "This pair is already ordered. Inspect another adjacent pair.",
                    );
                    return;
                  }
                  const next = [...nums];
                  [next[i], next[i + 1]] = [next[i + 1], next[i]];
                  setNums(next);
                  setStep((s) => s + 1);
                  setMessage(
                    next.every((x, j) => !j || next[j - 1] <= x)
                      ? "Sorted. Every adjacent pair is now in order."
                      : `Swapped ${nums[i]} and ${nums[i + 1]}. Find the next inversion.`,
                  );
                }}
              >
                {v}
                <small>index {i}</small>
              </motion.button>
            ))}
          </div>
          <p>
            {step} swaps ·{" "}
            {nums.every((x, j) => !j || nums[j - 1] <= x)
              ? "Sorted"
              : "Keep inspecting adjacent pairs"}
          </p>
        </>
      )}
      {mode === "grid" && (
        <>
          <p>
            Visit this grid in breadth-first order. Click the{" "}
            <strong>next queued cell</strong>. The center is blocked. Neighbors
            enter the queue in up, right, down, left order.
          </p>
          <div
            className="launch-cells"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,60px)",
              justifyContent: "center",
            }}
          >
            {Array.from({ length: 9 }, (_, i) => (
              <motion.button
                key={i}
                disabled={blocked.includes(i) || visited.includes(i)}
                className={
                  queue[0] === i
                    ? "active"
                    : visited.includes(i)
                      ? "discarded"
                      : ""
                }
                onClick={() => {
                  if (queue[0] !== i) {
                    setMessage(
                      `BFS uses a FIFO queue. Visit cell ${queue[0]} next.`,
                    );
                    return;
                  }
                  const seen = [...visited, i],
                    remaining = queue.slice(1),
                    added = neighbors(i).filter(
                      (x) => !seen.includes(x) && !remaining.includes(x),
                    );
                  setVisited(seen);
                  setQueue([...remaining, ...added]);
                  setMessage(
                    i === 8
                      ? "Reached cell 8. BFS visits by increasing distance from the start."
                      : `Visit ${i}; enqueue ${added.length ? added.join(", ") : "no new neighbors"}.`,
                  );
                }}
              >
                {blocked.includes(i) ? "×" : i}
                <small>{i === 0 ? "start" : i === 8 ? "goal" : ""}</small>
              </motion.button>
            ))}
          </div>
          <p>
            Queue: [{queue.join(", ")}] · Visited: [{visited.join(", ")}]
          </p>
        </>
      )}
      <div className="launch-feedback" role="status">
        {message}
      </div>
      <button onClick={reset}>Reset this exercise</button>
      <p>
        <small>
          These small exercises build the concept. Use the lesson’s code runner
          to inspect its actual input and execution.
        </small>
      </p>
    </section>
  );
}
