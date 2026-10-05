"use client";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { text, list, type State } from "@/lib/curriculum/visual-state";
export function useStageMotion(speed = 1) {
  const reduced = useReducedMotion();
  return {
    duration: reduced ? 0 : Math.min(0.45, 0.55 / speed),
    ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
  };
}
export function StageLabel({
  title,
  detail,
}: {
  title: string;
  detail?: string;
}) {
  return (
    <div className="viz-label">
      <span>{title}</span>
      {detail && <small>{detail}</small>}
    </div>
  );
}
export function Readout({ children }: { children: ReactNode }) {
  return <div className="viz-readout">{children}</div>;
}
export function Stats({
  vars,
  keys,
}: {
  vars: State;
  keys: [string, string][];
}) {
  return (
    <div className="viz-stats">
      {keys
        .filter(([key]) => vars[key] !== undefined)
        .map(([key, label]) => (
          <span key={key}>
            {label}
            <motion.b
              key={text(vars[key])}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
            >
              {text(vars[key])}
            </motion.b>
          </span>
        ))}
    </div>
  );
}
export function Legend({ items }: { items: [string, string][] }) {
  return (
    <div className="viz-legend">
      {items.map(([tone, label]) => (
        <span key={label}>
          <i className={tone} />
          {label}
        </span>
      ))}
    </div>
  );
}
export function Track({
  title,
  values,
  tone = "mint",
  limit = 12,
}: {
  title: string;
  values: unknown;
  tone?: string;
  limit?: number;
}) {
  const entries = typeof values === "string" ? [...values] : list(values);
  return (
    <div className="viz-track">
      <StageLabel title={title} detail={`${entries.length} items`} />
      <div className="viz-track-items">
        {entries.slice(0, limit).map((value, i) => (
          <motion.span
            layout
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={tone}
            key={`${text(value)}:${i}`}
            title={text(value)}
          >
            {text(value).slice(0, 48)}
          </motion.span>
        ))}
        {!entries.length && <small>Empty</small>}
        {entries.length > limit && (
          <small>+{entries.length - limit} more</small>
        )}
      </div>
    </div>
  );
}
export function Details({
  vars,
  exclude = [],
}: {
  vars: State;
  exclude?: string[];
}) {
  const entries = Object.entries(vars).filter(
    ([k]) => !["data", "input", "answer", "error", ...exclude].includes(k),
  );
  if (!entries.length) return null;
  return (
    <details className="viz-recorded">
      <summary>More recorded values · {entries.length}</summary>
      <dl>
        {entries.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{text(v).slice(0, 2000)}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
