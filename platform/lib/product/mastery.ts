export type Evidence = {
  kind: "watched" | "exercise" | "assisted" | "independent" | "self-review";
  at: string;
  detail: string;
};
export function learningEvidence(id: string): Evidence[] {
  try {
    const rows = JSON.parse(
      localStorage.getItem(`trace:mastery:${id}`) ?? "[]",
    );
    return Array.isArray(rows)
      ? rows
          .filter(
            (v) =>
              v &&
              [
                "watched",
                "exercise",
                "assisted",
                "independent",
                "self-review",
              ].includes(v.kind) &&
              typeof v.at === "string" &&
              Number.isFinite(Date.parse(v.at)) &&
              typeof v.detail === "string",
          )
          .slice(-40)
      : [];
  } catch {
    return [];
  }
}
export function recordLearning(
  id: string,
  kind: Evidence["kind"],
  detail: string,
) {
  const rows = learningEvidence(id);
  // Coalesce repeated playback events during one visit.
  if (
    kind === "watched" &&
    rows.at(-1)?.kind === kind &&
    Date.now() - Date.parse(rows.at(-1)!.at) < 60000
  )
    return;
  try {
    localStorage.setItem(
      `trace:mastery:${id}`,
      JSON.stringify(
        [
          ...rows,
          { kind, detail: detail.slice(0, 200), at: new Date().toISOString() },
        ].slice(-40),
      ),
    );
    window.dispatchEvent(new Event("trace:notebook"));
  } catch {
    /* The running lesson remains usable without storage. */
  }
}
export function learningStatus(rows: Evidence[]) {
  if (rows.some((r) => r.kind === "independent")) return "Solved independently";
  if (rows.some((r) => ["assisted", "exercise"].includes(r.kind)))
    return "Practised";
  if (rows.some((r) => r.kind === "self-review")) return "Explored";
  if (rows.some((r) => r.kind === "watched")) return "Explored";
  return "Not started";
}
export function reviewDue(rows: Evidence[], now = Date.now()) {
  if (!rows.length) return false;
  const solved = rows.filter(
    (r) => r.kind === "independent" || r.kind === "assisted",
  );
  const latest = solved.at(-1) ?? rows.at(-1)!;
  const days = latest.kind === "independent" ? 7 : 2;
  return now - Date.parse(latest.at) >= days * 86400000;
}

/** Keep earlier review marks when moving to evidence-based progress. */
export function importEarlierProgress() {
  try {
    const marks: { id: string; kind: Evidence["kind"]; detail: string }[] = [];
    const add = (
      ids: unknown,
      prefix: string,
      kind: Evidence["kind"],
      detail: string,
    ) => {
      if (Array.isArray(ids))
        for (const id of ids) {
          if (typeof id === "string" && /^[a-z0-9-]{1,80}$/.test(id))
            marks.push({ id: prefix + id, kind, detail });
        }
    };
    add(
      JSON.parse(localStorage.getItem("trace:curriculum:complete") ?? "[]"),
      "",
      "self-review",
      "Earlier understanding mark imported as self-review",
    );
    add(
      JSON.parse(localStorage.getItem("trace-progress-v1") ?? "{}")?.mastered,
      "foundation:",
      "assisted",
      "Earlier completed foundation quiz imported",
    );
    add(
      JSON.parse(localStorage.getItem("trace-computer-science-v1") ?? "{}")
        ?.completed,
      "cs:",
      "self-review",
      "Earlier lesson review imported",
    );
    let changed = false;
    for (const mark of marks) {
      if (learningEvidence(mark.id).length) continue;
      localStorage.setItem(
        `trace:mastery:${mark.id}`,
        JSON.stringify([
          {
            kind: mark.kind,
            detail: mark.detail,
            at: new Date().toISOString(),
          },
        ]),
      );
      changed = true;
    }
    // Older successful code attempts are evidence too, even if the lesson
    // already has newer playback activity. Retain their original review date.
    const attemptKeys = Array.from({ length: localStorage.length }, (_, i) =>
      localStorage.key(i),
    ).filter(
      (key): key is string =>
        !!key && /^trace:practice:attempts:[a-z0-9-]{1,80}$/.test(key),
    );
    for (const key of attemptKeys) {
      let attempts: unknown;
      try {
        attempts = JSON.parse(localStorage.getItem(key) ?? "[]");
      } catch {
        continue;
      }
      if (!Array.isArray(attempts)) continue;
      const id = key.slice("trace:practice:attempts:".length);
      const rows = learningEvidence(id);
      for (const a of attempts) {
        if (
          !a ||
          !["independent", "challenge"].includes(a.level) ||
          !Number.isInteger(a.total) ||
          a.total <= 0 ||
          a.passed !== a.total ||
          typeof a.assisted !== "boolean" ||
          typeof a.at !== "string" ||
          !Number.isFinite(Date.parse(a.at))
        )
          continue;
        const kind = a.assisted ? "assisted" : "independent";
        if (
          rows.some(
            (r) => r.kind === kind && Date.parse(r.at) >= Date.parse(a.at),
          )
        )
          continue;
        rows.push({
          kind,
          at: a.at,
          detail: `${a.passed}/${a.total} earlier practice cases passed`,
        });
        changed = true;
      }
      rows.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
      if (rows.length)
        localStorage.setItem(
          `trace:mastery:${id}`,
          JSON.stringify(rows.slice(-40)),
        );
    }
    if (changed) window.dispatchEvent(new Event("trace:notebook"));
  } catch {
    /* Existing data remains untouched if storage is unavailable. */
  }
}
