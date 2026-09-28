import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { problems, problemById } from "../lib/curriculum/catalog.ts";
import { practiceCases, starterCode } from "../lib/practice/cases.ts";
import { confidence } from "../lib/practice/types.ts";
import { validateProblemInput } from "../lib/curriculum/validate.ts";
import { matchesAnswer } from "../lib/curriculum/learning.ts";
import {
  handlePractice,
  gradeSolution,
  referenceCode,
  suite,
} from "../server/practice.ts";
import { aiReview } from "../server/review.ts";
import { listAttempts, saveAttempt, takeUsage } from "../server/progress.ts";
import { execute } from "../build/local-runtime.ts";

test("all 100 problems have three valid practice cases, stored answers, and blank starters", () => {
  for (const p of problems) {
    const cases = practiceCases(p);
    assert.equal(cases.length, 3, p.id);
    assert.equal(
      new Set(cases.map((c) => JSON.stringify(c.input))).size,
      3,
      p.id,
    );
    assert.equal(suite(p.id).length, 8);
    for (const c of cases)
      assert.equal(validateProblemInput(p.id, c.input), null, c.id);
    for (const c of suite(p.id)) assert.notEqual(c.expected, undefined, c.id);
    for (const language of ["python", "javascript", "cpp"])
      assert.match(starterCode(p, language), /Write your solution here/);
  }
});
test("equivalent valid answers pass without accepting invalid answers", () => {
  assert.ok(
    matchesAnswer(
      problemById["two-sum-sorted"],
      { nums: [1, 2, 3, 4], target: 5 },
      [1, 4],
      [2, 3],
    ),
  );
  assert.ok(
    !matchesAnswer(
      problemById["two-sum-sorted"],
      { nums: [1, 2, 3, 4], target: 5 },
      [1, 4],
      [2, 2],
    ),
  );
  assert.ok(
    matchesAnswer(
      problemById["gas-station"],
      { gas: [2, 2], cost: [1, 1] },
      0,
      1,
    ),
  );
  assert.ok(
    !matchesAnswer(
      problemById["gas-station"],
      { gas: [0, 2], cost: [1, 1] },
      1,
      0,
    ),
  );
  assert.ok(
    matchesAnswer(
      problemById["minimum-window"],
      { s: "abxxba", t: "ab" },
      "ab",
      "ba",
    ),
  );
  assert.ok(
    !matchesAnswer(
      problemById["minimum-window"],
      { s: "abxxba", t: "ab" },
      "ab",
      "xx",
    ),
  );
  assert.ok(
    matchesAnswer(
      problemById["phone-letters"],
      { digits: "2" },
      ["a", "b", "c"],
      ["c", "a", "b"],
    ),
  );
});
test("confidence requires distinct independent exercises and an explained challenge", () => {
  const a = {
    id: "a",
    at: "2026-01-01",
    level: "independent",
    caseId: "a",
    language: "python",
    score: 100,
    passed: 8,
    total: 8,
    assisted: false,
    explanation: "The search interval shrinks while preserving the target.",
  };
  assert.equal(confidence([]).label, "Learning");
  assert.equal(confidence([a]).label, "Practicing");
  assert.equal(
    confidence([a, { ...a, level: "challenge" }]).label,
    "Practicing",
  );
  assert.equal(
    confidence([a, { ...a, caseId: "b", level: "challenge", assisted: true }])
      .label,
    "Practicing",
  );
  assert.equal(
    confidence([a, { ...a, caseId: "b", level: "challenge" }]).label,
    "Confident",
  );
  assert.equal(
    confidence([
      { ...a, level: "guided" },
      { ...a, caseId: "b", level: "challenge" },
    ]).label,
    "Practicing",
  );
});
test("server selects its own tests, computes partial scores, and handles malformed outputs", async () => {
  let runs = 0;
  const executor = async () => {
    runs++;
    return { frames: [], result: -1 };
  };
  const result = await handlePractice(
    {
      action: "grade",
      problemId: "binary-search-standard",
      language: "javascript",
      code: "ignored by stub",
      tests: [],
      score: 100,
    },
    executor,
  );
  assert.equal(runs, 8);
  assert.ok(result.score > 0 && result.score < 100);
  assert.equal(result.score, Math.round((result.passed / 8) * 100));
  const malformed = await gradeSolution(
    "course-order",
    "javascript",
    "x",
    async () => ({ frames: [], result: [{}] }),
  );
  assert.equal(malformed.passed, 0);
});
test("unavailable infrastructure and cancellations do not produce a rating", async () => {
  await assert.rejects(
    () =>
      gradeSolution("binary-search-standard", "javascript", "x", async () => ({
        frames: [],
        result: null,
        error: "sandbox_apply: Operation not permitted",
      })),
    /unavailable/,
  );
  const c = new AbortController();
  c.abort();
  await assert.rejects(
    () =>
      gradeSolution(
        "binary-search-standard",
        "javascript",
        "x",
        async () => {
          throw Error("must not run");
        },
        c.signal,
      ),
    /abort/i,
  );
  await assert.rejects(
    () =>
      handlePractice(
        { action: "predict", problemId: "__proto__", language: "python" },
        async () => {},
      ),
    /valid problem/,
  );
});
test("prediction compares server-stored answers and never executes submitted code", async () => {
  const prediction = await handlePractice(
    {
      action: "predict",
      problemId: "binary-search-standard",
      language: "javascript",
      caseId: "binary-search-standard:0",
      answer: 3,
    },
    async () => {
      throw Error("must not execute");
    },
  );
  assert.equal(prediction.passed, true);
});
test("account attempts and usage limits are isolated by authenticated user", async () => {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(
    readFileSync(
      new URL("../drizzle/0000_curvy_onslaught.sql", import.meta.url),
      "utf8",
    ),
  );
  const db = {
    prepare(sql) {
      return {
        bind(...args) {
          const s = sqlite.prepare(sql);
          return {
            async run() {
              return s.run(...args);
            },
            async first() {
              return s.get(...args);
            },
            async all() {
              return { results: s.all(...args) };
            },
          };
        },
      };
    },
  };
  const a = {
    id: "one",
    at: "2026-01-01",
    level: "independent",
    caseId: "p:0",
    language: "python",
    score: 100,
    passed: 8,
    total: 8,
    assisted: false,
    explanation: "A test explanation.",
  };
  await saveAttempt(db, "alice", "p", a);
  assert.equal((await listAttempts(db, "alice", "p")).length, 1);
  assert.equal((await listAttempts(db, "bob", "p")).length, 0);
  assert.equal((await listAttempts(db, "alice", "q")).length, 0);
  for (let i = 0; i < 12; i++) await takeUsage(db, "alice", "ai");
  await assert.rejects(() => takeUsage(db, "alice", "ai"), /limit/);
  await takeUsage(db, "bob", "ai");
  sqlite.close();
});
test("AI parser uses structured results and handles refusal or invalid output", async () => {
  const original = globalThis.fetch;
  let sent;
  try {
    globalThis.fetch = async (_url, init) => {
      sent = JSON.parse(init.body);
      return Response.json({
        status: "completed",
        output: [
          {
            content: [
              {
                type: "output_text",
                text: JSON.stringify({
                  summary: "Already meets the target.",
                  time: "O(log n), estimated from halving.",
                  space: "O(1)",
                  suggestions: ["Explain your invariant."],
                  code: null,
                }),
              },
            ],
          },
        ],
      });
    };
    const review = await aiReview(
      problemById["binary-search-standard"],
      "javascript",
      "function solve(d){return -1;}",
      { cases: [] },
      "review",
      { apiKey: "test-only", model: "test-only" },
    );
    assert.equal(review.code, null);
    assert.equal(sent.store, false);
    assert.equal(sent.text.format.strict, true);
    globalThis.fetch = async () =>
      Response.json({
        status: "completed",
        output: [{ content: [{ type: "refusal" }] }],
      });
    await assert.rejects(
      () =>
        aiReview(
          problemById["binary-search-standard"],
          "javascript",
          "x",
          { cases: [] },
          "review",
          { apiKey: "test-only", model: "test-only" },
        ),
      /usable/,
    );
  } finally {
    globalThis.fetch = original;
  }
});
for (const language of ["python", "javascript", "cpp"])
  test(`real ${language} submissions pass all eight binary-search cases`, async () => {
    const result = await gradeSolution(
      "binary-search-standard",
      language,
      referenceCode("binary-search-standard", language),
      execute,
    );
    assert.equal(result.score, 100);
    assert.equal(result.passed, 8);
  });
