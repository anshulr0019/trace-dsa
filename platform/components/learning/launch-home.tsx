"use client";
import { HandsOn } from "./hands-on";
import { RevisionRecommendations } from "./lesson-journey";
import "./launch.css";
export function LaunchHome() {
  return (
    <>
      <section className="launch-hero">
        <small>TRACE · LEARN THROUGH THE NEXT MOVE</small>
        <h1>See it move. Understand why. Solve it yourself.</h1>
        <p>
          Explore 100 algorithm problems in Python, Java, C++ and JavaScript,
          then connect the ideas through visual labs in systems, databases,
          operating systems, networks and OOP.
        </p>
        <div className="launch-actions">
          <a href="/?view=curriculum">Start learning →</a>
          <a href="/?view=teacher">Teach with Trace →</a>
          <a href="#try-trace">Try a 2-minute example ↓</a>
        </div>
        <p style={{ fontSize: 13 }}>
          Start without an account. Browser saves and notebook exports are
          available; account sync depends on workspace setup.
        </p>
      </section>
      <RevisionRecommendations />
      <section id="try-trace" className="launch-demo journey-anchor">
        <HandsOn />
        <div>
          <small>YOUR FIRST LEARNING LOOP</small>
          <h2>Make the decision before the code does.</h2>
          <p>
            Compare the midpoint, choose a half, and watch the search interval
            shrink. Then open the full lesson to follow code and state together.
          </p>
          <div className="launch-actions">
            <a href="/?view=curriculum&problem=binary-search-standard">
              Open the binary search lesson →
            </a>
          </div>
        </div>
      </section>
      <div className="launch-benefits">
        <article className="launch-card">
          <small>LEARNER</small>
          <h3>A clear next step.</h3>
          <p>
            Understand the idea, watch execution, manipulate a small example,
            solve a fresh case, and review the evidence.
          </p>
        </article>
        <article className="launch-card">
          <small>BUILDER</small>
          <h3>Explore real mechanisms.</h3>
          <p>
            Run SQLite queries against a sample database and change inputs in
            executable system and network models.
          </p>
          <a href="/?view=cs">Explore practical tracks →</a>
        </article>
        <article className="launch-card">
          <small>TEACHER</small>
          <h3>Teach the reasoning.</h3>
          <p>
            Create a shareable lesson with your input, collect student
            reflections, and review submissions in your class workspace.
          </p>
          <a href="/?view=teacher">Open the teaching workspace →</a>
        </article>
      </div>
      <LaunchSupport />
    </>
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
