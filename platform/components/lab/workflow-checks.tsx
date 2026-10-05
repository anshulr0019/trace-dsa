"use client";
import { useEffect, useState } from "react";
import { readLocal, saveLocal } from "@/lib/lab/storage";
const flows = [
  ["navigation", "Sidebar returns to the problem list"],
  ["sharing", "Shared input/code restores correctly"],
  ["sign-in", "Email sign-in and sign-out"],
  ["notebook", "Notebook export/import and device sync"],
  ["courses", "Create, reorder and assign a course"],
  ["enrollment", "Join, remove and reopen class enrollment"],
  ["feedback", "Student submission and teacher feedback"],
  ["live-playback", "Teacher play, pause and seek reach a student"],
  ["live-polls", "Student response appears for the teacher"],
] as const;
type Check = { status: string; note: string; at: string | null };
export function WorkflowChecks() {
  const [checks, setChecks] = useState<Record<string, Check>>({}),
    [message, setMessage] = useState("");
  useEffect(() => setChecks(readLocal("trace:quality:workflows", {})), []);
  function update(id: string, change: Partial<Check>) {
    const next = {
      ...checks,
      [id]: {
        ...(checks[id] ?? { status: "pending", note: "", at: null }),
        ...change,
      },
    };
    setChecks(next);
    try {
      saveLocal("trace:quality:workflows", next);
      setMessage("Workflow check saved on this browser.");
    } catch {
      setMessage("Storage unavailable. Keep a copy of your findings.");
    }
  }
  return (
    <section className="product-card">
      <h2>Website workflow checks</h2>
      <p>
        Record these after testing the real workflow. Cloud workflows need
        separate teacher/student accounts; the previews do not verify their
        permissions.
      </p>
      <div className="check-matrix-scroll">
        <table className="check-matrix">
          <thead>
            <tr>
              <th>Workflow</th>
              <th>Result</th>
              <th>What you checked</th>
            </tr>
          </thead>
          <tbody>
            {flows.map(([id, title]) => (
              <tr key={id}>
                <td>{title}</td>
                <td>
                  <select
                    aria-label={`${title} status`}
                    value={checks[id]?.status ?? "pending"}
                    onChange={(e) =>
                      update(id, {
                        status: e.target.value,
                        at:
                          e.target.value === "pending"
                            ? null
                            : new Date().toISOString(),
                      })
                    }
                  >
                    <option value="pending">Not checked</option>
                    <option value="passed">Passed</option>
                    <option value="failed">Failed</option>
                    <option value="blocked">Blocked</option>
                  </select>
                  {checks[id]?.at && (
                    <small>{new Date(checks[id].at!).toLocaleString()}</small>
                  )}
                </td>
                <td>
                  <input
                    aria-label={`${title} evidence`}
                    value={checks[id]?.note ?? ""}
                    maxLength={1000}
                    onChange={(e) => update(id, { note: e.target.value })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p role="status">{message}</p>
    </section>
  );
}