test("actual incorrect code gets partial feedback and a verified reference proposal", async () => {
  const code = "function solve(data){return -1;}";
  const result = await handlePractice(
    {
      action: "optimize",
      problemId: "binary-search-standard",
      language: "javascript",
      code,
    },
    execute,
  );
  assert.ok(result.originalGrade.score < 100);
  assert.equal(result.grade.score, 100);
  assert.equal(result.source, "reference");
  assert.equal(result.improved, true);
  assert.notEqual(result.code, code);
});
test("cancelling a real infinite loop promptly kills the child process", async () => {
  const c = new AbortController();
  const start = Date.now();
  const timer = setTimeout(() => c.abort(), 150);
  try {
    await assert.rejects(
      () =>
        execute(
          {
            language: "javascript",
            code: "function solve(){while(true){}}",
            input: {},
          },
          c.signal,
        ),
      /abort/i,
    );
    assert.ok(Date.now() - start < 3000);
  } finally {
    clearTimeout(timer);
  }
});

test("an AI no-change review keeps the submitted solution instead of replacing it", async () => {
  const original = globalThis.fetch;
  let runs = 0;
  try {
    globalThis.fetch = async () =>
      Response.json({
        status: "completed",
        output: [
          {
            content: [
              {
                type: "output_text",
                text: JSON.stringify({
                  summary: "No change needed.",
                  time: "Unknown",
                  space: "Unknown",
                  suggestions: [],
                  code: null,
                }),
              },
            ],
          },
        ],
      });
    const result = await handlePractice(
      {
        action: "optimize",
        problemId: "binary-search-standard",
        language: "javascript",
        code: "function solve(d){return -1;}",
      },
      async () => {
        runs++;
        return { frames: [], result: -1 };
      },
      { apiKey: "test-only", model: "test-only" },
    );
    assert.equal(result.unchanged, true);
    assert.equal(result.code, undefined);
    assert.equal(runs, 8);
  } finally {
    globalThis.fetch = original;
  }
});
