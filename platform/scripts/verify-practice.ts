import { writeFile } from "node:fs/promises";
import { problems } from "../lib/curriculum/catalog";
import { practiceCases } from "../lib/practice/cases";
import { validateProblemInput } from "../lib/curriculum/validate";
import { matchesAnswer } from "../lib/curriculum/learning";
import { pythonPrelude, pythonSources } from "../lib/curriculum/sources";
import { playgroundSource } from "../lib/curriculum/playground";
import { execute } from "../build/local-runtime";

const answers: Record<string, unknown> = {};
for (const p of problems) {
  if (practiceCases(p).length !== 3)
    throw Error(`Missing practice cases: ${p.id}`);
  for (const c of practiceCases(p)) {
    const validation = validateProblemInput(p.id, c.input);
    if (validation) throw Error(`${c.id}: ${validation}`);
    const python = await execute({
      language: "python",
      code: pythonPrelude + pythonSources[p.id],
      input: c.input,
      problemId: p.id,
    });
    const js = await execute({
      language: "javascript",
      code: playgroundSource(p, "javascript"),
      input: c.input,
      problemId: p.id,
    });
    if (
      python.error ||
      js.error ||
      !matchesAnswer(p, c.input, python.result, js.result)
    )
      throw Error(
        `${c.id}: ${JSON.stringify({ python: python.error ?? python.result, javascript: js.error ?? js.result })}`,
      );
    answers[c.id] = python.result;
  }
  console.log(`Verified ${p.id}`);
}
await writeFile(
  new URL("../server/practice-answers.json", import.meta.url),
  JSON.stringify(answers, null, 2) + "\n",
);
console.log(
  `Verified ${Object.keys(answers).length} answers against Python and JavaScript references.`,
);
