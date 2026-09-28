import type { Attempt } from "../lib/practice/types";

// Every operation requires the authenticated server-provided user ID.
export async function listAttempts(
  db: D1Database,
  userId: string,
  problemId: string,
): Promise<Attempt[]> {
  const r = await db
    .prepare(
      "SELECT id, at, level, case_id AS caseId, language, score, passed, total, assisted, explanation FROM practice_attempts WHERE user_id = ? AND problem_id = ? ORDER BY at DESC LIMIT 100",
    )
    .bind(userId, problemId)
    .all<Attempt>();
  return r.results.reverse().map((a) => ({ ...a, assisted: !!a.assisted }));
}
export async function saveAttempt(
  db: D1Database,
  userId: string,
  problemId: string,
  a: Attempt,
) {
  await db
    .prepare(
      "INSERT INTO practice_attempts (id,user_id,problem_id,at,level,case_id,language,score,passed,total,assisted,explanation) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
    )
    .bind(
      a.id,
      userId,
      problemId,
      a.at,
      a.level,
      a.caseId,
      a.language,
      a.score,
      a.passed,
      a.total,
      a.assisted ? 1 : 0,
      a.explanation,
    )
    .run();
}
export async function takeUsage(
  db: D1Database,
  userId: string,
  kind: "execution" | "ai",
) {
  const bucket = `${kind}:${Math.floor(Date.now() / (kind === "ai" ? 3600000 : 60000))}`;
  const limit = kind === "ai" ? 12 : 12;
  const row = await db
    .prepare(
      "INSERT INTO practice_usage (user_id,bucket,used) VALUES (?,?,1) ON CONFLICT(user_id,bucket) DO UPDATE SET used=used+1 WHERE used < ? RETURNING used",
    )
    .bind(userId, bucket, limit)
    .first();
  if (!row)
    throw Error(
      kind === "ai"
        ? "Your hourly AI review limit has been reached."
        : "Too many code checks. Please wait a minute and try again.",
    );
}
