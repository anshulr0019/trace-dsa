import {
  bindings,
  identity,
  readSubmission,
  remoteExecute,
  sameOrigin,
} from "../../../server/hosted";
import { takeUsage } from "../../../server/progress";

const json = (value: unknown, status = 200) =>
  Response.json(value, { status, headers: { "Cache-Control": "no-store" } });
export async function GET() {
  const b = bindings(),
    user = await identity();
  return json({
    local: false,
    available: !!(
      user &&
      b.DB &&
      b.TRACE_EXECUTION_URL &&
      b.TRACE_EXECUTION_TOKEN
    ),
    languages: ["python", "cpp", "javascript"],
  });
}
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return json({ error: "Same-origin JSON required." }, 403);
  const user = await identity();
  if (!user) return json({ error: "Sign in to run code." }, 401);
  const b = bindings();
  if (!b.DB)
    return json({ error: "Hosted execution is not connected yet." }, 503);
  try {
    await takeUsage(b.DB, user.userId, "execution");
    return json(
      await remoteExecute(await readSubmission(request), request.signal),
    );
  } catch (e) {
    return json(
      { error: e instanceof Error ? e.message : "Code execution failed." },
      400,
    );
  }
}
