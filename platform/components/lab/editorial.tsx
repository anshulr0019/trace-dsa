"use client";
import { useEffect, useState } from "react";
import { problems, problemById } from "@/lib/curriculum/catalog";
import { cloud, result } from "@/lib/product/cloud";
import { readLocal, saveLocal } from "@/lib/lab/storage";
export type PublishedLesson = {
  problem_id: string;
  title: string;
  explanation: string;
  updated_at: string;
};
export function usePublishedLesson(id: string) {
  const [value, setValue] = useState<PublishedLesson | null>(null);
  useEffect(() => {
    setValue(null);
    if (!cloud) return;
    let active = true;
    void result(
      cloud
        .from("lesson_content")
        .select("problem_id,title,explanation,updated_at")
        .eq("problem_id", id)
        .maybeSingle(),
    )
      .then((row) => {
        if (active) setValue(row);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [id]);
  return value;
}
export function LessonEditorial({ canPublish }: { canPublish: boolean }) {
  const [id, setId] = useState(problems[0].id),
    [title, setTitle] = useState(problems[0].title),
    [explanation, setExplanation] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [history, setHistory] = useState<PublishedLesson[]>([]);
  useEffect(() => {
    const draft = readLocal<{ title: string; explanation: string } | null>(
      `trace:editorial:${id}`,
      null,
    );
    setTitle(draft?.title ?? problemById[id].title);
    setExplanation(draft?.explanation ?? "");
    setHistory([]);
    if (canPublish && cloud) {
      let active = true;
      void result(
        cloud
          .from("lesson_revisions")
          .select("problem_id,title,explanation,updated_at")
          .eq("problem_id", id)
          .order("updated_at", { ascending: false })
          .limit(10),
      )
        .then((rows) => {
          if (active) setHistory(rows ?? []);
        })
        .catch((e) => {
          if (active) setMessage(e.message);
        });
      return () => {
        active = false;
      };
    }
  }, [id, canPublish]);
  return (
    <section className="product-card">
      <h2>Lesson editor & publication history</h2>
      <p>
        Write an additional explanation for a problem. Drafts stay on this
        device; publishing makes the explanation visible to learners through the
        configured database.
      </p>
      <label>
        Problem
        <select value={id} onChange={(e) => setId(e.target.value)}>
          {problems.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      </label>
      <label>
        Explanation heading
        <input
          value={title}
          maxLength={120}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>
      <label>
        Teaching explanation
        <textarea
          value={explanation}
          maxLength={8000}
          onChange={(e) => setExplanation(e.target.value)}
        />
      </label>
      <div className="product-actions">
        <button
          onClick={() => {
            try {
              saveLocal(`trace:editorial:${id}`, { title, explanation });
              setMessage("Draft saved on this device.");
            } catch {
              setMessage(
                "Storage unavailable. Copy the explanation before leaving.",
              );
            }
          }}
        >
          Save draft
        </button>
        <button
          disabled={!canPublish || busy || !explanation.trim()}
          onClick={() => {
            if (!cloud) return;
            setBusy(true);
            void result(
              cloud
                .from("lesson_content")
                .upsert({
                  problem_id: id,
                  title: title.trim() || problemById[id].title,
                  explanation,
                }),
            )
              .then(() => {
                setMessage(
                  "Explanation published. Reopen the problem to read it.",
                );
                return result(
                  cloud!
                    .from("lesson_revisions")
                    .select("problem_id,title,explanation,updated_at")
                    .eq("problem_id", id)
                    .order("updated_at", { ascending: false })
                    .limit(10),
                );
              })
              .then((rows) => setHistory(rows ?? []))
              .catch((e) => setMessage(e.message))
              .finally(() => setBusy(false));
          }}
        >
          Publish explanation
        </button>
      </div>
      <details>
        <summary>Draft preview</summary>
        <h3>{title}</h3>
        <p>{explanation || "Your explanation preview will appear here."}</p>
      </details>
      {!canPublish && (
        <p className="workspace-pending">
          Publishing needs a configured account with the owner role.
        </p>
      )}
      {history.map((v, i) => (
        <details className="saved-item" key={v.updated_at + String(i)}>
          <summary>
            {v.title} · {new Date(v.updated_at).toLocaleString()}
          </summary>
          <p>{v.explanation}</p>
          <button
            onClick={() => {
              setTitle(v.title);
              setExplanation(v.explanation);
              setMessage(
                "Earlier revision loaded as a draft. Publish to make it current.",
              );
            }}
          >
            Load revision as draft
          </button>
        </details>
      ))}
      <p role="status">{message}</p>
    </section>
  );
}
