"use client";
import { useEffect, useState } from "react";
import "./launch.css";
export function RuntimeStatus({
  busy,
  stage,
  error,
  onRetry,
  onCancel,
  onHelp,
}: {
  busy: boolean;
  stage: string;
  error?: string;
  onRetry: () => void;
  onCancel: () => void;
  onHelp?: () => void;
}) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    setSeconds(0);
    if (!busy) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [busy]);
  if (!busy && !error) return null;
  return (
    <div
      className={error ? "runtime-recovery" : "trace-notice"}
      aria-live="polite"
    >
      {busy ? (
        <>
          <strong>
            {stage === "executing"
              ? "Runtime ready · executing your code"
              : "Preparing the language runtime"}
          </strong>
          <div className="runtime-progress">
            <span className={stage === "loading" ? "current" : "done"}>
              1 · Prepare
            </span>
            <span className={stage === "executing" ? "current" : ""}>
              2 · Compile / execute
            </span>
            <span>3 · Review output</span>
          </div>
          <p>
            {seconds}s elapsed.{" "}
            {seconds > 15
              ? "The first run may need to download compiler assets. Keep this page open or cancel and try again."
              : "Your editor remains saved while the runtime prepares."}
          </p>
          <button onClick={onCancel}>Cancel run</button>
        </>
      ) : (
        <>
          <strong>The run needs attention.</strong>
          <p>
            Compiler errors: inspect the reported line and syntax. Timeout:
            check loop conditions or use a smaller input. Loading errors: check
            your connection, then retry.
          </p>
          <button onClick={onRetry}>Retry this run</button>
          {onHelp && <button onClick={onHelp}>Open runtime guide</button>}
        </>
      )}
    </div>
  );
}
