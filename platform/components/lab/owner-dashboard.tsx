"use client";
import { useEffect, useRef, useState } from "react";
import { problems, patterns } from "@/lib/curriculum/catalog";
import type { Language } from "@/lib/curriculum/playground";
import { examplesFor, matchesAnswer } from "@/lib/curriculum/learning";
import { referenceCode } from "@/lib/practice/evaluate";
import {
  runtimeCapabilities,
  executeSubmission,
} from "@/lib/curriculum/runtime-client";
import { runRecords, type RunRecord } from "@/lib/lab/diagnostics";
import {
  checkKinds,
  qualityChecks,
  mergeQualityChecks,
  saveQuality,
  qualityKey,
  type QualityCheck,
  type CheckKind,
} from "@/lib/lab/quality";
import { downloadJSON } from "@/lib/lab/storage";
import { openProblem, lessonURL } from "@/lib/product/lessons";
import { AccountPanel } from "../product/account";
import { cloud, result } from "@/lib/product/cloud";
import { useOwnerAccess } from "./owner-access";
import { LessonEditorial } from "./editorial";
import { Scene } from "../curriculum/scene";
import { WorkflowChecks } from "./workflow-checks";
import { readLocal } from "@/lib/lab/storage";
export function OwnerDashboard() {
  const { owner, checked, error, local } = useOwnerAccess(),
    [checks, setChecks] = useState<Record<string, QualityCheck>>({}),
    [runs, setRuns] = useState<RunRecord[]>([]),
    [language, setLanguage] = useState<Language>("java"),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all"),
    [page, setPage] = useState(0),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [reported, setReported] = useState<
      {
        problem_id: string;
        language: string;
        status: string;
        duration_ms: number;
        created_at: string;
      }[]
    >([]),
    [preview, setPreview] = useState("student");
  const controller = useRef<AbortController | null>(null),
    inFlight = useRef(false);
  useEffect(() => {
    const refresh = () => {
      setChecks(qualityChecks());
      setRuns(runRecords());
    };
    refresh();
    window.addEventListener("trace:quality", refresh);
    window.addEventListener("trace:diagnostics", refresh);
    return () => {
      window.removeEventListener("trace:quality", refresh);
      window.removeEventListener("trace:diagnostics", refresh);
      controller.current?.abort();
    };
  }, []);
  useEffect(() => {
    if (!owner || !cloud) return;
    let active = true;
    void Promise.all([
      result(cloud.from("quality_checks").select("*")),
      result(
        cloud
          .from("site_run_events")
          .select("problem_id,language,status,duration_ms,created_at")
          .order("created_at", { ascending: false })
          .limit(100),
      ),
    ])
      .then(([rows, events]) => {
        if (!active) return;
        const remote = Object.fromEntries(
          (rows ?? []).map((r) => [
            r.key,
            {
              key: r.key,
              problemId: r.problem_id,
              language: r.language,
              kind: r.kind,
              status: r.status,
              source: r.source,
              note: r.note,
              checkedAt: r.checked_at,
              ...r.evidence,
            },
          ]),
        );
        setChecks(mergeQualityChecks(remote));
        setReported(events ?? []);
      })
      .catch((e) => {
        if (active) setMessage(e.message);
      });
    return () => {
      active = false;
    };
  }, [owner]);
  useEffect(() => {
    if (!local && !owner) controller.current?.abort();
  }, [owner, local]);
  const filtered = problems.filter(
      (p) =>
        (p.title + " " + patterns[p.group - 1])
          .toLowerCase()
          .includes(query.toLowerCase()) &&
        (filter === "all" ||
          (filter === "failed" &&
            checkKinds.some(
              (k) => checks[qualityKey(p.id, language, k)]?.status === "failed",
            )) ||
          (filter === "pending" &&
            checkKinds.some(
              (k) =>
                !checks[qualityKey(p.id, language, k)] ||
                checks[qualityKey(p.id, language, k)].status === "pending",
            ))),
    ),
    visible = filtered.slice(page * 20, (page + 1) * 20),
    count = Object.values(checks),
    completed = count.filter((c) => c.status === "passed").length,
    latencies = runs.map((r) => r.durationMs).sort((a, b) => a - b),
    p95 = latencies.length
      ? latencies[
          Math.min(latencies.length - 1, Math.floor(latencies.length * 0.95))
        ]
      : null;
  async function store(check: QualityCheck) {
    saveQuality(check);
    if (owner && cloud) {
      await result(
        cloud.from("quality_checks").upsert({
          key: check.key,
          problem_id: check.problemId,
          language: check.language,
          kind: check.kind,
          status: check.status,
          source: check.source,
          note: check.note,
          checked_at: check.checkedAt,
          evidence: { passed: check.passed, total: check.total },
        }),
      );
    }
  }
  async function runChecks() {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    controller.current = new AbortController();
    try {
      const runtime = await runtimeCapabilities(controller.current.signal);
      for (const p of visible) {
        controller.current.signal.throwIfAborted();
        let passed = 0,
          reason = "",
          blocked = false;
        const examples = examplesFor(p);
        setMessage(`Checking ${p.title} · ${language}`);
        for (const e of examples) {
          try {
            const run = await executeSubmission(
              {
                problemId: p.id,
                language,
                code: referenceCode(p.id, language),
                input: e.input,
                automatic: false,
              },
              runtime,
              controller.current.signal,
            );
            if (!run.error && matchesAnswer(p, e.input, e.expected, run.result))
              passed++;
            else reason = run.error ?? `Different answer for ${e.label}`;
          } catch (err) {
            if (controller.current.signal.aborted) throw err;
            reason = err instanceof Error ? err.message : String(err);
            blocked = /load|could not start|unavailable|connection/i.test(
              reason,
            );
            break;
          }
        }
        await store({
          key: qualityKey(p.id, language, "execution"),
          problemId: p.id,
          language,
          kind: "execution",
          status: blocked
            ? "blocked"
            : passed === examples.length
              ? "passed"
              : "failed",
          checkedAt: new Date().toISOString(),
          source: "reference-suite",
          note:
            reason ||
            "All five learning examples returned the authored answers.",
          passed,
          total: examples.length,
        });
      }
      setMessage(
        "Reference checks finished for this page. Animation, alignment, explanations and mobile checks remain manual.",
      );
    } catch (err) {
      setMessage(
        controller.current.signal.aborted
          ? "Reference checks cancelled. Completed results remain saved."
          : err instanceof Error
            ? err.message
            : String(err),
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  if (!local && (!checked || !owner))
    return (
      <section className="product-page">
        <h1>Owner workspace</h1>
        <AccountPanel />
        <p>
          {!checked
            ? "Checking owner access…"
            : "This account needs the owner role to access site diagnostics and publishing."}
        </p>
        {error && <p>{error}</p>}
      </section>
    );
  return (
    <section className="product-page">
      <div className="eyebrow mint">TRACE WORKSPACE CHECKS</div>
      <h1>{local ? "Checks on this device" : "Owner dashboard"}</h1>
      <p>
        Track evidence for each problem and language. A check is green only
        after its specific result was recorded.
      </p>
      {local && (
        <p className="workspace-pending">
          This workspace stores your checks on this browser. Private site
          diagnostics and publishing require an owner account.
        </p>
      )}
      <div className="health-strip">
        <div>
          <strong>{completed} / 2,000</strong>
          <span>problem × language × checks marked passed</span>
        </div>
        <div>
          <strong>{runs.filter((r) => r.status === "error").length}</strong>
          <span>errors among {runs.length} recent local runs</span>
        </div>
        <div>
          <strong>{p95 === null ? "—" : `${(p95 / 1000).toFixed(1)}s`}</strong>
          <span>recent P95 run latency, including loading/compilation</span>
        </div>
      </div>
      <section className="product-card">
        <h2>Problem quality matrix</h2>
        <div className="product-actions">
          <label>
            Language
            <select
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value as Language);
                setPage(0);
              }}
            >
              {["java", "cpp", "python", "javascript"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label>
            Search problem
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
            />
          </label>
          <label>
            Show
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setPage(0);
              }}
            >
              <option value="all">All problems</option>
              <option value="failed">Has a failed check</option>
              <option value="pending">Needs a check</option>
            </select>
          </label>
        </div>
        <div className="product-actions">
          <button
            disabled={busy || !visible.length}
            onClick={() => void runChecks()}
          >
            Run reference checks for this page
          </button>
          {busy && (
            <button onClick={() => controller.current?.abort()}>Cancel</button>
          )}
          <button
            onClick={() =>
              downloadJSON("trace-quality-checks.json", {
                checks,
                runs,
                workflows: readLocal("trace:quality:workflows", {}),
              })
            }
          >
            Export checks & local run logs
          </button>
        </div>
        <p>
          Execution checks run the five examples. Record animation, alignment,
          explanation and mobile checks after inspecting them yourself.
        </p>
        <div className="check-matrix-scroll">
          <table className="check-matrix">
            <thead>
              <tr>
                <th>Problem</th>
                {checkKinds.map((k) => (
                  <th key={k}>{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <tr key={p.id}>
                  <td>
                    <button
                      onClick={() => openProblem(p.id, `&language=${language}`)}
                    >
                      {p.title}
                    </button>
                    <small>{patterns[p.group - 1]}</small>
                  </td>
                  {checkKinds.map((kind) => {
                    const c = checks[qualityKey(p.id, language, kind)];
                    return (
                      <td key={kind}>
                        <select
                          aria-label={`${p.title} ${language} ${kind} check`}
                          value={c?.status ?? "pending"}
                          disabled={busy}
                          onChange={(e) => {
                            const check: QualityCheck = {
                              key: qualityKey(p.id, language, kind),
                              problemId: p.id,
                              language,
                              kind: kind as CheckKind,
                              status: e.target.value as QualityCheck["status"],
                              source: "manual",
                              checkedAt:
                                e.target.value === "pending"
                                  ? null
                                  : new Date().toISOString(),
                              note: c?.note ?? "",
                            };
                            void store(check).catch((err) =>
                              setMessage(err.message),
                            );
                          }}
                        >
                          <option value="pending">Not checked</option>
                          <option value="passed">Passed</option>
                          <option value="failed">Failed</option>
                          <option value="blocked">Blocked</option>
                        </select>
                        {c?.checkedAt && (
                          <small>
                            {new Date(c.checkedAt).toLocaleDateString()} ·{" "}
                            {c.source}
                          </small>
                        )}
                        {c?.source === "reference-suite" && (
                          <small>
                            {c.passed} / {c.total} examples
                          </small>
                        )}
                        <input
                          aria-label={`${p.title} ${kind} check note`}
                          defaultValue={c?.note ?? ""}
                          placeholder="Evidence or issue"
                          onBlur={(e) => {
                            if (c && e.target.value !== c.note)
                              void store({
                                ...c,
                                note: e.target.value.slice(0, 1000),
                              }).catch((err) => setMessage(err.message));
                          }}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="product-actions">
          <button disabled={page === 0} onClick={() => setPage((v) => v - 1)}>
            Previous page
          </button>
          <span>
            {page + 1} / {Math.max(1, Math.ceil(filtered.length / 20))}
          </span>
          <button
            disabled={(page + 1) * 20 >= filtered.length}
            onClick={() => setPage((v) => v + 1)}
          >
            Next page
          </button>
        </div>
      </section>
      <WorkflowChecks />
      <section className="product-card">
        <h2>Recent local runs & issue reproduction</h2>
        <p>
          These logs stay on this browser and include code and input. Share an
          exported report only after checking its contents.
        </p>
        {runs.map((r) => (
          <details className="saved-item" key={r.id}>
            <summary>
              {r.problemId} · {r.language} · {r.status} ·{" "}
              {(r.durationMs / 1000).toFixed(1)}s
            </summary>
            <small>
              {new Date(r.at).toLocaleString()} · {r.frames} captured states ·{" "}
              {r.runtime}
            </small>
            {r.error && <p className="check-fail">{r.error}</p>}
            <pre>{JSON.stringify(r.input, null, 2)}</pre>
            <div className="product-actions">
              <button onClick={() => downloadJSON("trace-run-report.json", r)}>
                Export this report
              </button>
              <button
                onClick={() => {
                  try {
                    location.assign(
                      lessonURL({
                        version: 1,
                        problemId: r.problemId,
                        title: "Reproduce this run",
                        instructions: r.error ?? "Inspect this code and input.",
                        language: r.language as Language,
                        input: r.input,
                        code: r.code,
                      }),
                    );
                  } catch (e) {
                    setMessage(
                      e instanceof Error
                        ? e.message
                        : "Export this run report to keep its code.",
                    );
                  }
                }}
              >
                Open reproduction
              </button>
            </div>
          </details>
        ))}
        {!runs.length && (
          <p>
            No runs recorded on this browser yet. Run an example to populate
            this list.
          </p>
        )}
      </section>
      {owner && (
        <section className="product-card">
          <h2>Reported site run health</h2>
          <p>
            Opt-in device reports contain timing and status only. They do not
            certify correctness.
          </p>
          {reported.map((r, i) => (
            <p key={i}>
              {r.problem_id} · {r.language} · {r.status} ·{" "}
              {(r.duration_ms / 1000).toFixed(1)}s ·{" "}
              {new Date(r.created_at).toLocaleString()}
            </p>
          ))}
          {!reported.length && <p>No shared run-health reports yet.</p>}
        </section>
      )}
      <section className="product-card">
        <h2>Student & teacher previews</h2>
        <p>
          These previews use sample content. They do not change account roles or
          create real classes.
        </p>
        <div className="product-actions">
          <button
            aria-pressed={preview === "student"}
            onClick={() => setPreview("student")}
          >
            Student preview
          </button>
          <button
            aria-pressed={preview === "teacher"}
            onClick={() => setPreview("teacher")}
          >
            Teacher preview
          </button>
        </div>
        {preview === "student" ? (
          <>
            <h3>Sample lesson: sliding window</h3>
            <Scene problem={problems[0]} input={problems[0].input} />
            <p>
              Explore the input, explain the window update, then practise a
              fresh case.
            </p>
            <button
              onClick={() =>
                openProblem(problems[0].id, `&language=${language}`)
              }
            >
              Open real lesson
            </button>
          </>
        ) : (
          <>
            <h3>Sample teacher workflow</h3>
            <p>
              Choose an input and question, share the lesson, then review each
              student’s explanation.
            </p>
            <a href="/?view=teacher">Open lesson builder</a>
            <p>
              To verify teacher/student access, test with separate real accounts
              after cloud setup.
            </p>
          </>
        )}
      </section>
      <LessonEditorial canPublish={owner} />
      <p role="status">{message}</p>
    </section>
  );
}
