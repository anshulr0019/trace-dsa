import {
  bindings,
  identity,
  readSubmission,
  remoteExecute,
  sameOrigin,
} from "../../../server/hosted";
import { handlePractice } from "../../../server/practice";
import { listAttempts, saveAttempt, takeUsage } from "../../../server/progress";
import { problemById } from "../../../lib/curriculum/catalog";
import { practiceCases } from "../../../lib/practice/cases";
import type { Attempt, Grade } from "../../../lib/practice/types";

const json = (value: unknown, status = 200) =>
  Response.json(value, { status, headers: { "Cache-Control": "no-store" } });
export async function GET(request: Request) {
  const b = bindings(),
    user = await identity(),
    id = new URL(request.url).searchParams.get("problemId");
  try {
    return json({
      execution: !!(
        user &&
        b.DB &&
        b.TRACE_EXECUTION_URL &&
        b.TRACE_EXECUTION_TOKEN
      ),
      ai: !!(user && b.DB && b.OPENAI_API_KEY && b.TRACE_AI_MODEL),
      progress: b.DB && user ? "account" : "device",
      signedIn: !!user,
      ...(id && user && b.DB && Object.hasOwn(problemById, id)
        ? { attempts: await listAttempts(b.DB, user.userId, id) }
        : {}),
    });
  } catch {
    return json(
      {
        error:
          "Saved progress is temporarily unavailable. Your browser draft is safe.",
      },
      503,
    );
  }
}
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return json({ error: "Same-origin JSON required." }, 403);
  const user = await identity();
  if (!user)
    return json(
      { error: "Sign in to save and check your practice attempts." },
      401,
    );
  const b = bindings();
  if (!b.DB)
    return json({ error: "Practice storage is not connected yet." }, 503);
  try {
    const payload = await readSubmission(request);
    await takeUsage(b.DB, user.userId, "execution");
    if (b.OPENAI_API_KEY && ["review", "optimize"].includes(payload.action))
      await takeUsage(b.DB, user.userId, "ai");
    const result = await handlePractice(
      payload,
      remoteExecute,
      { apiKey: b.OPENAI_API_KEY, model: b.TRACE_AI_MODEL },
      request.signal,
    );
    if (["grade", "predict"].includes(payload.action)) {
      const isPrediction = payload.action === "predict",
        g = result as Grade;
      const predicted = result as { passed: boolean };
      const level = isPrediction
        ? "guided"
        : payload.level === "challenge"
          ? "challenge"
          : "independent";
      const caseId = practiceCases(problemById[payload.problemId]).find(
        (c) => c.id === payload.caseId,
      )?.id;
      if (!caseId) throw Error("Choose a valid practice case.");
      const a: Attempt = {
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        level,
        caseId,
        language: payload.language,
        score: isPrediction ? (predicted.passed ? 100 : 0) : g.score,
        passed: isPrediction ? (predicted.passed ? 1 : 0) : g.passed,
        total: isPrediction ? 1 : g.total,
        assisted: !!payload.assisted,
        explanation: String(payload.explanation ?? "").slice(0, 4000),
      };
      try {
        await saveAttempt(b.DB, user.userId, payload.problemId, a);
      } catch {
        return json({
          ...result,
          persistenceWarning:
            "Your check completed, but progress could not be saved to your account. This attempt is kept in this browser.",
        });
      }
      return json({ ...result, attempt: a });
    }
    return json(result);
  } catch (e) {
    return json(
      {
        error:
          e instanceof Error
            ? e.message
            : "Practice check failed. Your draft is safe.",
      },
      400,
    );
  }
}
