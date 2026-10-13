import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
import { libraryLessons } from "../lib/languages/catalog";
import {
  libraryCases,
  expectedLibraryOutput,
  sameLibraryOutput,
} from "../lib/languages/exercises";
const root = mkdtempSync(join(tmpdir(), "trace-library-check-"));
const clean = (v: unknown) => JSON.parse(JSON.stringify(v));
let checked = 0;
function verify(lessons: typeof libraryLessons, results: unknown[]) {
  assert.equal(results.length, lessons.length * libraryCases.length);
  let index = 0;
  for (const lesson of lessons)
    for (const c of libraryCases) {
      const actual = results[index++];
      assert.ok(
        sameLibraryOutput(actual, expectedLibraryOutput(lesson.topic, c.input)),
        `${lesson.id} / ${c.name}: ${JSON.stringify(actual)}`,
      );
      checked++;
    }
  console.log(`${lessons[0].language}: ${results.length} output cases passed`);
}
try {
  const js = libraryLessons.filter((l) => l.language === "javascript");
  const jsResults = js.flatMap((l) =>
    libraryCases.map((c) =>
      new Function("data", "trace", `${l.source}\nreturn solve(data);`)(
        clean(c.input),
        () => {},
      ),
    ),
  );
  verify(js, jsResults.map(clean));
  const py = libraryLessons.filter((l) => l.language === "python");
  const pySource = py
    .map((l) =>
      l.source.replace("def solve(data):", `def solve_${l.topic}(data):`),
    )
    .join("\n");
  const pyCalls = py
    .flatMap((l) =>
      libraryCases.map(
        (c) =>
          `print(json.dumps(solve_${l.topic}(json.loads(${JSON.stringify(JSON.stringify(c.input))}))))`,
      ),
    )
    .join("\n");
  const pyOutput = execFileSync(
    "python3",
    ["-c", `import json\n${pySource}\n${pyCalls}`],
    { encoding: "utf8", timeout: 15000 },
  );
  verify(
    py,
    pyOutput
      .trim()
      .split("\n")
      .map((s) => JSON.parse(s)),
  );
  const cpp = libraryLessons.filter((l) => l.language === "cpp");
  const cppSource = cpp
    .map((l) =>
      l.source.replace(
        "json solve(json data)",
        `json solve_${l.topic}(json data)`,
      ),
    )
    .join("\n");
  const cases = JSON.stringify(libraryCases.map((c) => c.input));
  const cppCalls = cpp
    .map(
      (l) =>
        `for(const auto& data : cases) { trace_frames.clear(); trace_steps=0; cout << solve_${l.topic}(data).dump() << "\\n"; }`,
    )
    .join("\n");
  writeFileSync(
    join(root, "libraries.cpp"),
    `${cppSource}\nint main(){json cases=json::parse(R"CASES(${cases})CASES");${cppCalls}}`,
  );
  execFileSync(
    "clang++",
    [
      "-std=c++17",
      "-I",
      resolve("runtime"),
      "-I",
      resolve("runtime/vendor"),
      join(root, "libraries.cpp"),
      "-o",
      join(root, "libraries"),
    ],
    { timeout: 60000, stdio: "pipe" },
  );
  const cppOutput = execFileSync(join(root, "libraries"), [], {
    cwd: root,
    encoding: "utf8",
    timeout: 15000,
  });
  verify(
    cpp,
    cppOutput
      .trim()
      .split("\n")
      .map((s) => JSON.parse(s)),
  );
  const java = libraryLessons.filter((l) => l.language === "java");
  const jdk = process.env.TRACE_LIBRARY_JAVA_HOME;
  assert.ok(
    jdk,
    "Set TRACE_LIBRARY_JAVA_HOME to a JDK for Java compatibility verification.",
  );
  const files = java.map((l) => {
    const file = join(root, `Library_${l.topic}.java`);
    writeFileSync(
      file,
      l.source.replace(
        "public class Solution",
        "public class Library_" + l.topic,
      ),
    );
    return file;
  });
  const javaCalls = java
    .map(
      (l) =>
        `for(Object data : cases) { Trace.frames.clear(); Trace.steps=0; Trace.frameBytes=0; System.out.println(Trace.json(new Library_${l.topic}().solve((Map<String,Object>)data))); }`,
    )
    .join("\n");
  writeFileSync(
    join(root, "LibraryCheck.java"),
    `import java.util.*; public class LibraryCheck { @SuppressWarnings("unchecked") public static void main(String[] args) { List<Object> cases=(List<Object>)Trace.parse(${JSON.stringify(cases)}); ${javaCalls} } }`,
  );
  execFileSync(
    join(jdk!, "bin/javac"),
    [
      "--release",
      "8",
      "-d",
      root,
      resolve("runtime/java/Trace.java"),
      ...files,
      join(root, "LibraryCheck.java"),
    ],
    { timeout: 60000, stdio: "pipe" },
  );
  const javaOutput = execFileSync(
    join(jdk!, "bin/java"),
    ["-cp", root, "LibraryCheck"],
    { encoding: "utf8", timeout: 30000 },
  );
  verify(
    java,
    javaOutput
      .trim()
      .split("\n")
      .map((s) => JSON.parse(s)),
  );
  console.log(
    `${checked} reference executions passed across ${libraryLessons.length} lessons; Java compiled for Java 8.`,
  );
} finally {
  rmSync(root, { recursive: true, force: true });
}
