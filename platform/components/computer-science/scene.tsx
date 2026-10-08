"use client";
import { motion, useReducedMotion } from "motion/react";
import { stageTransition } from "@/lib/playback-motion";
import { useId } from "react";
import type { DiagramNode, Frame } from "@/lib/computer-science/models";
export function FlowDiagram({
  nodes,
  edges,
  active = [],
  onSelect,
  selected,
  speed = 1,
  playing = false,
  directed = true,
}: {
  nodes: DiagramNode[];
  edges: [string, string][];
  active?: string[];
  onSelect?: (id: string) => void;
  selected?: string;
  directed?: boolean;
  speed?: number;
  playing?: boolean;
}) {
  const marker = useId().replace(/:/g, ""),
    reduced = useReducedMotion();
  return (
    <svg
      className={`cs-flow ${playing ? "cs-flow-playing" : ""}`}
      style={{ animationDuration: `${0.85 / speed}s` }}
      viewBox="0 0 640 320"
      role="group"
      aria-label="Component relationships and current activity"
    >
      <defs>
        <marker
          id={marker}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0 0 L10 5 L0 10z" fill="currentColor" />
        </marker>
      </defs>
      {edges.map(([a, b]) => {
        const from = nodes.find((n) => n.id === a),
          to = nodes.find((n) => n.id === b);
        if (!from || !to) return null;
        const x = from.x * 6.4,
          y = from.y * 3.2,
          dx = (to.x - from.x) * 6.4,
          dy = (to.y - from.y) * 3.2,
          len = Math.hypot(dx, dy) || 1;
        return (
          <path
            key={`${a}:${b}`}
            className={active.includes(b) ? "active" : ""}
            d={`M${x + (dx / len) * 55},${y + (dy / len) * 25} L${to.x * 6.4 - (dx / len) * 61},${to.y * 3.2 - (dy / len) * 30}`}
            markerEnd={directed ? `url(#${marker})` : undefined}
          />
        );
      })}
      {nodes.map((n) => (
        <motion.g
          key={n.id}
          initial={false}
          animate={{ x: n.x * 6.4, y: n.y * 3.2 }}
          transition={stageTransition(speed, !!reduced)}
          className={`cs-flow-node ${active.includes(n.id) ? "active" : ""} ${selected === n.id ? "selected" : ""}`}
          role={onSelect ? "button" : undefined}
          tabIndex={onSelect ? 0 : undefined}
          aria-label={n.label}
          onClick={() => onSelect?.(n.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelect?.(n.id);
            }
          }}
        >
          <rect x={-55} y={-25} width={110} height={50} rx={12} />
          <text textAnchor="middle" y={4}>
            {n.label.length > 20 ? n.label.slice(0, 18) + "…" : n.label}
          </text>
          <title>{n.label}</title>
          {active.includes(n.id) && (
            <motion.circle
              cx={0}
              cy={-34}
              r={4}
              initial={false}
              animate={{ opacity: 1 }}
              fill="#c6f39d"
            />
          )}
        </motion.g>
      ))}
    </svg>
  );
}
export function StateScene({
  frame,
  previous,
  nodes,
  edges,
  index,
  speed = 1,
  playing = false,
  directed = true,
}: {
  frame: Frame;
  previous?: Frame;
  nodes: DiagramNode[];
  edges: [string, string][];
  index: number;
  directed?: boolean;
  speed?: number;
  playing?: boolean;
}) {
  const reduced = useReducedMotion();
  return (
    <div className="cs-scene">
      {nodes.length > 0 && (
        <FlowDiagram
          nodes={nodes}
          edges={edges}
          active={frame.active}
          directed={directed}
          speed={speed}
          playing={playing}
        />
      )}
      {frame.chart && (
        <div className="cs-congestion-chart">
          <svg
            viewBox="0 0 560 220"
            role="img"
            aria-label={`Sending window by round: ${frame.chart.values.join(", ")}. Path capacity ${frame.chart.limit}.`}
          >
            <path d="M40 15 V185 H540" stroke="#61756b" fill="none" />
            <line
              x1="40"
              x2="540"
              y1={185 - frame.chart.limit * 17}
              y2={185 - frame.chart.limit * 17}
              stroke="#e6b973"
              strokeDasharray="6 5"
            />
            <text x="44" y={179 - frame.chart.limit * 17} fill="#e6b973">
              Capacity {frame.chart.limit}
            </text>
            {frame.chart.values.slice(1).map((v, i) => (
              <motion.line
                key={i}
                x1={48 + i * 53}
                y1={185 - frame.chart!.values[i] * 17}
                x2={48 + (i + 1) * 53}
                y2={185 - v * 17}
                stroke="#c1f390"
                strokeWidth="3"
                initial={{ pathLength: reduced ? 1 : 0 }}
                animate={{ pathLength: 1 }}
                transition={stageTransition(speed, !!reduced)}
              />
            ))}
            {frame.chart.values.map((v, i) => (
              <g key={i}>
                <circle
                  cx={48 + i * 53}
                  cy={185 - v * 17}
                  r="4"
                  fill="#c1f390"
                />
                <text
                  x={48 + i * 53}
                  y="204"
                  textAnchor="middle"
                  fill="#a1b1aa"
                >
                  {i + 1}
                </text>
                <text
                  x={48 + i * 53}
                  y={177 - v * 17}
                  textAnchor="middle"
                  fill="#e1e9e4"
                >
                  {v}
                </text>
              </g>
            ))}
          </svg>
          <p>Round → · Green: sending window · Amber: path capacity</p>
        </div>
      )}
      {frame.timeline && (
        <div className="cs-timeline" aria-label="Timeline">
          <span>
            {frame.timeline.length > 25
              ? "Most recent 25 time units / accesses"
              : "Time units / accesses"}
          </span>
          <div>
            {frame.timeline.slice(-25).map((value, i) => (
              <motion.div
                key={i + Math.max(0, frame.timeline!.length - 25)}
                initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={stageTransition(speed, !!reduced)}
                className={`cs-process p${Number(value.replace("P", "")) % 5}`}
              >
                <b>{value}</b>
                <small>{i + Math.max(0, frame.timeline!.length - 25)}</small>
              </motion.div>
            ))}
          </div>
        </div>
      )}
      {frame.cells.length > 0 && (
        <div className="cs-cells">
          {frame.cells.map((c) => {
            const old = previous?.cells.find((p) => p.id === c.id);
            const changed = !!old && old.value !== c.value;
            return (
              <motion.div
                layout={!reduced}
                key={c.id}
                className={`${c.tone ?? ""} ${changed ? "cs-cell-changed" : ""}`}
                transition={stageTransition(speed, !!reduced)}
              >
                <small>{c.label}</small>
                {changed && (
                  <span className="cs-previous-value">{old.value} →</span>
                )}
                <motion.strong
                  key={String(c.value)}
                  initial={{ opacity: reduced ? 1 : 0.3 }}
                  animate={{ opacity: 1 }}
                >
                  {c.value}
                </motion.strong>
                {changed && <span className="cs-change-label">Changed</span>}
              </motion.div>
            );
          })}
        </div>
      )}
      {frame.table && (
        <div className="cs-table-scroll">
          <table>
            <caption>Result after step {index + 1}</caption>
            <thead>
              <tr>
                {frame.table.columns.map((c) => (
                  <th key={c}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {frame.table.rows.map((r, i) => (
                <motion.tr
                  layout={!reduced}
                  initial={false}
                  animate={{ opacity: 1 }}
                  transition={stageTransition(speed, !!reduced)}
                  key={i}
                >
                  {r.map((v, j) => (
                    <td key={j}>{v === "NULL" ? <em>NULL</em> : v}</td>
                  ))}
                </motion.tr>
              ))}
            </tbody>
          </table>
          {frame.table.rows.length === 0 && <p>No rows match this step.</p>}
        </div>
      )}
      {Object.keys(frame.metrics).length > 0 && (
        <dl className="cs-metrics">
          {Object.entries(frame.metrics).map(([key, value]) => (
            <div key={key}>
              <dt>{key}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
