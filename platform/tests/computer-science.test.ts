import test from "node:test";
import assert from "node:assert/strict";
import { modules } from "../lib/computer-science/catalog";
import {
  buildLab,
  defaultSettings,
  simulateJoin,
  simulateSchedule,
  simulatePages,
} from "../lib/computer-science/models";
import {
  architectureTemplate,
  simulateArchitecture,
  validArchitecture,
} from "../lib/computer-science/architecture";
const last = <T>(values: T[]) => values.at(-1)!;
test("all guided labs produce explanatory steps and valid quiz answers", () => {
  assert.equal(modules.length, 19);
  for (const m of modules) {
    assert.ok(m.quiz.answer >= 0 && m.quiz.answer < m.quiz.choices.length);
    const result =
      m.kind === "architecture"
        ? simulateArchitecture(architectureTemplate(m.id))
        : buildLab(m, defaultSettings);
    assert.ok(result.frames.length > 0, m.id);
    for (const frame of result.frames) {
      assert.ok(frame.title && frame.explanation, m.id);
    }
  }
});
test("joins preserve unmatched left rows until a WHERE filter excludes NULL", () => {
  assert.equal(last(simulateJoin("INNER", 0)).table!.rows.length, 4);
  const left = last(simulateJoin("LEFT", 0)).table!.rows;
  assert.equal(left.length, 5);
  assert.deepEqual(
    left.find((r) => r[0] === "Chen"),
    ["Chen", "NULL", "NULL"],
  );
  assert.equal(last(simulateJoin("LEFT", 100)).table!.rows.length, 2);
});
test("scheduling conserves CPU work and calculates waits independently of policy", () => {
  for (const policy of ["FCFS", "SJF", "RR"]) {
    const result = last(simulateSchedule([5, 3, 1], policy, 2));
    assert.equal(result.timeline!.length, 9);
    assert.equal(result.timeline!.filter((p) => p === "P1").length, 5);
    assert.equal(result.metrics["Total CPU time"], 9);
  }
  assert.equal(
    last(simulateSchedule([5, 3, 1], "FCFS", 2)).metrics["Average wait"],
    "4.33",
  );
  assert.equal(
    last(simulateSchedule([5, 3, 1], "SJF", 2)).metrics["Average wait"],
    "1.67",
  );
  assert.deepEqual(last(simulateSchedule([5, 3, 1], "RR", 2)).timeline, [
    "P1",
    "P1",
    "P2",
    "P2",
    "P3",
    "P1",
    "P1",
    "P2",
    "P1",
  ]);
});
test("a page hit changes LRU recency but not FIFO loading order", () => {
  const seq = [1, 2, 3, 1, 4];
  assert.equal(last(simulatePages(seq, 3, "FIFO")).metrics.Evicted, 1);
  assert.equal(last(simulatePages(seq, 3, "LRU")).metrics.Evicted, 2);
  assert.equal(last(simulatePages(seq, 3, "LRU")).metrics.Faults, 4);
});
test("rollback and commit retain the total committed balance", () => {
  const m = modules.find((m) => m.id === "transactions")!;
  for (const fail of [true, false]) {
    const result = last(buildLab(m, { ...defaultSettings, fail }).frames);
    assert.equal(
      Number(result.cells[0].value) + Number(result.cells[1].value),
      150,
    );
    assert.equal(result.cells[0].value, fail ? 100 : 70);
  }
});
test("lost TCP segment retries the same bytes and does not duplicate delivery", () => {
  const m = modules.find((m) => m.id === "tcp-retries")!;
  for (const drop of [0, 1, 2, 3, 4]) {
    const result = last(buildLab(m, { ...defaultSettings, drop }).frames);
    assert.equal(result.metrics["Delivered bytes"], 400);
    assert.equal(result.metrics.Transmissions, drop ? 5 : 4);
  }
});
test("queue jobs survive worker and queue outages, and drain after recovery", () => {
  const a = architectureTemplate("chat-service");
  a.nodes = a.nodes.map((n) => ({ ...n, failed: n.role === "worker" }));
  const outage = simulateArchitecture(a);
  assert.equal(outage.queue, 1200);
  assert.equal(outage.capacity, 0);
  a.backlog = outage.queue;
  a.nodes = a.nodes.map((n) => ({ ...n, failed: n.role === "queue" }));
  assert.equal(simulateArchitecture(a).queue, 1200);
  a.nodes = a.nodes.map((n) => ({ ...n, failed: false }));
  a.traffic = 0;
  assert.equal(simulateArchitecture(a).queue, 400);
});
test("architecture capacity follows storage and cache limits; missing routes fail clearly", () => {
  const a = architectureTemplate("url-shortener");
  a.hitRate = 0;
  assert.equal(simulateArchitecture(a).capacity, 80);
  a.hitRate = 80;
  assert.equal(simulateArchitecture(a).capacity, 150);
  a.edges = [];
  assert.equal(simulateArchitecture(a).capacity, 0);
  assert.ok(validArchitecture(a));
  assert.equal(validArchitecture({ ...a, traffic: Infinity }), false);
});
test("invalid simulation input returns a helpful error", () => {
  const m = modules.find((m) => m.id === "cpu-scheduling")!;
  assert.match(
    buildLab(m, { ...defaultSettings, bursts: "1,,2" }).error!,
    /comma-separated/,
  );
});
