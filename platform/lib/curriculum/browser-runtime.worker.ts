import * as Babel from "@babel/standalone";
import { createCompiler } from "@live-codes/clang-wasm";
import { createToolchain } from "@live-codes/clang-wasm/toolchain";
import type { NodePath, types as BabelTypes } from "@babel/core";
import { instrumentCpp } from "./instrument-cpp";
import pythonRunner from "../../runtime/python_runner.py?raw";
import pythonSupport from "../../runtime/trace_support.py?raw";
import type { Submission } from "./runtime-client";
import type { PlaybackFrame, PlaybackRun } from "./execution";

// Each run gets a disposable worker. Cancellation and deadlines terminate it,
// including infinite loops, without blocking the editor or reusing program state.
async function python(payload: Submission): Promise<PlaybackRun> {
  // Load the unmodified Emscripten runtime from our own static assets. Bundling
  // its dynamic imports breaks the loader in module workers.
  const indexURL = new URL("/browser-runtime/", self.location.origin).href;
  const runtimeURL = indexURL + "pyodide.mjs";
  const { loadPyodide } = await import(runtimeURL) as typeof import("pyodide");
  const py = await loadPyodide({ indexURL });
  py.FS.writeFile("/home/pyodide/trace_support.py", pythonSupport);
  const globals = py.toPy({ __trace_payload: JSON.stringify(payload) });
  self.postMessage({ type: "ready" });
  try { return JSON.parse(py.runPython(pythonRunner + "\nencoded_run", { globals })); }
  finally { globals.destroy(); }
}

