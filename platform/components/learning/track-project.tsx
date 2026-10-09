"use client";
import { lazy, Suspense, useEffect, useState } from "react";
import type { LearningTrack } from "@/lib/learning/references";
import { trackProjects } from "@/lib/learning/projects";
const ProjectSandbox = lazy(() =>
  import("./project-sandbox").then((m) => ({ default: m.ProjectSandbox })),
);
import { CourseSources } from "./course-study";
import "./course-content.css";
export function TrackProject({
  track,
  onOpen,
}: {
  track: LearningTrack;
  onOpen?: (id: string) => void;
}) {
  const p = trackProjects[track],
    storage = `trace:capstone:${track}`;
  const [step, setStep] = useState(0),
    [open, setOpen] = useState(false),
    [notes, setNotes] = useState<string[]>(["", "", ""]),
    [checks, setChecks] = useState<number[]>([]),
    [ready, setReady] = useState(false),
    [solution, setSolution] = useState(false),
    [status, setStatus] = useState("");
  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem(storage) ?? "null");
      if (Array.isArray(data?.notes))
        setNotes(
          p.milestones.map((_, i) =>
            typeof data.notes[i] === "string"
              ? data.notes[i].slice(0, 10000)
              : "",
          ),
        );
      if (Array.isArray(data?.checks))
        setChecks(
          data.checks.filter(
            (i: unknown) =>
              typeof i === "number" &&
              Number.isInteger(i) &&
              i >= 0 &&
              i < p.checks.length,
          ),
        );
    } catch {}
    setReady(true);
  }, [storage, p]);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(storage, JSON.stringify({ notes, checks }));
      window.dispatchEvent(new Event("trace:notebook"));
      setStatus("Saved on this browser");
    } catch {
      setStatus(
        "Storage unavailable; keep or export your work before leaving.",
      );
    }
  }, [notes, checks, ready, storage]);
  const download = () => {
    const content =
      `# ${p.title}\n\n${p.brief}\n\n` +
      p.milestones
        .map(
          (m, i) =>
            `## ${i + 1}. ${m.title}\n\n${m.task}\n\n${notes[i] || "(No evidence recorded yet)"}\n`,
        )
        .join("\n") +
      "\n## Self-review\n\n" +
      p.checks
        .map((c, i) => `- [${checks.includes(i) ? "x" : " "}] ${c}`)
        .join("\n");
    const url = URL.createObjectURL(
      new Blob([content], { type: "text/markdown" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `trace-${track}-project.md`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <details
      className="course-clinic course-project"
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary>Track project · {p.title}</summary>
      <section className="course-study">
        <header>
          <small>CONNECT THE LESSONS</small>
          <h2>{p.title}</h2>
          <p>{p.brief}</p>
        </header>
        <nav aria-label="Project milestones">
          {p.milestones.map((m, i) => (
            <button
              key={m.title}
              aria-pressed={step === i}
              onClick={() => {
                setStep(i);
                setSolution(false);
              }}
            >
              0{i + 1} · {m.title}
            </button>
          ))}
        </nav>
        <div className="course-study-body">
          {open && (
            <Suspense fallback={<p role="status">Preparing project tools…</p>}>
              <ProjectSandbox
                track={track}
                labIds={p.labIds}
                onEvidence={(text) =>
                  setNotes((all) =>
                    all.map((v, i) =>
                      i === step ? (v + text).slice(-10000) : v,
                    ),
                  )
                }
              />
            </Suspense>
          )}
          <h3>{p.milestones[step].title}</h3>
          <p>{p.milestones[step].task}</p>
          <label className="course-response">
            Your design, calculations and evidence
            <textarea
              rows={7}
              maxLength={10000}
              value={notes[step] || ""}
              onChange={(e) =>
                setNotes((all) =>
                  all.map((v, i) => (i === step ? e.target.value : v)),
                )
              }
            />
          </label>
          <small role="status">{status}</small>
          <div className="course-step-controls">
            <button
              aria-expanded={solution}
              onClick={() => setSolution(!solution)}
            >
              {solution
                ? "Hide review guidance"
                : "Review one defensible approach"}
            </button>
            <button onClick={download}>Export project notes</button>
          </div>
          {solution && (
            <aside className="course-answer">
              <p>{p.milestones[step].model}</p>
            </aside>
          )}
          {onOpen && p.labIds.length > 0 && (
            <>
              <h3>Collect evidence from the labs</h3>
              <div className="course-step-controls">
                {p.labIds.map((id) => (
                  <button key={id} onClick={() => onOpen(id)}>
                    {id.replaceAll("-", " ")} ↗
                  </button>
                ))}
              </div>
            </>
          )}
          <fieldset>
            <legend>Project self-review</legend>
            {p.checks.map((c, i) => (
              <label key={c}>
                <input
                  type="checkbox"
                  checked={checks.includes(i)}
                  onChange={(e) =>
                    setChecks((all) =>
                      e.target.checked
                        ? [...all, i]
                        : all.filter((n) => n !== i),
                    )
                  }
                />
                {c}
              </label>
            ))}
          </fieldset>
        </div>
        <CourseSources track={track} />
      </section>
    </details>
  );
}
