"use client";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  Code2,
  Cpu,
  GitBranch,
  Play,
  Route,
} from "lucide-react";
import { SearchExplorer } from "./search-explorer";
import { learningTargets, RevisionRecommendations } from "./lesson-journey";
import {
  learningEvidence,
  learningStatus,
  reviewDue,
} from "@/lib/product/mastery";
import { PatternArt } from "../experience/pattern-art";
import "./launch.css";

export function LaunchHome({
  onStart,
  onDemo,
  onNavigate,
}: {
  onStart: () => void;
  onDemo: (nums: number[], target: number) => void;
  onNavigate: (view: string) => void;
}) {
  const [returning, setReturning] = useState(false),
    [overview, setOverview] = useState(false);
  const [, refresh] = useState(0);
  useEffect(() => {
    setReturning(learningTargets.some((t) => learningEvidence(t.id).length));
    const update = () => refresh((n) => n + 1);
    window.addEventListener("trace:notebook", update);
    window.addEventListener("trace:restore", update);
    return () => {
      window.removeEventListener("trace:notebook", update);
      window.removeEventListener("trace:restore", update);
    };
  }, []);
  const started = learningTargets
    .map((t) => ({ ...t, rows: learningEvidence(t.id) }))
    .filter((t) => t.rows.length)
    .sort(
      (a, b) => Date.parse(b.rows.at(-1)!.at) - Date.parse(a.rows.at(-1)!.at),
    );
  const latest = started[0];
  const practised = started.filter((t) =>
    t.rows.some((r) =>
      ["exercise", "assisted", "independent"].includes(r.kind),
    ),
  ).length;
  const independent = started.filter((t) =>
    t.rows.some((r) => r.kind === "independent"),
  ).length;
  const due = started.filter((t) => reviewDue(t.rows)).length;
  return (
    <div className="trace-home">
      {returning && !overview ? (
        <>
          <section className="home-welcome">
            <div>
              <span className="premium-eyebrow">YOUR LEARNING SPACE</span>
              <h1>Keep your curiosity moving.</h1>
              <p>A little progress, one good decision at a time.</p>
            </div>
            <button
              className="premium-text-button"
              onClick={() => setOverview(true)}
            >
              Explore Trace <ArrowUpRight size={15} />
            </button>
          </section>
          <div className="home-dashboard-grid">
            <section className="home-resume">
              <div className="premium-eyebrow">
                <span className="home-status-dot" /> PICK UP WHERE YOU LEFT OFF
              </div>
              <PatternArt kind="array" variant={1} />
              <h2>{latest?.title ?? "Binary search"}</h2>
              <p>
                {latest
                  ? learningStatus(latest.rows) === "Practised"
                    ? "You have practised the idea. Follow the code, then try a fresh case with less support."
                    : "Your next step is waiting. Revisit the idea and explain why the next move works."
                  : "Start with one decision and build from there."}
              </p>
              {latest ? (
                <a className="premium-button" href={latest.url}>
                  Continue learning <ArrowRight size={16} />
                </a>
              ) : (
                <button className="premium-button" onClick={onStart}>
                  Start learning <ArrowRight size={16} />
                </button>
              )}
            </section>
            <section className="home-progress-card">
              <div className="premium-eyebrow">
                YOUR PROGRESS, WITH EVIDENCE
              </div>
              <div className="home-progress-stats">
                {[
                  ["Explored", started.length],
                  ["Practised", practised],
                  ["Solved independently", independent],
                  ["Due for revision", due],
                ].map(([label, value]) => (
                  <div key={label}>
                    <strong>{value}</strong>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
              <button
                className="premium-text-button"
                onClick={() => onNavigate("progress")}
              >
                See your learning history <ArrowRight size={15} />
              </button>
              <p>
                Saved on this device. Independent solves come from passing fresh
                practice tasks.
              </p>
            </section>
          </div>
          <RevisionRecommendations />
          {!!started.length && (
            <section className="home-recent">
              <div className="premium-section-title">
                <h2>Recently explored</h2>
                <button
                  className="premium-text-button"
                  onClick={() => onNavigate("notebook")}
                >
                  Open notebook <ArrowUpRight size={14} />
                </button>
              </div>
              <div>
                {started.slice(0, 3).map((t) => (
                  <a key={t.id} href={t.url}>
                    <BookOpen size={18} />
                    <div>
                      <strong>{t.title}</strong>
                      <span>
                        {reviewDue(t.rows)
                          ? "Due for revision"
                          : learningStatus(t.rows)}
                      </span>
                    </div>
                    <ArrowRight size={16} />
                  </a>
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <>
          <section className="premium-hero">
            <div className="premium-hero-copy">
              <div className="premium-eyebrow">
                <span className="home-status-dot" /> A LEARNING STUDIO FOR
                CURIOUS MINDS
              </div>
              <h1>
                Don't just read the code.
                <br />
                <em>Get a feel for it.</em>
              </h1>
              <p>
                Move the pointers. Question the next step. See algorithms and
                computer science become something you can understand.
              </p>
              <div className="premium-hero-actions">
                <button className="premium-button" onClick={onStart}>
                  Enter the learning studio <ArrowRight size={17} />
                </button>
                <a className="premium-text-button" href="#try-trace">
                  Try it first <Play size={13} />
                </a>
              </div>
              <div className="premium-hero-note">
                <Check size={13} /> Start freely. No account needed.
              </div>
              <div className="premium-language-list">
                <span>THINK IN YOUR LANGUAGE</span>
                <div>
                  Python <i /> C++ <i /> Java <i /> JavaScript
                </div>
              </div>
            </div>
            <div id="try-trace" className="premium-hero-demo journey-anchor">
              <div className="hero-demo-caption">
                <span>01 / A LITTLE HANDS-ON UNDERSTANDING</span>
                <span>YOUR TURN ↙</span>
              </div>
              <SearchExplorer compact onLesson={onDemo} />
            </div>
          </section>
          <div className="premium-proof-strip">
            <span>
              <b>100</b> algorithm problems
            </span>
            <span>
              <b>25</b> patterns to recognize
            </span>
            <span>
              <b>4</b> programming languages
            </span>
            <span>
              <GitBranch size={17} /> Every move, explained
            </span>
          </div>
          <section className="premium-learning-loop">
            <div>
              <span className="premium-eyebrow">
                UNDERSTANDING HAS A RHYTHM
              </span>
              <h2>
                From “what happened?”
                <br />
                to “I know why.”
              </h2>
            </div>
            <div className="premium-loop-steps">
              {[
                {
                  title: "See it",
                  text: "Follow the code and state together.",
                  Icon: Play,
                },
                {
                  title: "Move it",
                  text: "Change an input. Make a prediction.",
                  Icon: Route,
                },
                {
                  title: "Own it",
                  text: "Solve a fresh case and explain it.",
                  Icon: Check,
                },
              ].map(({ title, text, Icon }, i) => (
                <div key={title}>
                  <span>0{i + 1}</span>
                  <Icon size={19} />
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
      <section id="explore-trace" className="premium-tracks">
        <div className="premium-section-title">
          <div>
            <span className="premium-eyebrow">
              A PLACE TO FOLLOW YOUR CURIOSITY
            </span>
            <h2>
              {returning && !overview
                ? "Where will you go next?"
                : "Small experiments. Bigger understanding."}
            </h2>
          </div>
          <button
            className="premium-text-button"
            onClick={() => onNavigate("curriculum")}
          >
            Explore the roadmap <ArrowUpRight size={15} />
          </button>
        </div>
        <div className="premium-track-grid">
          {[
            {
              title: "Algorithms, in motion",
              description:
                "Build intuition for arrays, trees, graphs, and the patterns hiding inside problems.",
              kind: "array" as const,
              Icon: Code2,
              view: "curriculum",
              label: "100 PROBLEMS · 25 PATTERNS",
              link: "Find your next pattern",
            },
            {
              title: "Inside the system",
              description:
                "Follow a request. Query a database. Explore how networks and operating systems behave.",
              kind: "systems" as const,
              Icon: Cpu,
              view: "cs",
              label: "SYSTEMS · SQL · NETWORKS · MORE",
              link: "Open the visual labs",
            },
            {
              title: "Build your foundations",
              description:
                "Six guided lessons that connect the idea, the execution, and your own reasoning.",
              kind: "tree" as const,
              Icon: BookOpen,
              view: "library",
              label: "6 LESSONS · ONE CLEAR PATH",
              link: "Start with the essentials",
            },
          ].map(({ title, description, kind, Icon, view, label, link }, i) => (
            <button
              className="premium-track"
              key={view}
              onClick={() => onNavigate(view)}
            >
              <div className="premium-track-top">
                <Icon size={18} />
                <span>0{i + 1}</span>
              </div>
              <PatternArt kind={kind} variant={i} />
              <small>{label}</small>
              <h3>{title}</h3>
              <p>{description}</p>
              <span className="premium-track-link">
                {link}
                <ArrowRight size={15} />
              </span>
            </button>
          ))}
        </div>
      </section>
      <section className="premium-teaching">
        <div>
          <span className="premium-eyebrow">
            UNDERSTANDING IS BETTER SHARED
          </span>
          <h2>Bring the next “aha” to your classroom.</h2>
          <p>
            Create a lesson, share a replay, and help learners explain their
            next move.
          </p>
        </div>
        <button
          className="premium-button premium-button-secondary"
          onClick={() => onNavigate("teacher")}
        >
          Teach with Trace <ArrowUpRight size={16} />
        </button>
      </section>
      <LaunchSupport />
    </div>
  );
}
export function LaunchSupport() {
  const report = () => {
    const clean = new URL(location.origin + location.pathname);
    const current = new URL(location.href);
    for (const key of [
      "view",
      "problem",
      "module",
      "topic",
      "language",
      "lesson",
    ]) {
      const value = current.searchParams.get(key);
      if (value && value.length <= 100) clean.searchParams.set(key, value);
    }
    const context = `Page: ${clean.href}\nBrowser: ${navigator.userAgent}\n\nWhat happened?\n\nWhat did you expect?\n\nSteps to reproduce:\n`;
    window.open(
      `https://github.com/anshulr0019/trace-dsa/issues/new?title=${encodeURIComponent("Trace feedback")}&body=${encodeURIComponent(context)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };
  return (
    <footer className="launch-support">
      <div className="launch-actions">
        <button onClick={report}>
          Report an issue or suggest an improvement ↗
        </button>
        <a
          href="https://github.com/anshulr0019/trace-dsa"
          target="_blank"
          rel="noreferrer"
        >
          Project & updates ↗
        </a>
        <a href="/?view=notebook">Your saved work & backups →</a>
      </div>
      <details>
        <summary>How your work is stored</summary>
        <p>
          Code, notes, answers and learning activity are saved in this browser.
          Export your notebook before switching devices or clearing browser
          data. If account services are configured and you sign in, you can
          choose to sync your notebook. Runtime health sharing is optional in
          account settings. Java may download its runtime from CheerpJ; the SQL
          lab loads a pinned SQLite package from the Pyodide CDN. Opening a
          GitHub feedback form shares only what you choose to submit.
        </p>
      </details>
    </footer>
  );
}
