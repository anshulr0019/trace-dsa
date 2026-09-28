import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../app/chatgpt-auth";
import type { Executor } from "./practice";
import { validateProblemInput } from "../lib/curriculum/validate";

type Bindings = {
  DB?: D1Database;
  OPENAI_API_KEY?: string;
  TRACE_AI_MODEL?: string;
  TRACE_EXECUTION_URL?: string;
  TRACE_EXECUTION_TOKEN?: string;
};
export function bindings() {
  return env as unknown as Bindings;
}
export async function identity() {
  return getChatGPTUser();
}
export function sameOrigin(request: Request) {
  return (
    request.headers.get("origin") === new URL(request.url).origin &&
    request.headers.get("content-type")?.split(";")[0] === "application/json"
  );
}
export async function readSubmission(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw Error("A JSON submission is required.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 80000) {
      await reader.cancel();
      throw Error("This submission is too large.");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}
export const remoteExecute: Executor = async (payload, signal) => {
  const settings = bindings();
  if (!settings.TRACE_EXECUTION_URL || !settings.TRACE_EXECUTION_TOKEN)
    throw Error("Hosted code execution is not configured.");
  const url = new URL(settings.TRACE_EXECUTION_URL);
  if (url.protocol !== "https:")
    throw Error("The code execution service must use HTTPS.");
  if (
    typeof payload.code !== "string" ||
    payload.code.length > 60000 ||
    !["python", "cpp", "javascript"].includes(payload.language)
  )
    throw Error("Invalid code or language.");
  const error = validateProblemInput(payload.problemId, payload.input);
  if (error) throw Error(error);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${settings.TRACE_EXECUTION_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(35000)])
      : AbortSignal.timeout(35000),
  });
  if (!response.ok)
    throw Error("The code execution service is unavailable. Please try again.");
  const result = (await response.json()) as Awaited<ReturnType<Executor>>;
  if (!Array.isArray(result.frames) || !Object.hasOwn(result, "result"))
    throw Error("The code execution service returned an invalid response.");
  return result;
};
