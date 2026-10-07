import { initialScenario, examplesFor } from "../lib/computer-science/examples";
import { trackModules } from "../lib/computer-science/roadmaps";
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
  assert.equal(modules.length, 35);
  for (const m of modules) {
    assert.ok(m.quiz.answer >= 0 && m.quiz.answer < m.quiz.choices.length);
    const result =
      m.kind === "architecture"
        ? simulateArchitecture(architectureTemplate(m.id))
        : buildLab(m, initialScenario(m.id).settings);
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
const deepRun = (id: string, quantity: number, variant: string) =>
  buildLab(
    modules.find((m) => m.id === id)!,
    { ...initialScenario(id).settings, quantity, variant },
  );
test("roadmaps cover each technical lesson once and every worked example runs", () => {
  const ids = [
    "system-design",
    "databases",
    "operating-systems",
    "networks",
    "oop",
  ] as const;
  const path = ids.flatMap((t) => trackModules(t).map((m) => m.id));
  assert.equal(new Set(path).size, modules.length);
  for (const m of modules) {
    const examples = examplesFor(m);
    assert.equal(examples.length, 3, m.id);
    for (const e of examples) {
      const result =
        m.kind === "architecture"
          ? simulateArchitecture(e.scenario.architecture)
          : buildLab(m, e.scenario.settings);
      assert.ok(result.frames.length > 0, `${m.id}: ${e.title}`);
      assert.equal("error" in result ? result.error : undefined, undefined);
    }
  }
});
test("work-aware balancing conserves jobs and improves this uneven batch", () => {
  const rr = last(deepRun("load-balancing", 6, "round-robin").frames),
    least = last(deepRun("load-balancing", 6, "least-work").frames);
  assert.equal(rr.metrics["Assigned jobs"], 6);
  assert.equal(rr.metrics["Total work"], 22);
  assert.equal(least.metrics["Total work"], 22);
  assert.equal(rr.metrics["Largest queue"], 16);
  assert.equal(least.metrics["Largest queue"], 9);
});
test("cache invalidation removes stale reads and replica catches up on schedule", () => {
  const ttl = deepRun("cache-invalidation", 20, "ttl").frames,
    invalidated = deepRun("cache-invalidation", 20, "invalidate").frames;
  assert.equal(ttl[2].metrics["Read result"], 10);
  assert.equal(invalidated[2].metrics["Read result"], 20);
  assert.equal(last(ttl).metrics["Read result"], 20);
  const repl = deepRun("replication-lag", 3, "replica").frames;
  assert.equal(repl[1].metrics["Read version"], 1);
  assert.equal(repl[3].metrics["Read version"], 1);
  assert.equal(repl[4].metrics["Read version"], 2);
});
test("token bucket conserves arrivals and never exceeds its bounds", () => {
  for (let capacity = 1; capacity <= 8; capacity++) {
    const frames = deepRun("rate-limiting", capacity, "burst").frames;
    for (const f of frames) {
      const tokens = Number(f.metrics.Tokens ?? capacity);
      assert.ok(tokens >= 0 && tokens <= capacity);
    }
    const final = last(frames);
    assert.equal(
      Number(final.metrics["Accepted total"]) +
        Number(final.metrics["Rejected total"]),
      12,
    );
  }
  assert.equal(
    last(deepRun("rate-limiting", 3, "burst").frames).metrics["Accepted total"],
    8,
  );
});
test("grouping and index order preserve SQL semantics", () => {
  assert.deepEqual(
    last(deepRun("sql-aggregation", 100, "sum").frames).table!.rows,
    [
      ["Asha", 230],
      ["Ben", 100],
      ["Dia", 200],
    ],
  );
  assert.deepEqual(
    last(deepRun("sql-aggregation", 2, "count").frames).table!.rows,
    [
      ["Asha", 2],
      ["Ben", 2],
    ],
  );
  const customer = last(
      deepRun("composite-index", 80, "customer-first").frames,
    ),
    amount = last(deepRun("composite-index", 80, "amount-first").frames);
  assert.deepEqual(customer.table!.rows, amount.table!.rows);
  assert.equal(customer.metrics["Candidate entries"], 2);
  assert.equal(amount.metrics["Candidate entries"], 5);
});
test("read committed can change while snapshot reads remain stable", () => {
  assert.equal(
    last(deepRun("transaction-isolation", 10, "read-committed").frames).cells[1]
      .value,
    110,
  );
  assert.equal(
    last(deepRun("transaction-isolation", 10, "snapshot").frames).cells[1]
      .value,
    100,
  );
});
test("page translation preserves offsets, including a recovered fault", () => {
  for (let address = 0; address < 32; address++) {
    const final = last(deepRun("virtual-memory", address, "fault").frames);
    assert.equal(Number(final.cells[0].value) % 4, address % 4);
    assert.equal(
      final.metrics["Page faults"],
      Math.floor(address / 4) === 3 ? 1 : 0,
    );
  }
  assert.equal(
    last(deepRun("virtual-memory", 13, "fault").frames).cells[0].value,
    5,
  );
});
test("bounded buffer conserves items and respects capacity with either policy", () => {
  for (const policy of ["block", "drop"])
    for (let cap = 1; cap <= 4; cap++) {
      const frames = deepRun("bounded-buffer", cap, policy).frames;
      for (const f of frames) assert.ok(Number(f.metrics.Buffered) <= cap);
      const f = last(frames);
      assert.equal(
        Number(f.metrics.Delivered) +
          Number(f.metrics.Dropped) +
          Number(f.metrics.Buffered) +
          Number(f.metrics["Waiting producers"]),
        4,
      );
    }
  assert.equal(
    last(deepRun("bounded-buffer", 2, "block").frames).metrics.Delivered,
    4,
  );
  assert.equal(
    last(deepRun("bounded-buffer", 2, "drop").frames).metrics.Dropped,
    1,
  );
});
test("disk scheduling computes total head movement for both policies", () => {
  assert.equal(
    last(deepRun("disk-scheduling", 50, "fcfs").frames).metrics[
      "Total movement"
    ],
    472,
  );
  assert.equal(
    last(deepRun("disk-scheduling", 50, "sstf").frames).metrics[
      "Total movement"
    ],
    205,
  );
});
test("routing changes after a failure or cheaper alternate link", () => {
  assert.equal(
    last(deepRun("shortest-routing", 8, "online").frames).metrics["Route cost"],
    5,
  );
  assert.equal(
    last(deepRun("shortest-routing", 8, "offline").frames).metrics[
      "Route cost"
    ],
    7,
  );
  assert.equal(
    last(deepRun("shortest-routing", 1, "online").frames).metrics["Route cost"],
    3,
  );
});
test("sliding window retries once without duplicate delivery for every window size", () => {
  for (let size = 1; size <= 4; size++)
    for (const variant of ["reliable", "loss"]) {
      const f = last(deepRun("sliding-window-network", size, variant).frames);
      assert.equal(f.metrics["Delivered prefix"], 6);
      assert.equal(f.metrics.Transmissions, variant === "loss" ? 7 : 6);
      assert.equal(f.metrics["Next expected segment"], 7);
    }
});
test("congestion feedback halves the window after loss, then probes again", () => {
  const frames = deepRun("congestion-control", 4, "aimd").frames;
  assert.deepEqual(
    frames.slice(0, 6).map((f) => f.cells[0].value),
    [1, 2, 3, 4, 5, 2],
  );
  assert.equal(frames[4].cells[2].value, 2);
});
test("object contracts reject invalid state, adapt units and preserve wrapper order", () => {
  assert.equal(
    last(deepRun("encapsulation", 120, "guarded").frames).cells[0].value,
    100,
  );
  assert.equal(
    last(deepRun("encapsulation", 120, "public").frames).metrics[
      "Invariant holds"
    ],
    "no",
  );
  assert.equal(
    last(deepRun("adapter-pattern", 100, "adapter").frames).cells[0].value,
    212,
  );
  assert.equal(
    last(deepRun("decorator-pattern", 100, "compress-encrypt").frames).metrics[
      "Output bytes"
    ],
    66,
  );
  assert.equal(
    last(deepRun("decorator-pattern", 100, "encrypt-compress").frames).metrics[
      "Output bytes"
    ],
    116,
  );
});
