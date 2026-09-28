import { copyFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
const target = new URL("../public/browser-runtime/", import.meta.url);
await mkdir(target, { recursive: true });
await Promise.all([
  "pyodide.mjs", "pyodide.asm.js", "pyodide.asm.wasm",
  "python_stdlib.zip", "pyodide-lock.json",
].map(name => copyFile(new URL(`../node_modules/pyodide/${name}`, import.meta.url), new URL(name, target))));
await build({
  entryPoints: [fileURLToPath(new URL("../lib/curriculum/browser-runtime.worker.ts", import.meta.url))],
  outfile: fileURLToPath(new URL("runner.js", target)),
  bundle: true, platform: "browser", format: "iife", target: "es2022", minify: true,
  loader: { ".py": "text" },
});
