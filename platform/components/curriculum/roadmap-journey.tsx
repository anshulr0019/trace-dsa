"use client";
import { ArrowRight, Check, Circle, Flag, Route } from "lucide-react";
import {
  problems,
  patterns,
  tiers,
  type Problem,
} from "@/lib/curriculum/catalog";
import {
  learningEvidence,
  learningStatus,
  reviewDue,
} from "@/lib/product/mastery";
import { PatternArt } from "../experience/pattern-art";
import "./roadmap-journey.css";

export function roadmapStatus(p: Problem) {
  const evidence = learningEvidence(p.id);
  return reviewDue(evidence) ? "Due for revision" : learningStatus(evidence);
}

export function NextPattern({ onSelect }: { onSelect: (id: string) => void }) {
  const recent = problems
    .map((p) => ({ p, rows: learningEvidence(p.id) }))
    .filter((v) => v.rows.length)
    .sort(
      (a, b) => Date.parse(b.rows.at(-1)!.at) - Date.parse(a.rows.at(-1)!.at),
    );
  const due = recent.find((v) => reviewDue(v.rows));
  const unfinished = recent.find(
    (v) => !v.rows.some((e) => e.kind === "independent"),
  );
  const next =
    due?.p ??
    unfinished?.p ??
    problems.find(
      (p) => !learningEvidence(p.id).some((e) => e.kind === "independent"),
    );
  if (!next)
    return (
      <div className="roadmap-next">
        <div className="roadmap-next-symbol">
          <Check size={23} />
        </div>
        <div>
          <span className="premium-eyebrow">A COMPLETE JOURNEY</span>
          <h2>All 100 problems solved independently.</h2>
          <p>Use the revision filter to keep those patterns fresh.</p>
        </div>
      </div>
    );
  const reason = due
    ? "Your recorded activity makes this pattern due for revision. Try a fresh case to revisit the reasoning."
    : unfinished
      ? "You have explored this problem. Continue the lesson, then solve a fresh case with less support."
      : recent.length
        ? "Your next unsolved problem in the roadmap. Build on the patterns you have already explored."
        : "Begin with one fixed-size window. See what enters, what leaves, and why the answer stays correct.";
  return (
    <section className="roadmap-next" aria-label="Recommended next lesson">
      <div className="roadmap-next-symbol">
        <Route size={23} />
      </div>
      <div>
        <span className="premium-eyebrow">
          {due
            ? "TIME TO REVISIT"
            : unfinished
              ? "PICK UP YOUR NEXT MOVE"
              : "YOUR NEXT PATTERN"}{" "}
          · {patterns[next.group - 1].toUpperCase()}
        </span>
        <h2>{next.title}</h2>
        <p>{reason}</p>
      </div>
      <button className="premium-button" onClick={() => onSelect(next.id)}>
        {due
          ? "Revise this pattern"
          : unfinished
            ? "Continue here"
            : "Start here"}
        <ArrowRight size={16} />
      </button>
    </section>
  );
}

export function RoadmapMilestones({
  tier,
  onTier,
}: {
  tier: number;
  onTier: (tier: number) => void;
}) {
  return (
    <nav className="roadmap-milestones" aria-label="Learning milestones">
      {tiers.map((name, i) => {
        const group = problems.filter((p) => p.tier === i + 1);
        const complete = group.filter((p) =>
          learningEvidence(p.id).some((e) => e.kind === "independent"),
        ).length;
        return (
          <button
            key={name}
            aria-pressed={tier === i + 1}
            onClick={() => onTier(tier === i + 1 ? 0 : i + 1)}
          >
            <span className="milestone-number">
              {complete === group.length ? <Check size={13} /> : `0${i + 1}`}
            </span>
            <span>
              <strong>{name}</strong>
              <small>
                {complete} / {group.length} solved independently
              </small>
              <span className="milestone-track">
                <i style={{ width: `${(complete / group.length) * 100}%` }} />
              </span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export function RoadmapJourney({
  filtered,
  onSelect,
}: {
  filtered: Problem[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="roadmap-journey">
      {tiers.map((name, i) => {
        const tierItems = filtered.filter((p) => p.tier === i + 1);
        if (!tierItems.length) return null;
        return (
          <section className="journey-tier" key={name}>
            <div className="journey-tier-title">
              <span>0{i + 1}</span>
              <div>
                <span className="premium-eyebrow">MILESTONE {i + 1}</span>
                <h2>{name}</h2>
              </div>
              <Flag size={18} />
            </div>
            <div className="journey-pattern-grid">
              {patterns.map((pattern, g) => {
                const items = tierItems.filter((p) => p.group === g + 1);
                if (!items.length) return null;
                const all = problems.filter((p) => p.group === g + 1);
                const solved = all.filter((p) =>
                  learningEvidence(p.id).some((e) => e.kind === "independent"),
                ).length;
                const next =
                  items.find(
                    (p) =>
                      !learningEvidence(p.id).some(
                        (e) => e.kind === "independent",
                      ),
                  ) ?? items[0];
                return (
                  <article className="journey-pattern" key={pattern}>
                    <div className="journey-pattern-heading">
                      <span className="premium-eyebrow">
                        PATTERN {String(g + 1).padStart(2, "0")}
                      </span>
                      <span>{solved} / 4 solved</span>
                    </div>
                    <div className="journey-pattern-intro">
                      <div>
                        <h3>{pattern}</h3>
                        <p>{all[0].goal}</p>
                      </div>
                      <PatternArt kind={all[0].scene} variant={g} />
                    </div>
                    <div
                      className="journey-pattern-steps"
                      aria-label={`${pattern} progression`}
                    >
                      {items.map((p) => {
                        const status = roadmapStatus(p),
                          complete = status === "Solved independently";
                        return (
                          <button
                            key={p.id}
                            onClick={() => onSelect(p.id)}
                            title={`${p.title} · ${status}`}
                            aria-label={`${p.title}. ${p.stage}. ${status}`}
                          >
                            <span
                              className={
                                complete
                                  ? "is-solved"
                                  : status === "Not started"
                                    ? ""
                                    : "is-started"
                              }
                            >
                              {complete ? (
                                <Check size={12} />
                              ) : (
                                <Circle size={10} />
                              )}
                            </span>
                            <strong>{p.stage}</strong>
                            <small>{status}</small>
                          </button>
                        );
                      })}
                    </div>
                    <button
                      className="journey-pattern-start"
                      onClick={() => onSelect(next.id)}
                    >
                      <span>
                        {solved === 4 ? "Revisit the pattern" : next.title}
                      </span>
                      <ArrowRight size={15} />
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