async function cpp(payload: Submission): Promise<PlaybackRun> {
  const baseUrl = new URL("/browser-runtime/clang/", self.location.origin);
  const [jsonResponse, traceResponse] = await Promise.all([
    fetch("/browser-runtime/json.hpp"), fetch("/browser-runtime/trace.hpp"),
  ]);
  if (!jsonResponse.ok || !traceResponse.ok) throw Error("C++ support files could not be downloaded.");
  const [jsonHeader, traceHeader] = await Promise.all([jsonResponse.text(), traceResponse.text()]);
  const toolchain = await createToolchain({ baseUrl });
  let compiler: Awaited<ReturnType<typeof createCompiler>> | undefined;
  try {
    toolchain.addFile("json.hpp", jsonHeader);
    toolchain.addFile("trace.hpp", traceHeader);
    compiler = await createCompiler("cpp", {
      baseUrl, std: "gnu++17", fileName: "solution.cpp",
      compileArgs: ["-I.", "-DTRACE_BROWSER", "-DJSON_NOEXCEPTION", "-O0"],
    });
    self.postMessage({ type: "ready", timeoutMs: 30000 });
    // This WASM toolchain has no C++ exception support. The supplied examples
    // use runtime_error only for invalid input; preserve those messages.
    const source = (payload.automatic ? instrumentCpp(payload.code) : payload.code)
      .replace(/\bthrow\s+runtime_error\s*\(/g, "trace_fail(");
    const main = `\nint main(){json input;cin>>input;ostringstream captured;auto* original=cout.rdbuf(captured.rdbuf());json result=solve(input);cout.rdbuf(original);cout<<json({{"result",result},{"frames",trace_frames},{"stdout",captured.str().substr(0,16000)},{"error",nullptr},{"truncated",trace_truncated}}).dump();}`;
    const output = await compiler.run(source + main, JSON.stringify(payload.input));
    if (output.errors.length || output.exitCode !== 0) {
      const error = output.errors.join("\n") || output.stderr || `C++ program exited with code ${output.exitCode}.`;
      return { frames: [], result: null, stdout: "", truncated: false, error,
        errorLine: Number(error.match(/solution\.cpp:(\d+)/)?.[1] ?? 0) };
    }
    if (output.stdout.length > 8_000_000) throw Error("C++ output exceeded 8 MB.");
    return JSON.parse(output.stdout) as PlaybackRun;
  } finally {
    compiler?.dispose();
    toolchain.dispose();
  }
}

function javascript(payload: Submission): PlaybackRun {
  const frames: PlaybackFrame[] = [];
  let stdout = "", truncated = false, steps = 0;
  const clean = (v: unknown) => JSON.parse(JSON.stringify(v, (_, x) => x instanceof Set ? [...x] : x instanceof Map ? Object.fromEntries(x) : typeof x === "bigint" ? String(x) : typeof x === "number" && !Number.isFinite(x) ? String(x) : x));
  const trace = (vars: Record<string, unknown>, line = 0, metadata = {}) => {
    if (++steps > 30000) throw Error("Execution stopped after 30,000 steps; inspect the loop condition.");
    if (frames.length >= 1200) { truncated = true; return; }
    if (!line) line = Number(new Error().stack?.match(/solution\.js:(\d+)/)?.[1] ?? 0) - 2;
    frames.push({ line: Math.max(0, line), event: "checkpoint", function: "solve", stack: [], vars: clean(vars), ...metadata });
  };
  const autoTrace = (line: number, getters: Record<string, () => unknown>, functionName: string) => {
    const vars: Record<string, unknown> = {};
    for (const [name, get] of Object.entries(getters)) {
      try { const value = get(); if (value !== undefined && typeof value !== "function") { try { vars[name] = clean(value); } catch { vars[name] = "<cyclic or unsupported object>"; } } } catch { /* Not initialized yet. */ }
    }
    trace(vars, line, { event: "line", function: functionName });
  };
  self.postMessage({ type: "ready" });
  try {
    const code = payload.automatic ? Babel.transform(payload.code, {
      filename: "solution.js", retainLines: true,
      plugins: [function ({ types: t, template }: typeof import("@babel/core")) { return { visitor: { Statement: { exit(path: NodePath<BabelTypes.Statement>) {
        if (!path.node.loc || path.isBlockStatement() || path.isEmptyStatement() || path.isFunctionDeclaration() || path.isClassDeclaration() || path.isImportDeclaration() || path.isExportDeclaration()) return;
        if (path.parentPath.isForStatement() && ["init", "update"].includes(String(path.key))) return;
        if ((path.parentPath.isForInStatement() || path.parentPath.isForOfStatement()) && path.key === "left") return;
        if (path.parentPath.isLabeledStatement()) return;
        const names = Object.keys(path.scope.getAllBindings()).filter(k => !k.startsWith("__trace"));
        const fn = path.getFunctionParent();
        const declaration = fn?.parentPath;
        const name = fn && "id" in fn.node && fn.node.id ? fn.node.id.name : declaration?.isVariableDeclarator() && t.isIdentifier(declaration.node.id) ? declaration.node.id.name : "solve";
        const probe = template.statement.ast(`__traceAuto(${path.node.loc.start.line},{${names.map(k => `${JSON.stringify(k)}:()=>${k}`).join(",")}},${JSON.stringify(name)});`);
        if (path.inList) path.insertBefore(probe);
        else if (["body", "consequent", "alternate"].includes(String(path.key))) path.replaceWith(t.blockStatement([probe, path.node]));
      } } } }; }],
    }).code! : payload.code;
    const output = { log: (...args: unknown[]) => { stdout = (stdout + args.map(String).join(" ") + "\n").slice(0, 16000); } };
    // Only the disposable worker evaluates user JavaScript; never the UI thread.
    const solve = new Function("input", "trace", "__traceAuto", "console", code + "\n;return solve(input);\n//# sourceURL=solution.js");
    const result = clean(solve(payload.input, trace, autoTrace, output) ?? null);
    if (JSON.stringify(result).length > 1000000) throw Error("Returned answer exceeds 1 MB; use a smaller input.");
    return { frames, result, stdout, truncated, error: null };
  } catch (e) {
    return { frames, result: null, stdout, truncated, error: String(e), errorLine: Math.max(0, Number((e as Error).stack?.match(/solution\.js:(\d+)/)?.[1] ?? 2) - 2) };
  }
}

self.onmessage = async ({ data }: MessageEvent<Submission>) => {
  try {
    const run = data.language === "python" ? await python(data) : data.language === "cpp" ? await cpp(data) : javascript(data);
    self.postMessage({ type: "result", run });
  } catch (e) { self.postMessage({ type: "error", error: `Unable to load the browser runtime. Check your connection and try again. ${String(e)}` }); }
};
