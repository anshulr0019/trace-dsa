import { copyFile, cp, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
const target = new URL("../public/browser-runtime/", import.meta.url);
await mkdir(target, { recursive: true });
await mkdir(new URL("clang/", target), { recursive: true });
await Promise.all([
  "pyodide.mjs", "pyodide.asm.js", "pyodide.asm.wasm",
  "python_stdlib.zip", "pyodide-lock.json",
].map(name => copyFile(new URL(`../node_modules/pyodide/${name}`, import.meta.url), new URL(name, target))));
await Promise.all([
  cp(new URL("../node_modules/@live-codes/clang-wasm/assets/bin/", import.meta.url), new URL("clang/bin/", target), { recursive: true }),
  copyFile(new URL("../node_modules/@live-codes/clang-wasm/assets/runtime-manifest.v1.json", import.meta.url), new URL("clang/runtime-manifest.v1.json", target)),
  copyFile(new URL("../node_modules/@live-codes/clang-wasm/LICENSE", import.meta.url), new URL("clang/LICENSE", target)),
  copyFile(new URL("../node_modules/@live-codes/clang-wasm/THIRD-PARTY-NOTICES.md", import.meta.url), new URL("clang/THIRD-PARTY-NOTICES.md", target)),
  copyFile(new URL("../runtime/vendor/json.hpp", import.meta.url), new URL("json.hpp", target)),
  copyFile(new URL("../runtime/trace.hpp", import.meta.url), new URL("trace.hpp", target)),
]);
await build({
  entryPoints: [fileURLToPath(new URL("../lib/curriculum/browser-runtime.worker.ts", import.meta.url))],
  outfile: fileURLToPath(new URL("runner.js", target)),
  bundle: true, platform: "browser", format: "iife", target: "es2022", minify: true,
  loader: { ".py": "text" },
});
