"use client";
import { useEffect, useState } from "react";
import type { Problem } from "@/lib/curriculum/catalog";
import type { Language } from "@/lib/curriculum/playground";
import { validateProblemInput } from "@/lib/curriculum/validate";
import {
  experiments,
  versions,
  mistakes,
  saveExperiment,
  saveVersion,
  reviewDate,
  scheduleReview,
  type Experiment,
} from "@/lib/lab/study";
import { display } from "@/components/curriculum/scene";
export function StudyTools({
  problem,
  language,
  code,
  input,
  inputError,
  onRestore,
}: {
  problem: Problem;
  language: Language;
  code: string;
  input: Record<string, unknown>;
  inputError?: string;
  onRestore: (value: Experiment) => void;
}) {
  const [title, setTitle] = useState(""),
    [description, setDescription] = useState(""),
    [message, setMessage] = useState(""),
    [revision, setRevision] = useState(0),
    [date, setDate] = useState(""),
    [undo, setUndo] = useState<Experiment | null>(null);
  useEffect(() => {
    setDate(reviewDate(problem.id));
    const changed = () => {
      setRevision((v) => v + 1);
      setDate(reviewDate(problem.id));
    };
    window.addEventListener("trace:notebook", changed);
    return () => window.removeEventListener("trace:notebook", changed);
  }, [problem.id]);
  void revision;
  const snapshot = () => ({
    problemId: problem.id,
    title: title.trim() || `${problem.title} · ${language}`,
    description,
    language,
    code,
    input,
  });
  function save(kind: "experiment" | "version") {
    try {
      if (inputError) throw Error(inputError);
      const error = validateProblemInput(problem.id, input);
      if (error) throw Error(error);
      if (code.length > 60000)
        throw Error("Save code of at most 60,000 characters.");
      if (kind === "experiment") saveExperiment(snapshot());
      else saveVersion(snapshot());
      setMessage(
        kind === "experiment"
          ? "Custom problem saved to your study workspace."
          : "Code version saved.",
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save.");
    }
  }
  function restore(value: Experiment) {
    setUndo(
      inputError
        ? null
        : { ...snapshot(), id: "undo", createdAt: new Date().toISOString() },
    );
    onRestore(value);
    setMessage(
      inputError
        ? "Saved code and input restored."
        : "Saved code and input restored. Undo is available below.",
    );
  }
  return (
    <details className="product-card study-tools">
      <summary>
        My study workspace · custom problems, versions & revision
      </summary>
      <p>
        Save your own variant of this problem with its code and input. Versions
        preserve an earlier approach so you can return to it.
      </p>
      <div className="product-form-grid">
        <label>
          Problem or version name
          <input
            value={title}
            maxLength={120}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label>
          Revise this concept on
          <input
            type="date"
            value={date}
            onChange={(e) => {
              try {
                scheduleReview(problem.id, e.target.value);
                setDate(e.target.value);
                setMessage("Revision date saved.");
              } catch (err) {
                setMessage(String(err));
              }
            }}
          />
        </label>
      </div>
      <label>
        What are you investigating?
        <textarea
          value={description}
          maxLength={2000}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>
      <div className="product-actions">
        <button onClick={() => save("experiment")}>Save custom problem</button>
        <button onClick={() => save("version")}>Save code version</button>
        {undo && (
          <button
            onClick={() => {
              onRestore(undo);
              setUndo(null);
              setMessage("Previous editor restored.");
            }}
          >
            Undo restore
          </button>
        )}
      </div>
      <div className="lab-columns">
        <section>
          <h3>Saved versions</h3>
          {versions(problem.id)
            .filter((v) => v.language === language)
            .map((v) => (
              <article className="saved-item" key={v.id}>
                <strong>{v.title}</strong>
                <small>{new Date(v.createdAt).toLocaleString()}</small>
                <p>{v.description}</p>
                <button onClick={() => restore(v)}>Restore version</button>
              </article>
            ))}
          {!versions(problem.id).some((v) => v.language === language) && (
            <p>No versions saved for this language.</p>
          )}
        </section>
        <section>
          <h3>Custom problems</h3>
          {experiments()
            .filter((v) => v.problemId === problem.id)
            .map((v) => (
              <article className="saved-item" key={v.id}>
                <strong>{v.title}</strong>
                <p>{v.description}</p>
                <small>
                  {v.language} · {new Date(v.createdAt).toLocaleDateString()}
                </small>
                <button onClick={() => restore(v)}>Open this variant</button>
              </article>
            ))}
        </section>
      </div>
      <h3>Mistake journal</h3>
      {mistakes(problem.id).map((v) => (
        <details className="saved-item" key={v.id}>
          <summary>
            {new Date(v.createdAt).toLocaleDateString()} · {v.language} ·{" "}
            {v.error ? "Execution error" : "Different answer"}
          </summary>
          <p>{v.note}</p>
          <pre>{JSON.stringify(v.input, null, 2)}</pre>
          <p>
            Expected: <code>{display(v.expected)}</code> · Returned:{" "}
            <code>{display(v.actual)}</code>
          </p>
          {v.error && <p>{v.error}</p>}
          <button
            onClick={() =>
              restore({
                ...v,
                title: "Mistake to revisit",
                description: v.note,
              })
            }
          >
            Revisit this code
          </button>
        </details>
      ))}
      {!mistakes(problem.id).length && (
        <p>Save a failing case from “Find my mistake” to revisit it here.</p>
      )}
      <p role="status">{message}</p>
    </details>
  );
}
