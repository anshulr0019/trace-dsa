"use client";
import { useState } from "react";
import { FlowDiagram } from "./scene";
import {
  componentRoles,
  capacities,
  type Architecture,
  type Role,
} from "@/lib/computer-science/architecture";
export function ArchitectureEditor({
  value: a,
  onChange,
  active,
  speed=1,
  playing=false,
}: {
  value: Architecture;
  onChange: (a: Architecture) => void;
  active: string[];
  speed?: number;
  playing?: boolean;
}) {
  const [selected, setSelected] = useState("");
  const [from, setFrom] = useState(""),
    [to, setTo] = useState("");
  const node = a.nodes.find((n) => n.id === selected);
  const add = (role: Role) => {
    if (a.nodes.length >= 16) return;
    const id = `${role}-${Date.now()}`;
    onChange({
      ...a,
      nodes: [
        ...a.nodes,
        { id, role, label: role, x: 50, y: 50, failed: false },
      ],
    });
    setSelected(id);
  };
  return (
    <div className="cs-architecture">
      <div className="cs-palette" aria-label="Add a component">
        {componentRoles.map((role) => (
          <button
            key={role}
            disabled={a.nodes.length >= 16}
            onClick={() => add(role)}
          >
            + {role}
          </button>
        ))}
      </div>
      <FlowDiagram
        nodes={a.nodes.map((n) => ({
          ...n,
          label: n.failed ? `${n.label} (off)` : n.label,
        }))}
        edges={a.edges}
        active={active}
        speed={speed}
        playing={playing}
        selected={selected}
        onSelect={setSelected}
      />
      <p className="cs-muted">
        Select a component to move it, rename it, or simulate a failure. Arrows
        follow the request direction.
      </p>
      {node && (
        <div className="cs-controls">
          <label>
            Component name
            <input
              value={node.label}
              maxLength={40}
              onChange={(e) =>
                onChange({
                  ...a,
                  nodes: a.nodes.map((n) =>
                    n.id === node.id ? { ...n, label: e.target.value } : n,
                  ),
                })
              }
            />
          </label>
          {(["x", "y"] as const).map((axis) => (
            <label key={axis}>
              {axis === "x" ? "Horizontal position" : "Vertical position"}
              <input
                type="range"
                min={10}
                max={90}
                value={node[axis]}
                onChange={(e) =>
                  onChange({
                    ...a,
                    nodes: a.nodes.map((n) =>
                      n.id === node.id
                        ? { ...n, [axis]: Number(e.target.value) }
                        : n,
                    ),
                  })
                }
              />
            </label>
          ))}
          <label className="cs-toggle">
            <input
              type="checkbox"
              checked={node.failed}
              onChange={(e) =>
                onChange({
                  ...a,
                  nodes: a.nodes.map((n) =>
                    n.id === node.id ? { ...n, failed: e.target.checked } : n,
                  ),
                })
              }
            />
            Offline
          </label>
          <button
            onClick={() => {
              onChange({
                ...a,
                nodes: a.nodes.filter((n) => n.id !== node.id),
                edges: a.edges.filter((e) => !e.includes(node.id)),
              });
              setSelected("");
            }}
          >
            Remove component
          </button>
        </div>
      )}
      <details>
        <summary>Edit connections</summary>
        <div className="cs-controls">
          <label>
            From
            <select value={from} onChange={(e) => setFrom(e.target.value)}>
              <option value="">Choose component</option>
              {a.nodes.map((n) => (
                <option value={n.id} key={n.id}>
                  {n.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            To
            <select value={to} onChange={(e) => setTo(e.target.value)}>
              <option value="">Choose component</option>
              {a.nodes.map((n) => (
                <option value={n.id} key={n.id}>
                  {n.label}
                </option>
              ))}
            </select>
          </label>
          <button
            disabled={
              !a.nodes.some((n) => n.id === from) ||
              !a.nodes.some((n) => n.id === to) ||
              from === to ||
              a.edges.length >= 64 ||
              a.edges.some((e) => e[0] === from && e[1] === to)
            }
            onClick={() => onChange({ ...a, edges: [...a.edges, [from, to]] })}
          >
            Connect →
          </button>
        </div>
        <div className="cs-palette">
          {a.edges.map(([x, y]) => (
            <button
              key={`${x}:${y}`}
              aria-label={`Remove connection ${a.nodes.find((n) => n.id === x)?.label} to ${a.nodes.find((n) => n.id === y)?.label}`}
              onClick={() =>
                onChange({
                  ...a,
                  edges: a.edges.filter((e) => e[0] !== x || e[1] !== y),
                })
              }
            >
              {a.nodes.find((n) => n.id === x)?.label} →{" "}
              {a.nodes.find((n) => n.id === y)?.label} ×
            </button>
          ))}
        </div>
      </details>
      <div className="cs-controls">
        <label>
          Incoming requests / second: {a.traffic}
          <input
            type="range"
            min={0}
            max={1000}
            step={10}
            value={a.traffic}
            onChange={(e) =>
              onChange({ ...a, traffic: Number(e.target.value) })
            }
          />
        </label>
        <label>
          Read-cache hit rate: {a.hitRate}%
          <input
            type="range"
            min={0}
            max={95}
            step={5}
            value={a.hitRate}
            onChange={(e) =>
              onChange({ ...a, hitRate: Number(e.target.value) })
            }
          />
        </label>
        <label>
          Starting queued jobs
          <input
            type="number"
            min={0}
            max={2000}
            value={a.backlog}
            onChange={(e) =>
              onChange({
                ...a,
                backlog: Math.max(0, Math.min(2000, Number(e.target.value))),
              })
            }
          />
        </label>
      </div>
      <details>
        <summary>Capacity assumptions</summary>
        <p>
          This is an aggregate teaching model, not a production benchmark.
          Available components of the same role pool capacity on routes to the
          destination. Required stages share one traffic stream; cache hits
          reduce database reads. Queues hold at most 2,000 jobs. A complete
          route is required even with a warm cache. Arbitrary branching is not a
          full network simulation.
        </p>
        <div className="cs-palette">
          {componentRoles
            .filter((r) => r !== "client")
            .map((r) => (
              <span key={r}>
                {r}: {capacities[r]}/s
              </span>
            ))}
        </div>
      </details>
    </div>
  );
}
