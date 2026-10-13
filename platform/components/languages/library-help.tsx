"use client";
import { useState } from "react";
import { BookOpen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { libraryLessons, libraryURL } from "@/lib/languages/catalog";
import type { Language } from "@/lib/curriculum/playground";
import "./languages.css";
export function LibraryHelp({ language }: { language: Language }) {
  const [open, setOpen] = useState(false),
    [query, setQuery] = useState("");
  const rows = libraryLessons.filter(
    (l) =>
      l.language === language &&
      `${l.title} ${l.syntax.join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <button
        className="library-help-button"
        onClick={() => {
          setOpen(true);
          window.dispatchEvent(new Event("trace:pause"));
        }}
      >
        <BookOpen size={14} />
        Library help
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="library-help-dialog">
          <DialogHeader>
            <DialogTitle>Language & library reference</DialogTitle>
            <DialogDescription>
              Check syntax and conditions while keeping your current code open.
            </DialogDescription>
          </DialogHeader>
          <label>
            Find an API
            <input
              aria-label="Search library help"
              placeholder="vector, sort, Map, bisect…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="library-help-results">
            {rows.map((l) => (
              <details key={l.id}>
                <summary>{l.title}</summary>
                <p>{l.explanation}</p>
                {l.syntax.map((s) => (
                  <pre key={s}>
                    <code>{s}</code>
                  </pre>
                ))}
                <p>{l.costs}</p>
                <ul>
                  {l.pitfalls.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
                <a
                  href={libraryURL(language, l.topic, true)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open the full lesson ↗
                </a>
              </details>
            ))}
            {!rows.length && <p>No matching API in this language.</p>}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
