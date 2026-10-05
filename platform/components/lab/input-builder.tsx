"use client";
import { useEffect, useState, useRef, type PointerEvent } from "react";
import type { Problem } from "@/lib/curriculum/catalog";
import { validateProblemInput } from "@/lib/curriculum/validate";
import {
  graphDefinition,
  readTree,
  writeTree,
  type TreeNode,
} from "@/lib/lab/builders";
export function InputBuilder({
  problem,
  input,
  inputError,
  disabled = false,
  onApply,
}: {
  problem: Problem;
  input: Record<string, unknown>;
  inputError?: string;
  disabled?: boolean;
  onApply: (input: Record<string, unknown>) => void;
}) {
  const [draft, setDraft] = useState(input),
    [message, setMessage] = useState("");
  const fields = useRef<HTMLFieldSetElement>(null),
    [epoch, setEpoch] = useState(0);
  const inputSignature = JSON.stringify(input);
  useEffect(() => {
    setDraft(input);
    setEpoch((n) => n + 1);
    setMessage("");
  }, [inputSignature]);
  const update = (key: string, value: unknown) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const graph = problem.scene === "graph" ? graphDefinition(draft) : null;
  return (
    <details className="product-card input-builder">
      <summary>Interactive input builder · edit the example visually</summary>
      <p>
        Build an input, apply it, then press Play. The problem’s constraints are
        checked before execution.
      </p>
      {inputError && (
        <p role="status">
          {inputError} Correct the JSON input, or edit this builder and Apply to
          replace it.
        </p>
      )}
      <fieldset ref={fields} key={epoch} disabled={disabled}>
        {problem.scene === "tree" && Array.isArray(draft.tree) && (
          <TreeBuilder
            values={draft.tree}
            onChange={(v) => update("tree", v)}
          />
        )}
        {graph && (
          <GraphBuilder
            key={problem.id + graph.key}
            data={draft}
            onChange={setDraft}
          />
        )}
        <div className="builder-fields">
          {Object.entries(draft)
            .filter(
              ([key]) =>
                key !== "tree" && key !== graph?.key && key !== "succProb",
            )
            .map(([key, value]) => {
              if (
                Array.isArray(value) &&
                value.every(
                  (v) =>
                    v === null ||
                    ["number", "string", "boolean"].includes(typeof v),
                )
              )
                return (
                  <FlatBuilder
                    key={key}
                    name={key}
                    sample={
                      Array.isArray(problem.input[key])
                        ? (problem.input[key] as unknown[]).find(
                            (v) => v !== null,
                          )
                        : undefined
                    }
                    values={value}
                    onChange={(v) => update(key, v)}
                  />
                );
              if (
                Array.isArray(value) &&
                value.every(
                  (row) =>
                    Array.isArray(row) &&
                    row.every((v) =>
                      ["number", "string", "boolean"].includes(typeof v),
                    ),
                )
              )
                return (
                  <MatrixBuilder
                    key={key}
                    name={key}
                    values={value}
                    onChange={(v) => update(key, v)}
                  />
                );
              if (typeof value === "number")
                return (
                  <label key={key}>
                    {key}
                    <NumericCell
                      value={value}
                      onValue={(v) => update(key, v)}
                    />
                  </label>
                );
              if (typeof value === "string")
                return (
                  <label key={key}>
                    {key}
                    <input
                      value={value}
                      maxLength={120}
                      onChange={(e) => update(key, e.target.value)}
                    />
                  </label>
                );
              if (typeof value === "boolean")
                return (
                  <label key={key}>
                    {key}
                    <select
                      value={String(value)}
                      onChange={(e) => update(key, e.target.value === "true")}
                    >
                      <option>true</option>
                      <option>false</option>
                    </select>
                  </label>
                );
              return (
                <label key={key}>
                  {key}
                  <textarea
                    defaultValue={JSON.stringify(value)}
                    onBlur={(e) => {
                      try {
                        update(key, JSON.parse(e.target.value));
                        e.currentTarget.setCustomValidity("");
                        setMessage("");
                      } catch {
                        e.currentTarget.setCustomValidity(
                          `Use valid JSON for ${key}.`,
                        );
                        setMessage(`Use valid JSON for ${key}.`);
                      }
                    }}
                  />
                </label>
              );
            })}
        </div>
        <div className="product-actions">
          <button
            type="button"
            onClick={() => {
              const invalid = fields.current?.querySelector<
                HTMLInputElement | HTMLTextAreaElement
              >("input:invalid, textarea:invalid");
              if (invalid) {
                invalid.reportValidity();
                setMessage("Complete the values before applying this input.");
                return;
              }
              const error = validateProblemInput(problem.id, draft);
              if (error) {
                setMessage(error);
                return;
              }
              onApply(draft);
              setMessage("Input applied. Press Play to inspect your example.");
            }}
          >
            Apply input
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(problem.input);
              setEpoch((n) => n + 1);
              setMessage(
                "Original input restored in the builder. Apply to use it.",
              );
            }}
          >
            Reset builder
          </button>
        </div>
      </fieldset>
      <p role="status">{message}</p>
    </details>
  );
}
function NumericCell({
  value,
  onValue,
  label,
  nullable = false,
}: {
  value: number | null;
  onValue: (value: number | null) => void;
  label?: string;
  nullable?: boolean;
}) {
  const [text, setText] = useState(value === null ? "" : String(value)),
    [invalid, setInvalid] = useState(false);
  useEffect(() => {
    setText(value === null ? "" : String(value));
    setInvalid(value === null ? !nullable : !Number.isFinite(value));
  }, [value, nullable]);
  return (
    <input
      type="text"
      inputMode="decimal"
      aria-label={label}
      aria-invalid={invalid}
      value={text}
      ref={(node) => {
        node?.setCustomValidity(invalid ? "Enter a complete number." : "");
      }}
      onChange={(e) => {
        const raw = e.target.value;
        setText(raw);
        const valid =
          raw.trim() === "" ? nullable : Number.isFinite(Number(raw));
        setInvalid(!valid);
        e.target.setCustomValidity(valid ? "" : "Enter a complete number.");
        if (valid) onValue(raw.trim() === "" ? null : Number(raw));
      }}
    />
  );
}
function FlatBuilder({
  name,
  values,
  sample,
  onChange,
}: {
  name: string;
  values: unknown[];
  sample?: unknown;
  onChange: (v: unknown[]) => void;
}) {
  const category = typeof (sample ?? values.find((v) => v !== null)),
    numeric = category === "number" || category === "undefined",
    nullable = name === "random" || values.some((v) => v === null);
  const change = (i: number, value: unknown) =>
    onChange(values.map((old, j) => (i === j ? value : old)));
  return (
    <section className="builder-array">
      <h3>
        {name} <small>{values.length} values</small>
      </h3>
      <div className="editable-cells">
        {values.map((v, i) => (
          <label key={i}>
            [{i}]
            {numeric ? (
              <NumericCell
                label={`${name} index ${i}`}
                value={v as number | null}
                nullable={nullable}
                onValue={(n) => change(i, n)}
              />
            ) : category === "boolean" ? (
              <select
                aria-label={`${name} index ${i}`}
                value={String(v)}
                onChange={(e) => change(i, e.target.value === "true")}
              >
                <option>true</option>
                <option>false</option>
              </select>
            ) : (
              <input
                aria-label={`${name} index ${i}`}
                value={String(v)}
                onChange={(e) => change(i, e.target.value)}
              />
            )}
            <button
              type="button"
              aria-label={`Remove ${name} index ${i}`}
              onClick={() => onChange(values.filter((_, j) => j !== i))}
            >
              ×
            </button>
          </label>
        ))}
      </div>
      <div className="product-actions">
        <button
          type="button"
          disabled={values.length >= 100}
          onClick={() =>
            onChange([
              ...values,
              numeric ? 0 : category === "boolean" ? false : "",
            ])
          }
        >
          Add value
        </button>
        {numeric && (
          <button
            type="button"
            onClick={() =>
              onChange([...values].sort((a, b) => Number(a) - Number(b)))
            }
          >
            Sort ascending
          </button>
        )}
      </div>
    </section>
  );
}
function MatrixBuilder({
  name,
  values,
  onChange,
}: {
  name: string;
  values: (number | string | boolean)[][];
  onChange: (v: (number | string | boolean)[][]) => void;
}) {
  const change = (r: number, c: number, value: number | string | boolean) =>
    onChange(
      values.map((row, i) =>
        i === r ? row.map((v, j) => (j === c ? value : v)) : row,
      ),
    );
  return (
    <section className="builder-array">
      <h3>
        {name}{" "}
        <small>
          {values.length} rows × {values[0]?.length ?? 0} columns
        </small>
      </h3>
      <div className="editable-matrix">
        {values.map((row, r) => (
          <div key={r}>
            {row.map((v, c) =>
              typeof v === "number" ? (
                <NumericCell
                  key={c}
                  label={`${name} row ${r} column ${c}`}
                  value={v}
                  onValue={(n) => change(r, c, n!)}
                />
              ) : (
                <input
                  key={c}
                  aria-label={`${name} row ${r} column ${c}`}
                  value={String(v)}
                  onChange={(e) =>
                    change(
                      r,
                      c,
                      typeof v === "boolean"
                        ? e.target.value === "true"
                        : e.target.value,
                    )
                  }
                />
              ),
            )}
          </div>
        ))}
      </div>
      <div className="product-actions">
        <button
          type="button"
          disabled={values.length >= 20}
          onClick={() =>
            onChange([
              ...values,
              Array.from({ length: values[0]?.length || 1 }, () =>
                typeof values[0]?.[0] === "string" ? "0" : 0,
              ),
            ])
          }
        >
          Add row
        </button>
        <button
          type="button"
          disabled={(values[0]?.length ?? 0) >= 20}
          onClick={() =>
            onChange(
              (values.length ? values : [[]]).map((row) => [
                ...row,
                typeof row[0] === "string" ? "0" : 0,
              ]),
            )
          }
        >
          Add column
        </button>
        <button
          type="button"
          disabled={!values.length}
          onClick={() => onChange(values.slice(0, -1))}
        >
          Remove last row
        </button>
        <button
          type="button"
          disabled={!values[0]?.length}
          onClick={() => onChange(values.map((row) => row.slice(0, -1)))}
        >
          Remove last column
        </button>
      </div>
    </section>
  );
}
function TreeBuilder({
  values,
  onChange,
}: {
  values: unknown[];
  onChange: (v: (number | null)[]) => void;
}) {
  const nodes = readTree(values),
    [selected, setSelected] = useState(0),
    id = Math.min(selected, Math.max(0, nodes.length - 1)),
    positions = new Map<number, { x: number; y: number }>();
  const place = (n: number, x: number, y: number, gap: number) => {
    if (!nodes[n] || positions.has(n)) return;
    positions.set(n, { x, y });
    if (nodes[n].left !== null) place(nodes[n].left!, x - gap, y + 85, gap / 2);
    if (nodes[n].right !== null)
      place(nodes[n].right!, x + gap, y + 85, gap / 2);
  };
  if (nodes.length) place(0, 350, 40, 165);
  const height = Math.max(180, ...[...positions.values()].map((n) => n.y + 50));
  const commit = (v: TreeNode[]) => onChange(writeTree(v));
  function child(side: "left" | "right") {
    const v = nodes.map((n) => ({ ...n }));
    v[id][side] = v.length;
    v.push({ value: 0, left: null, right: null });
    commit(v);
  }
  return (
    <section className="structure-builder">
      <h3>Build the tree</h3>
      <p>
        Select a node to edit it or add a child. Input uses compact level order.
      </p>
      {!nodes.length ? (
        <button type="button" onClick={() => onChange([0])}>
          Add root
        </button>
      ) : (
        <>
          <svg
            viewBox={`0 0 700 ${height}`}
            role="group"
            aria-label="Editable binary tree"
          >
            {nodes.flatMap((n, i) =>
              [n.left, n.right]
                .filter((v): v is number => v !== null)
                .map((c) => {
                  const a = positions.get(i),
                    b = positions.get(c);
                  return a && b ? (
                    <line
                      key={`${i}-${c}`}
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                    />
                  ) : null;
                }),
            )}
            {[...positions].map(([i, n]) => (
              <g
                key={i}
                transform={`translate(${n.x},${n.y})`}
                role="button"
                tabIndex={0}
                aria-label={`Select tree node ${i}, value ${nodes[i].value}`}
                aria-pressed={i === id}
                onClick={() => setSelected(i)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelected(i);
                  }
                }}
              >
                <circle r={24} className={i === id ? "selected" : ""} />
                <text textAnchor="middle" y={5}>
                  {nodes[i].value}
                </text>
              </g>
            ))}
          </svg>
          <div className="product-actions">
            <label>
              Node {id} value
              <NumericCell
                key={id}
                value={nodes[id].value}
                onValue={(value) =>
                  commit(
                    nodes.map((n, i) =>
                      i === id ? { ...n, value: value! } : n,
                    ),
                  )
                }
              />
            </label>
            <button
              type="button"
              disabled={nodes[id].left !== null || nodes.length >= 31}
              onClick={() => child("left")}
            >
              Add left child
            </button>
            <button
              type="button"
              disabled={nodes[id].right !== null || nodes.length >= 31}
              onClick={() => child("right")}
            >
              Add right child
            </button>
            <button
              type="button"
              onClick={() => {
                if (id === 0) {
                  onChange([]);
                  return;
                }
                commit(
                  nodes.map((n) => ({
                    ...n,
                    left: n.left === id ? null : n.left,
                    right: n.right === id ? null : n.right,
                  })),
                );
                setSelected(0);
              }}
            >
              Remove this subtree
            </button>
          </div>
        </>
      )}
    </section>
  );
}
function GraphBuilder({
  data,
  onChange,
}: {
  data: Record<string, unknown>;
  onChange: (d: Record<string, unknown>) => void;
}) {
  const graph = graphDefinition(data)!,
    [from, setFrom] = useState<number | null>(null),
    [mode, setMode] = useState("connect"),
    [weight, setWeight] = useState(1),
    [positions, setPositions] = useState<
      Record<number, { x: number; y: number }>
    >({}),
    [drag, setDrag] = useState<number | null>(null),
    [notice, setNotice] = useState("");
  const graphFields = useRef<HTMLElement>(null);
  const ids = Array.from(
    { length: Math.min(30, graph.count) },
    (_, i) => i + graph.base,
  );
  const pos = (id: number) =>
    positions[id] ?? {
      x:
        350 +
        240 *
          Math.cos(
            ((id - graph.base) / Math.max(1, graph.count)) * Math.PI * 2 -
              Math.PI / 2,
          ),
      y:
        190 +
        135 *
          Math.sin(
            ((id - graph.base) / Math.max(1, graph.count)) * Math.PI * 2 -
              Math.PI / 2,
          ),
    };
  function connect(to: number) {
    if (from === null) {
      setFrom(to);
      return;
    }
    if (from === to) {
      setFrom(null);
      return;
    }
    const invalid =
      graphFields.current?.querySelector<HTMLInputElement>("input:invalid");
    if (invalid) {
      invalid.reportValidity();
      setNotice("Complete the edge value before connecting nodes.");
      return;
    }
    if (weight < 0 || (graph.probability && weight > 1)) {
      setNotice(
        graph.probability
          ? "Use a probability from 0 through 1."
          : "Use a nonnegative edge weight.",
      );
      return;
    }
    setNotice("");
    const exists = graph.edges.some(
      (e) =>
        (e[0] === (graph.reverse ? to : from) &&
          e[1] === (graph.reverse ? from : to)) ||
        (!graph.directed && e[1] === from && e[0] === to),
    );
    if (!exists) {
      const endpoints = graph.reverse ? [to, from] : [from, to];
      const edge = graph.weighted ? [...endpoints, weight] : endpoints;
      onChange({
        ...data,
        [graph.key]: [...graph.edges, edge],
        ...(graph.probability
          ? {
              succProb: [...(data.succProb as number[]), weight],
            }
          : {}),
      });
    }
    setFrom(null);
  }
  function move(e: PointerEvent<SVGSVGElement>) {
    if (drag === null) return;
    const box = e.currentTarget.getBoundingClientRect();
    setPositions((p) => ({
      ...p,
      [drag]: {
        x: Math.max(
          25,
          Math.min(675, ((e.clientX - box.left) / box.width) * 700),
        ),
        y: Math.max(
          25,
          Math.min(355, ((e.clientY - box.top) / box.height) * 380),
        ),
      },
    }));
  }
  return (
    <section className="structure-builder" ref={graphFields}>
      <h3>
        Build the graph{" "}
        <small>{graph.directed ? "directed" : "undirected"}</small>
      </h3>
      <p>
        Connect mode: select two nodes. Move mode: drag nodes or use arrow keys.
        Select an edge to remove it.
      </p>
      <div className="product-actions">
        <button
          type="button"
          aria-pressed={mode === "connect"}
          onClick={() => setMode("connect")}
        >
          Connect nodes
        </button>
        <button
          type="button"
          aria-pressed={mode === "move"}
          onClick={() => setMode("move")}
        >
          Move nodes
        </button>
        {(graph.weighted || graph.probability) && (
          <label>
            {graph.probability
              ? "Probability for new edges"
              : "Weight for new edges"}
            <NumericCell
              value={weight}
              onValue={(value) => setWeight(value!)}
            />
          </label>
        )}
      </div>
      <svg
        viewBox="0 0 700 380"
        aria-label="Editable graph"
        role="group"
        onPointerMove={move}
        onPointerUp={() => setDrag(null)}
        onPointerCancel={() => setDrag(null)}
      >
        <defs>
          <marker
            id={`builder-arrow-${graph.key}`}
            viewBox="0 0 10 10"
            refX={29}
            refY={5}
            markerWidth={6}
            markerHeight={6}
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" />
          </marker>
        </defs>
        {graph.edges.map((edge, i) => {
          const a = pos(edge[graph.reverse ? 1 : 0]),
            b = pos(edge[graph.reverse ? 0 : 1]);
          return (
            <g
              key={i}
              role="button"
              tabIndex={0}
              aria-label={`Remove edge ${edge[0]} to ${edge[1]}`}
              onClick={() =>
                onChange({
                  ...data,
                  [graph.key]: graph.edges.filter((_, j) => i !== j),
                  ...(graph.probability
                    ? {
                        succProb: (data.succProb as number[]).filter(
                          (_, j) => i !== j,
                        ),
                      }
                    : {}),
                })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onChange({
                    ...data,
                    [graph.key]: graph.edges.filter((_, j) => i !== j),
                    ...(graph.probability
                      ? {
                          succProb: (data.succProb as number[]).filter(
                            (_, j) => i !== j,
                          ),
                        }
                      : {}),
                  });
                }
              }}
            >
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                markerEnd={
                  graph.directed
                    ? `url(#builder-arrow-${graph.key})`
                    : undefined
                }
              />
              <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 10}>
                {edge[2] ??
                  (graph.probability ? (data.succProb as number[])[i] : "")}
              </text>
            </g>
          );
        })}
        {ids.map((id) => {
          const p = pos(id);
          return (
            <g
              key={id}
              transform={`translate(${p.x},${p.y})`}
              tabIndex={0}
              role="button"
              aria-label={`Graph node ${id}`}
              aria-pressed={from === id}
              onClick={() => {
                if (mode === "connect") connect(id);
              }}
              onPointerDown={(e) => {
                if (mode === "move") {
                  setDrag(id);
                  e.currentTarget.setPointerCapture(e.pointerId);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  connect(id);
                }
                if (
                  ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(
                    e.key,
                  )
                ) {
                  e.preventDefault();
                  setPositions((old) => ({
                    ...old,
                    [id]: {
                      x: Math.max(
                        25,
                        Math.min(
                          675,
                          p.x +
                            (e.key === "ArrowRight"
                              ? 15
                              : e.key === "ArrowLeft"
                                ? -15
                                : 0),
                        ),
                      ),
                      y: Math.max(
                        25,
                        Math.min(
                          355,
                          p.y +
                            (e.key === "ArrowDown"
                              ? 15
                              : e.key === "ArrowUp"
                                ? -15
                                : 0),
                        ),
                      ),
                    },
                  }));
                }
              }}
            >
              <circle r={24} className={from === id ? "selected" : ""} />
              <text y={5} textAnchor="middle">
                {id}
              </text>
            </g>
          );
        })}
      </svg>
      {notice && <p role="status">{notice}</p>}
      <small>
        Node positions affect the drawing only. Edges and weights become the
        algorithm input.
      </small>
    </section>
  );
}
