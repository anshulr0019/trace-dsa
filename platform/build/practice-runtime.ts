import { loadEnv, type Plugin } from "vite";
import { execute } from "./local-runtime";
import { handlePractice } from "../server/practice";

export function practiceRuntime(): Plugin {
  let active = 0,
    aiTimes: number[] = [];
  return {
    name: "trace-practice",
    configureServer(server) {
      const settings = {
        ...loadEnv(server.config.mode, server.config.root, ""),
        ...process.env,
      };
      const ai = {
        apiKey: settings.OPENAI_API_KEY,
        model: settings.TRACE_AI_MODEL,
      };
      server.middlewares.use("/api/practice", async (req, res) => {
        const reply = (status: number, value: unknown) => {
          if (res.destroyed) return;
          res.statusCode = status;
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Cache-Control", "no-store");
          res.end(JSON.stringify(value));
        };
        const host = req.headers.host ?? "",
          remote = req.socket.remoteAddress;
        if (
          !/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host) ||
          !["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(remote ?? "")
        )
          return reply(403, { error: "Local access only." });
        if (req.method === "GET")
          return reply(200, {
            execution: process.platform === "darwin",
            ai: !!(ai.apiKey && ai.model),
            progress: "device",
          });
        if (req.method !== "POST")
          return reply(405, { error: "POST required." });
        if (
          req.headers.origin !== `http://${host}` ||
          req.headers["content-type"] !== "application/json"
        )
          return reply(403, { error: "Same-origin JSON requests required." });
        if (active >= 2)
          return reply(429, {
            error:
              "Two practice checks are already running. Try again shortly.",
          });
        const controller = new AbortController(),
          cancel = () => {
            if (!res.writableEnded) controller.abort();
          };
        res.on("close", cancel);
        active++;
        try {
          let body = "";
          for await (const chunk of req) {
            body += chunk;
            if (body.length > 80000)
              throw Error("This submission is too large.");
          }
          const payload = JSON.parse(body);
          if (ai.apiKey && ["review", "optimize"].includes(payload.action)) {
            aiTimes = aiTimes.filter((t) => Date.now() - t < 3600000);
            if (aiTimes.length >= 12)
              return reply(429, {
                error:
                  "The hourly AI review limit has been reached. Test ratings and hints are still available.",
              });
            aiTimes.push(Date.now());
          }
          reply(
            200,
            await handlePractice(payload, execute, ai, controller.signal),
          );
        } catch (e) {
          reply(400, {
            error: controller.signal.aborted
              ? "Cancelled."
              : e instanceof Error
                ? e.message
                : "Practice check failed.",
          });
        } finally {
          active--;
          res.removeListener("close", cancel);
        }
      });
    },
  };
}
