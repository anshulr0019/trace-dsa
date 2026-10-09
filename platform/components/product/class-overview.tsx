"use client";
import { useState } from "react";
import "../learning/launch.css";
type Assignment = { id: string; title: string; due_at: string | null };
type Submission = {
  id: string;
  assignment_id: string;
  user_id: string;
  display_name: string;
  score: number | null;
  reflection: string;
  updated_at: string;
  language: string;
};
export function ClassOverview({
  assignments,
  submissions,
  enrollment,
  onReview,
}: {
  assignments: Assignment[];
  submissions: Submission[];
  enrollment: { user_id: string; joined_at: string }[];
  onReview: (id: string) => void;
}) {
  const [filter, setFilter] = useState("all");
  const latestFor = (user: string, assignment: string) =>
    submissions
      .filter((s) => s.user_id === user && s.assignment_id === assignment)
      .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at))[0];
  const students = enrollment.map((member, index) => {
    const work = submissions.filter((s) => s.user_id === member.user_id),
      latest = [...work].sort(
        (a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at),
      )[0];
    return {
      ...member,
      name: latest?.display_name || `Learner ${index + 1}`,
      work,
    };
  });
  const filtered = students.filter(
    (s) =>
      filter === "all" ||
      (filter === "pending" &&
        assignments.some((a) => !latestFor(s.user_id, a.id))) ||
      (filter === "attention" &&
        s.work.some(
          (w) =>
            (w.score !== null && w.score < 70) ||
            w.reflection.trim().length < 40,
        )),
  );
  const exportReport = () => {
    const cell = (v: unknown) => {
      let text = String(v ?? "");
      if (/^[=+@-]/.test(text)) text = "'" + text;
      return '"' + text.replaceAll('"', '""') + '"';
    };
    const rows = [
      [
        "Student",
        "Assignment",
        "Status",
        "Practice score",
        "Language",
        "Last submitted",
      ],
      ...students.flatMap((s) =>
        assignments.map((a) => {
          const w = latestFor(s.user_id, a.id);
          return [
            s.name,
            a.title,
            w ? "Submitted" : "Not submitted",
            w?.score ?? "",
            w?.language ?? "",
            w?.updated_at ?? "",
          ];
        }),
      ),
    ];
    const url = URL.createObjectURL(
      new Blob([rows.map((r) => r.map(cell).join(",")).join("\r\n")], {
        type: "text/csv;charset=utf-8",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "trace-class-progress.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <section className="launch-card" aria-label="Class progress overview">
      <small>CLASS OVERVIEW</small>
      <h3>See who needs a next step.</h3>
      <p>
        {students.length} enrolled · {assignments.length} assignments ·{" "}
        {students.filter((s) => s.work.length).length} students have submitted.
        Practice scores are reported by the student’s browser; use their code
        and explanation to assess understanding.
      </p>
      <div className="launch-actions">
        <label>
          Show students
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All students</option>
            <option value="pending">Missing a submission</option>
            <option value="attention">Low score or short explanation</option>
          </select>
        </label>
        <button disabled={!students.length} onClick={exportReport}>
          Export class report
        </button>
      </div>
      {filter === "attention" && (
        <p>
          This filter includes a reported score below 70 or an explanation under
          40 characters. It is a review prompt.
        </p>
      )}
      <div className="launch-table">
        <table>
          <thead>
            <tr>
              <th>Student</th>
              {assignments.map((a) => (
                <th key={a.id}>{a.title}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.user_id}>
                <th>{s.name}</th>
                {assignments.map((a) => {
                  const w = latestFor(s.user_id, a.id),
                    overdue = a.due_at && Date.parse(a.due_at) < Date.now();
                  return (
                    <td key={a.id}>
                      {w ? (
                        <button onClick={() => onReview(w.id)}>
                          {w.score === null ? "Submitted" : `${w.score}/100`} ·
                          Review →
                        </button>
                      ) : overdue ? (
                        "Overdue"
                      ) : (
                        "Not submitted"
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!filtered.length && <p>No students match this view.</p>}
      {!assignments.length && (
        <p>Create an assignment to start collecting progress.</p>
      )}
    </section>
  );
}
