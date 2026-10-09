export type Evidence = {
  kind: "watched" | "assisted" | "independent" | "self-review";
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
              ["watched", "assisted", "independent", "self-review"].includes(
                v.kind,
              ) &&
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
  if (rows.some((r) => r.kind === "assisted")) return "Solved with support";
  if (rows.some((r) => r.kind === "self-review")) return "Self-reviewed";
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
