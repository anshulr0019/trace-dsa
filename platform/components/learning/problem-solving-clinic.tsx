"use client";
import { useEffect, useState } from "react";
import type { Problem } from "@/lib/curriculum/catalog";
import { patterns } from "@/lib/curriculum/catalog";
import { patternUnits } from "@/lib/learning/dsa-course-content";
import { lessons, examplesFor } from "@/lib/curriculum/learning";
import { CourseSources } from "./course-study";
import "./course-content.css";
export function ProblemSolvingClinic({ problem: p }: { problem: Problem }) {
  const unit = patternUnits[p.group - 1],
    guide = lessons[p.id],
    examples = examplesFor(p),
    [section, setSection] = useState("approach"),
    [notes, setNotes] = useState(""),
    [ready, setReady] = useState(false),
    [show, setShow] = useState(false);
  const key = `trace:solving-plan:${p.id}`;
  useEffect(() => {
    try {
      setNotes((localStorage.getItem(key) ?? "").slice(0, 6000));
    } catch {}
    setReady(true);
  }, [key]);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem(key, notes);
      } catch {}
  }, [key, notes, ready]);
  return (
    <details className="course-clinic">
      <summary>Problem-solving workshop · {patterns[p.group - 1]}</summary>
      <div className="course-study">
        <header>
          <small>FROM A WORKING IDEA TO A JUSTIFIED SOLUTION</small>
          <h2>{p.title}</h2>
          <p>{p.goal}</p>
        </header>
        <nav aria-label="Problem-solving sections">
          {[
            ["approach", "Choose an approach"],
            ["proof", "Justify it"],
            ["practice", "Build a test plan"],
          ].map(([id, label]) => (
            <button
              key={id}
              aria-pressed={section === id}
              onClick={() => setSection(id)}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="course-study-body">
          {section === "approach" && (
            <>
              <h3>Recognize the structure</h3>
              <p>{unit.recognize}</p>
              <div className="course-approaches">
                <article>
                  <small>START WITH A BASELINE</small>
                  <p>{unit.baseline}</p>
                </article>
                <article>
                  <small>REUSE STRUCTURE</small>
                  <p>{unit.improvement}</p>
                </article>
              </div>
              <h3>Apply it to this problem</h3>
              <p>{guide.idea}</p>
              <ol>
                {guide.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </>
          )}
          {section === "proof" && (
            <>
              <h3>The proof you need</h3>
              <p>{unit.proof}</p>
              <h3>For this solution</h3>
              <p>{guide.why}</p>
              <h3>Time and extra memory</h3>
              <p>{guide.cost}</p>
              <aside>
                <strong>Check the assumptions</strong>
                <p>{unit.pitfall}</p>
                <p>{p.caveat}</p>
              </aside>
            </>
          )}
          {section === "practice" && (
            <>
              <h3>Challenge your reasoning</h3>
              <p>{unit.challenge}</p>
              <ol>
                <li>State the input contract and what the answer means.</li>
                <li>
                  Dry-run a small example by hand; track the state named in the
                  solution.
                </li>
                <li>
                  Choose a boundary or adversarial case and predict the output.
                </li>
                <li>
                  Compare recorded work with the claimed complexity, accounting
                  for input/output conversion separately.
                </li>
              </ol>
              <label className="course-response">
                Your solution and test plan
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={6}
                  maxLength={6000}
                  placeholder="Baseline → improvement → invariant → complexity → normal and boundary tests"
                />
              </label>
              <small>
                Your plan is saved on this browser when storage is available.
              </small>
              <button
                className="course-action"
                aria-expanded={show}
                onClick={() => setShow(!show)}
              >
                {show
                  ? "Hide case checklist"
                  : "Review the supplied case checklist"}
              </button>
              {show && (
                <ul>
                  {examples.map((e) => (
                    <li key={e.label}>
                      <strong>{e.label}</strong>
                      <p>
                        Input: <code>{JSON.stringify(e.input)}</code>
                      </p>
                      <p>
                        Expected: <code>{JSON.stringify(e.expected)}</code>
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
        <CourseSources track="dsa" />
      </div>
    </details>
  );
}
