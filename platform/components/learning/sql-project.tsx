"use client";
import { useEffect, useRef, useState } from "react";
import { sqlTasks, sqlSetup } from "@/lib/learning/sql-project";
import { recordLearning } from "@/lib/product/mastery";
import "./launch.css";
type Output = {
  columns: string[];
  rows: (string | number | null)[][];
  truncated: boolean;
  changed: number;
};
export function SqlProject({
  onEvidence,
}: {
  onEvidence?: (text: string) => void;
}) {
  const [task, setTask] = useState(0),
    [query, setQuery] = useState(sqlTasks[0].starter),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState(""),
    [output, setOutput] = useState<Output | null>(null),
    [support, setSupport] = useState(false),
    [hint, setHint] = useState(false),
    [ready, setReady] = useState(false),
    [saveStatus, setSaveStatus] = useState("");
  const worker = useRef<Worker | null>(null),
    timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined),
    generation = useRef(0);
  const cancel = () => {
    generation.current++;
    worker.current?.terminate();
    worker.current = null;
    clearTimeout(timer.current);
    setBusy(false);
  };
  useEffect(() => {
    const load = () => {
      try {
        const v = localStorage.getItem("trace:sql-draft");
        if (v) setQuery(v.slice(0, 6000));
        const context = JSON.parse(
          localStorage.getItem("trace:sql-context") ?? "null",
        );
        if (
          context &&
          Number.isInteger(context.task) &&
          context.task >= 0 &&
          context.task < sqlTasks.length
        ) {
          setTask(context.task);
          setSupport(context.support === true);
        } else if (v) setSupport(true);
      } catch {}
    };
    load();
    setReady(true);
    window.addEventListener("trace:restore", load);
    return () => {
      generation.current++;
      worker.current?.terminate();
      clearTimeout(timer.current);
      window.removeEventListener("trace:restore", load);
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem("trace:sql-draft", query);
      localStorage.setItem(
        "trace:sql-context",
        JSON.stringify({ task, support }),
      );
      window.dispatchEvent(new Event("trace:notebook"));
      setSaveStatus("Query saved on this browser");
    } catch {
      setSaveStatus("Storage unavailable; copy this query before leaving.");
    }
  }, [query, ready, task, support]);
  const run = () => {
    cancel();
    const id = ++generation.current,
      w = new Worker("/browser-runtime/sql-project.js");
    worker.current = w;
    setBusy(true);
    setOutput(null);
    setStatus("Preparing SQLite… The first run downloads the database engine.");
    const alive = () => id === generation.current;
    const fail = (message: string) => {
      if (!alive()) return;
      cancel();
      setStatus(message);
    };
    timer.current = setTimeout(
      () => fail("SQLite could not load. Check your connection and try again."),
      60000,
    );
    w.onerror = () => fail("SQLite could not start. Retry the query.");
    w.onmessage = ({ data }) => {
      if (!alive()) return;
      if (data.type === "ready") {
        clearTimeout(timer.current);
        setStatus("Executing your query…");
        timer.current = setTimeout(
          () =>
            fail("Query timed out. Simplify it or check a recursive query."),
          6000,
        );
      } else if (data.type === "error") fail(data.error);
      else if (data.type === "result") {
        const result = data.result as Output;
        setOutput(result);
        const pass =
          JSON.stringify(result.rows) ===
            JSON.stringify(sqlTasks[task].expected) && !result.truncated;
        setStatus(
          pass
            ? "Correct for this dataset. Explain why your query also handles the empty side."
            : "Query executed. Compare the rows and ordering with the task.",
        );
        if (pass)
          recordLearning(
            "project:databases",
            support ? "assisted" : "independent",
            `SQLite task: ${sqlTasks[task].title}`,
          );
        cancel();
      }
    };
    w.postMessage({ query });
  };
  return (
    <section
      className="launch-card project-sandbox"
      aria-label="Executable SQL project"
    >
      <small>EXECUTABLE PROJECT · SQLITE</small>
      <h3>Query a course enrollment database.</h3>
      <p>
        A fresh in-memory database is created for each run. Your query executes
        in SQLite, with primary and foreign key constraints. One SQL statement
        per run; results are limited to 100 rows.
      </p>
      <div className="launch-actions">
        {sqlTasks.map((t, i) => (
          <button
            disabled={busy}
            aria-pressed={task === i}
            key={t.title}
            onClick={() => {
              setTask(i);
              setQuery(t.starter);
              setSupport(false);
              setHint(false);
              setOutput(null);
              setStatus("");
            }}
          >
            {i + 1}. {t.title}
          </button>
        ))}
      </div>
      <p>
        <strong>{sqlTasks[task].prompt}</strong>
      </p>
      <details>
        <summary>Tables, sample rows and constraints</summary>
        <pre>{sqlSetup}</pre>
      </details>
      <label>
        SQL query
        <textarea
          rows={6}
          maxLength={6000}
          value={query}
          disabled={busy}
          onChange={(e) => setQuery(e.target.value)}
          spellCheck={false}
        />
      </label>
      <small>{saveStatus}</small>
      <div className="launch-actions">
        <button disabled={busy || !query.trim()} onClick={run}>
          {busy ? "Running…" : "Run SQL"}
        </button>
        {busy && (
          <button
            onClick={() => {
              cancel();
              setStatus("Cancelled. Your query is still saved.");
            }}
          >
            Cancel
          </button>
        )}
        <button
          disabled={busy}
          onClick={() => {
            setSupport(true);
            setHint(true);
          }}
        >
          Show hint
        </button>
        <button
          disabled={busy}
          onClick={() => {
            setSupport(true);
            setQuery(sqlTasks[task].solution);
          }}
        >
          Load one solution
        </button>
      </div>
      {hint && <p>{sqlTasks[task].hint}</p>}
      <div role="status" className="launch-feedback">
        {status || "Expected rows: " + JSON.stringify(sqlTasks[task].expected)}
      </div>
      {output && onEvidence && (
        <button
          onClick={() => {
            onEvidence(
              `\n\nSQLite task: ${sqlTasks[task].title}\nQuery:\n${query}\nReturned rows: ${JSON.stringify(output.rows)}\n${status}\n`,
            );
            setStatus(
              "Query and result added to the selected project milestone.",
            );
          }}
        >
          Add query and result to project notes
        </button>
      )}
      {output && (
        <div className="launch-table">
          <table>
            <thead>
              <tr>
                {output.columns.map((c, i) => (
                  <th key={i}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {output.rows.map((r, i) => (
                <tr key={i}>
                  {r.map((v, j) => (
                    <td key={j}>{v === null ? "NULL" : String(v)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {!output.rows.length && (
            <p>
              {output.columns.length
                ? "No rows returned."
                : `Statement completed; affected rows: ${output.changed}.`}
            </p>
          )}
          {output.truncated && <p>Showing the first 100 rows.</p>}
        </div>
      )}
    </section>
  );
}
