"use client";
import { useEffect, useState } from "react";
import { problems, patterns } from "@/lib/curriculum/catalog";
import {
  emptyNote,
  readNote,
  saveNote,
  notebookSnapshot,
  restoreNotebook,
  type Note,
} from "@/lib/product/notebook";
import { openProblem } from "@/lib/product/lessons";
import { experiments, reviewDate } from "@/lib/lab/study";
import {
  learningEvidence,
  learningStatus,
  reviewDue,
} from "@/lib/product/mastery";
import { AccountPanel } from "./account";
export function ProblemNotes({ id }: { id: string }) {
  const [note, setNote] = useState<Note>(emptyNote),
    [message, setMessage] = useState("");
  useEffect(() => setNote(readNote(id)), [id]);
  function update(change: Partial<Note>) {
    const next = { ...note, ...change };
    setNote(next);
    try {
      saveNote(id, next);
      setMessage("Saved on this device.");
    } catch {
      setMessage(
        "Storage unavailable. Export your notebook to keep your work.",
      );
    }
  }
  return (
    <details className="product-card problem-notes">
      <summary>Your notes & revision</summary>
      <div className="product-actions">
        <button
          aria-pressed={note.bookmarked}
          onClick={() => update({ bookmarked: !note.bookmarked })}
        >
          {note.bookmarked ? "★ Bookmarked" : "☆ Bookmark"}
        </button>
        <button
          aria-pressed={note.revision}
          onClick={() => update({ revision: !note.revision })}
        >
          {note.revision ? "In revision list" : "Add to revision list"}
        </button>
      </div>
      <label>
        Explain the idea in your own words
        <textarea
          value={note.notes}
          maxLength={8000}
          onChange={(e) => update({ notes: e.target.value })}
        />
      </label>
      <small role="status">{message}</small>
    </details>
  );
}
export function Notebook() {
  const [revision, setRevision] = useState(0),
    [filter, setFilter] = useState("saved"),
    [path, setPath] = useState("all"),
    [message, setMessage] = useState(""),
    [backup, setBackup] = useState<Record<string, string> | null>(null);
  useEffect(() => {
    const sync = () => setRevision((n) => n + 1);
    window.addEventListener("trace:notebook", sync);
    return () => window.removeEventListener("trace:notebook", sync);
  }, []);
  void revision;
  const completed = problems
    .filter((p) => learningEvidence(p.id).some((e) => e.kind === "independent"))
    .map((p) => p.id);
  const items = problems.filter((p) => {
    const n = readNote(p.id);
    return (
      (filter === "all" ||
        (filter === "saved" && n.bookmarked) ||
        (filter === "revision" &&
          (n.revision || reviewDue(learningEvidence(p.id)))) ||
        (filter === "complete" && completed.includes(p.id))) &&
      (path === "all" ||
        (path === "beginner" && p.stage === "Concept") ||
        (path === "interview" && p.tier <= 2))
    );
  });
  return (
    <section className="product-page">
      <div className="eyebrow mint">YOUR LEARNING</div>
      <h1>Student notebook</h1>
      <p>
        Keep useful examples, your own explanations, and the concepts you want
        to revisit.
      </p>
      <AccountPanel />
      <section className="product-card">
        <h2>My custom problems</h2>
        <p>
          Saved variants preserve your own code and input with their base DSA
          pattern.
        </p>
        <div className="notebook-list">
          {experiments().map((e) => (
            <article key={e.id}>
              <div>
                <h3>{e.title}</h3>
                <small>
                  {e.language} · {new Date(e.createdAt).toLocaleDateString()}
                </small>
                <p>{e.description}</p>
              </div>
              <button
                onClick={() =>
                  openProblem(
                    e.problemId,
                    `&language=${e.language}&study=${e.id}`,
                  )
                }
              >
                Open saved problem →
              </button>
            </article>
          ))}
          {!experiments().length && (
            <p>
              Open a roadmap problem and use “My study workspace” to save your
              variant.
            </p>
          )}
        </div>
      </section>
      <section className="product-card">
        <h2>Revision calendar</h2>
        <div className="notebook-list">
          {problems
            .filter(
              (p) => reviewDate(p.id) || reviewDue(learningEvidence(p.id)),
            )
            .sort((a, b) => reviewDate(a.id).localeCompare(reviewDate(b.id)))
            .map((p) => (
              <article key={p.id}>
                <div>
                  <h3>{p.title}</h3>
                  <small className="revision-date">
                    {reviewDue(learningEvidence(p.id))
                      ? "Due for revision"
                      : `Revise on ${reviewDate(p.id)}`}
                  </small>
                </div>
                <button onClick={() => openProblem(p.id)}>Revise →</button>
              </article>
            ))}
        </div>
        <p>
          Revision includes your scheduled dates and reminders from recorded
          practice.
        </p>
      </section>
      <section className="product-card">
        <div className="product-actions">
          <label>
            Show
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="saved">Bookmarks</option>
              <option value="revision">Revision list</option>
              <option value="complete">Solved independently</option>
              <option value="all">All problems</option>
            </select>
          </label>
          <label>
            Learning path
            <select
              value={path}
              onChange={(e) => {
                setPath(e.target.value);
                setFilter("all");
              }}
            >
              <option value="all">Full roadmap</option>
              <option value="beginner">Start DSA · 25 concepts</option>
              <option value="interview">
                Linear data & search · first two tiers
              </option>
            </select>
          </label>
        </div>
        <p>
          {completed.length} / 100 solved independently · {items.length} shown
        </p>
        <div className="notebook-list">
          {items.map((p) => {
            const n = readNote(p.id);
            return (
              <article key={p.id}>
                <div>
                  <small>
                    {patterns[p.group - 1]} · {p.stage}
                  </small>
                  <h3>{p.title}</h3>
                  <small>
                    {reviewDue(learningEvidence(p.id))
                      ? "Due for revision"
                      : learningStatus(learningEvidence(p.id))}
                  </small>
                  {n.notes && <p>{n.notes.slice(0, 200)}</p>}
                </div>
                <button onClick={() => openProblem(p.id)}>Open →</button>
              </article>
            );
          })}
          {!items.length && (
            <p>
              Open a problem and bookmark it or add it to your revision list.
            </p>
          )}
        </div>
      </section>
      <section className="product-card">
        <h2>Keep a backup</h2>
        <p>
          Backups contain your code, notes, and practice history. Store them
          somewhere private.
        </p>
        <div className="product-actions">
          <button
            onClick={() => {
              const url = URL.createObjectURL(
                new Blob(
                  [
                    JSON.stringify(
                      { version: 1, data: notebookSnapshot() },
                      null,
                      2,
                    ),
                  ],
                  { type: "application/json" },
                ),
              );
              const a = document.createElement("a");
              a.href = url;
              a.download = "trace-notebook.json";
              a.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            }}
          >
            Export notebook
          </button>
          <label className="file-button">
            Import backup
            <input
              type="file"
              accept=".json,application/json"
              onChange={async (e) => {
                try {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 6000000)
                    throw Error(
                      "Backup file must be smaller than 6 MB; saved notebook data is limited to 4 MB.",
                    );
                  const v = JSON.parse(await file.text());
                  if (
                    v.version !== 1 ||
                    !v.data ||
                    typeof v.data !== "object" ||
                    Array.isArray(v.data)
                  )
                    throw Error("Invalid notebook backup.");
                  setBackup(v.data);
                  setMessage(
                    "Restore will replace matching notes and drafts on this browser.",
                  );
                } catch (err) {
                  setMessage(
                    err instanceof Error ? err.message : "Invalid backup.",
                  );
                }
              }}
            />
          </label>
          {backup && (
            <button
              onClick={() => {
                try {
                  restoreNotebook(backup);
                  setBackup(null);
                  setMessage("Notebook restored.");
                } catch {
                  setMessage("Invalid backup values.");
                }
              }}
            >
              Confirm restore
            </button>
          )}
        </div>
        <p role="status">{message}</p>
      </section>
    </section>
  );
}
