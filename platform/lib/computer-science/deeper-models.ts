import type { Frame, LabResult, Settings, Cell, DiagramNode } from "./models";
import { deepSpecs } from "./deeper-catalog";
const f = (
  title: string,
  explanation: string,
  cells: Cell[] = [],
  metrics: Frame["metrics"] = {},
  active: string[] = [],
): Frame => ({ title, explanation, cells, metrics, active });
const c = (
  id: string,
  label: string,
  value: string | number,
  tone?: Cell["tone"],
): Cell => ({ id, label, value, tone });
const flow = (labels: string[]): DiagramNode[] =>
  labels.map((label, i) => ({
    id: String(i),
    label,
    x: 15 + (i * 70) / Math.max(1, labels.length - 1),
    y: 50,
  }));
export function deeperLab(id: string, s: Settings): LabResult {
  const spec = deepSpecs[id];
  if (!spec)
    return {
      frames: [],
      nodes: [],
      edges: [],
      code: "",
      assumptions: "",
      error: "Unknown lesson.",
    };
  const n = s.quantity,
    variant = spec.variants.some((v) => v[0] === s.variant)
      ? s.variant
      : spec.variants[0][0];
  if (!Number.isInteger(n) || n < spec.min || n > spec.max)
    return {
      frames: [],
      nodes: [],
      edges: [],
      code: "",
      assumptions: "",
      error: `Enter a whole number from ${spec.min} to ${spec.max} for ${spec.input.toLowerCase()}.`,
    };
  let frames: Frame[] = [],
    nodes: DiagramNode[] = [],
    edges: [string, string][] = [],
    code = "",
    assumptions =
      "A bounded teaching model. The reference logic explains the computed steps; it is not executed as user code.";
  switch (id) {
    case "load-balancing": {
      nodes = [
        { id: "in", label: "Incoming jobs", x: 18, y: 50 },
        ...["A", "B", "C"].map((label, i) => ({
          id: label,
          label: `Server ${label}`,
          x: 75,
          y: 20 + i * 30,
        })),
      ];
      edges = ["A", "B", "C"].map((key) => ["in", key]);
      const work = [0, 0, 0],
        counts = [0, 0, 0],
        jobs = [8, 1, 2, 8, 1, 2, 8, 1, 2, 8, 1, 2];
      for (let i = 0; i < n; i++) {
        const server =
          variant === "round-robin" ? i % 3 : work.indexOf(Math.min(...work));
        work[server] += jobs[i];
        counts[server]++;
        frames.push(
          f(
            `Assign job ${i + 1} (${jobs[i]} work units)`,
            variant === "round-robin"
              ? `Round robin chooses server ${"ABC"[server]} by rotation.`
              : `Server ${"ABC"[server]} has the least queued work before this assignment; ties choose A, then B, then C.`,
            work.map((w, j) =>
              c(
                "ABC"[j],
                `Server ${"ABC"[j]}`,
                `${w} work · ${counts[j]} jobs`,
                j === server ? "active" : undefined,
              ),
            ),
            {
              "Assigned jobs": i + 1,
              "Total work": work.reduce((a, b) => a + b, 0),
              "Largest queue": Math.max(...work),
            },
            ["ABC"[server]],
          ),
        );
      }
      code =
        variant === "round-robin"
          ? "server = servers[next++ % servers.length]\nserver.enqueue(job)"
          : "server = min(servers, by = queuedServiceTime)\nserver.enqueue(job)";
      break;
    }
    case "cache-invalidation": {
      nodes = flow(["Reader", "Cache", "Database"]);
      edges = [
        ["0", "1"],
        ["1", "2"],
      ];
      const cells = (db: number, cache: string | number) => [
        c("db", "Durable value", db),
        c("cache", "Cached value", cache),
      ];
      frames = [
        f(
          "t=0 · Fill the cache",
          "The first read caches value 10 with an expiry at tick 4.",
          cells(10, 10),
          { "Read result": 10 },
          ["1"],
        ),
        f(
          "t=1 · Commit the update",
          `Storage changes to ${n}. ${variant === "invalidate" ? "Invalidate the old cache entry." : "The TTL-only policy leaves the old entry valid until tick 4."}`,
          cells(n, variant === "invalidate" ? "empty" : 10),
          {},
          ["2"],
        ),
        f(
          "t=2 · Read again",
          variant === "invalidate"
            ? "Cache miss: fetch the committed value and refill the cache."
            : "Cache hit before expiry: return the old cached value.",
          cells(n, variant === "invalidate" ? n : 10),
          {
            "Read result": variant === "invalidate" ? n : 10,
            Stale: variant !== "invalidate" && n !== 10 ? "yes" : "no",
          },
          ["1"],
        ),
        f(
          "t=5 · Read after expiry",
          "The expired entry is discarded. Fetch current storage and start a new TTL.",
          cells(n, n),
          { "Read result": n, Stale: "no" },
          ["2", "1"],
        ),
      ];
      code = `write(key, ${n})\n${variant === "invalidate" ? "cache.delete(key)" : "// Let the existing TTL expire"}\nread(key):\n  if cache.valid(key): return cache[key]\n  value = database.read(key)\n  cache.put(key, value, ttl=4)\n  return value`;
      break;
    }
    case "replication-lag": {
      nodes = flow(["Writer / reader", "Leader", "Replica"]);
      edges = [
        ["0", "1"],
        ["1", "2"],
        ["0", "2"],
      ];
      for (let tick = 0; tick <= n + 1; tick++) {
        const leader = tick === 0 ? 1 : 2,
          replica = tick >= n + 1 ? 2 : 1,
          read = variant === "leader" ? leader : replica;
        frames.push(
          f(
            `Tick ${tick}${tick === 1 ? " · write commits" : ""}`,
            tick === 0
              ? "Both nodes initially hold version 1."
              : tick === 1
                ? "The leader commits version 2. Replication has not applied it yet."
                : tick === n + 1
                  ? "The replica applies version 2 and catches up."
                  : "The replication event is still delayed; a replica read can see version 1.",
            [
              c("leader", "Leader version", leader),
              c(
                "replica",
                "Replica version",
                replica,
                replica < leader ? "waiting" : "done",
              ),
            ],
            {
              "Read target": variant,
              "Read version": read,
              Stale: read < leader ? "yes" : "no",
            },
            [variant === "leader" ? "1" : "2"],
          ),
        );
      }
      code = `commitOnLeader(version=2)\nscheduleReplicaApply(afterTicks=${n})\nreadFrom(${variant})`;
      break;
    }
    case "rate-limiting": {
      let tokens = n,
        accepted = 0,
        rejected = 0;
      const arrivals =
        variant === "burst" ? [6, 0, 0, 4, 0, 2] : [1, 1, 1, 1, 1, 1];
      frames.push(
        f(
          "Start with a full bucket",
          `The bucket holds ${n} tokens and refills one per tick.`,
          [c("tokens", "Tokens", tokens)],
          { "Accepted total": 0, "Rejected total": 0 },
        ),
      );
      arrivals.forEach((requests, t) => {
        const refill = t === 0 ? 0 : Math.min(1, n - tokens);
        tokens += refill;
        const yes = Math.min(tokens, requests);
        tokens -= yes;
        accepted += yes;
        rejected += requests - yes;
        frames.push(
          f(
            `Tick ${t} · ${requests} arrivals`,
            `Refill ${refill}; accept ${yes}; reject ${requests - yes}. Each accepted request spends one token.`,
            Array.from({ length: n }, (_, i) =>
              c(
                String(i),
                `Token ${i + 1}`,
                i < tokens ? "available" : "spent",
                i < tokens ? "done" : "waiting",
              ),
            ),
            {
              Tokens: tokens,
              "Accepted total": accepted,
              "Rejected total": rejected,
              "Arrivals total": accepted + rejected,
            },
          ),
        );
      });
      code = `tokens = capacity = ${n}\nonTick(): tokens = min(capacity, tokens + 1)\nonRequest():\n  if tokens == 0: reject()\n  else: tokens -= 1; accept()`;
      break;
    }
    case "sql-aggregation": {
      const rows: [string, number][] = [
          ["Asha", 80],
          ["Asha", 150],
          ["Ben", 40],
          ["Dia", 200],
          ["Ben", 60],
        ],
        groups = new Map<string, number>();
      rows.forEach(([name, amount], i) => {
        groups.set(
          name,
          (groups.get(name) ?? 0) + (variant === "count" ? 1 : amount),
        );
        frames.push({
          ...f(
            `Aggregate row ${i + 1}`,
            `Add ${variant === "count" ? "one order" : amount} to ${name}'s group.`,
            [],
            { "Rows processed": i + 1 },
          ),
          table: {
            columns: ["Customer", variant === "count" ? "Count" : "Total"],
            rows: [...groups],
          },
        });
      });
      const kept = [...groups].filter(([, value]) => value >= n);
      frames.push({
        ...f(
          "Apply HAVING",
          `Keep complete groups whose ${variant === "count" ? "count" : "total"} is at least ${n}.`,
          [],
          { "Groups returned": kept.length },
        ),
        table: {
          columns: ["Customer", variant === "count" ? "Count" : "Total"],
          rows: kept,
        },
      });
      code = `SELECT customer, ${variant === "count" ? "COUNT(*)" : "SUM(amount)"} AS value\nFROM orders\nGROUP BY customer\nHAVING ${variant === "count" ? "COUNT(*)" : "SUM(amount)"} >= ${n};`;
      break;
    }
    case "composite-index": {
      const entries: [string, number][] = [
        ["Asha", 40],
        ["Asha", 80],
        ["Asha", 150],
        ["Ben", 60],
        ["Ben", 120],
        ["Chen", 90],
        ["Dia", 200],
      ];
      entries.sort(
        variant === "customer-first"
          ? (a, b) => a[0].localeCompare(b[0]) || a[1] - b[1]
          : (a, b) => a[1] - b[1] || a[0].localeCompare(b[0]),
      );
      const candidates = entries.filter(
        ([name, amount]) =>
          amount >= n &&
          (variant === "customer-first" ? name === "Asha" : true),
      );
      let matches: [string, number][] = [];
      frames.push({
        ...f(
          "Locate the candidate interval",
          variant === "customer-first"
            ? `Seek to customer Asha, amount ≥ ${n}.`
            : `Seek to amount ≥ ${n}; customer is a residual filter.`,
          [],
          { "Candidate entries": candidates.length },
        ),
        table: { columns: ["Index customer", "Amount"], rows: entries },
      });
      candidates.forEach(([name, amount], i) => {
        const match = name === "Asha";
        if (match) matches = [...matches, [name, amount]];
        frames.push({
          ...f(
            `Inspect candidate ${i + 1}`,
            `${name}, ${amount}: ${match ? "matches both conditions" : "discard: wrong customer"}.`,
            [],
            { "Inspected candidates": i + 1, "Matched rows": matches.length },
          ),
          table: {
            columns: ["Matching customer", "Amount"],
            rows: [...matches],
          },
        });
      });
      frames.push({
        ...f(
          "Query complete",
          "Index order changes the candidate work, not the result.",
          [],
          {
            "Candidate entries": candidates.length,
            "Matched rows": matches.length,
          },
        ),
        table: { columns: ["Customer", "Amount"], rows: matches },
      });
      code = `CREATE INDEX ix ON orders (${variant === "customer-first" ? "customer, amount" : "amount, customer"});\nSELECT * FROM orders\nWHERE customer = 'Asha' AND amount >= ${n};`;
      assumptions +=
        " A sorted-index interval illustration; seek overhead, optimizer skip scans and page I/O are omitted.";
      break;
    }
    case "transaction-isolation": {
      const result = variant === "snapshot" ? 100 : 100 + n;
      nodes = flow(["Transaction A", "Committed storage", "Transaction B"]);
      edges = [
        ["0", "1"],
        ["2", "1"],
      ];
      frames = [
        f(
          "A starts and reads",
          "Transaction A reads committed balance 100. Snapshot mode retains this version.",
          [c("store", "Committed balance", 100), c("a", "A first read", 100)],
          {},
          ["0"],
        ),
        f(
          "B stages a change",
          `B privately stages ${100 + n}; committed storage is still 100.`,
          [
            c("store", "Committed balance", 100),
            c("b", "B staged value", 100 + n),
          ],
          {},
          ["2"],
        ),
        f(
          "B commits",
          "The new version becomes visible in committed storage.",
          [c("store", "Committed balance", 100 + n)],
          {},
          ["1"],
        ),
        f(
          "A reads again",
          variant === "snapshot"
            ? "A reads its original snapshot, despite the later commit."
            : "A’s new statement reads B’s committed version.",
          [
            c("first", "First read", 100),
            c("second", "Second read", result, "active"),
            c("store", "Current storage", 100 + n),
          ],
          { Repeatable: result === 100 ? "yes" : "no" },
          ["0"],
        ),
      ];
      code = `A: BEGIN ${variant === "snapshot" ? "SNAPSHOT READS" : "READ COMMITTED"}\nA: SELECT balance  // 100\nB: UPDATE balance = balance + ${n}; COMMIT\nA: SELECT balance  // ${result}`;
      break;
    }
    case "virtual-memory": {
      const page = Math.floor(n / 4),
        offset = n % 4,
        table = [5, 2, 7, 1, 6, 0, 4, 3],
        absent = variant === "fault" && page === 3;
      nodes = flow(["Virtual address", "Page table", "Physical memory"]);
      edges = [
        ["0", "1"],
        ["1", "2"],
      ];
      frames = [
        f(
          "Split the virtual address",
          `${n} ÷ 4 gives virtual page ${page}, offset ${offset}.`,
          [c("page", "Virtual page", page), c("offset", "Offset", offset)],
          {},
          ["0"],
        ),
        {
          ...f(
            "Consult the page table",
            absent
              ? "Page 3 is not present: raise a page fault."
              : `Page ${page} maps to frame ${table[page]}.`,
            [],
            { "Page faults": absent ? 1 : 0 },
            ["1"],
          ),
          table: {
            columns: ["Virtual page", "Frame", "Present"],
            rows: table.map((frame, i) => [
              i,
              variant === "fault" && i === 3 ? "—" : frame,
              variant === "fault" && i === 3 ? "no" : "yes",
            ]),
          },
        },
      ];
      if (absent)
        frames.push(
          f(
            "OS loads the absent page",
            "Frame 1 is available. Load page 3, mark its entry present, and retry the instruction.",
            [c("frame", "Allocated frame", 1, "done")],
            {},
            ["1", "2"],
          ),
        );
      frames.push(
        f(
          "Translate to a physical address",
          `${table[page]} × 4 + ${offset} = ${table[page] * 4 + offset}. The offset is unchanged.`,
          [
            c("physical", "Physical address", table[page] * 4 + offset, "done"),
            c("offset", "Offset", offset),
          ],
          { "Page faults": absent ? 1 : 0 },
          ["2"],
        ),
      );
      code =
        "page = virtualAddress / PAGE_SIZE\noffset = virtualAddress % PAGE_SIZE\nif !pageTable[page].present: handlePageFault(page)\nphysical = pageTable[page].frame * PAGE_SIZE + offset";
      break;
    }
    case "bounded-buffer": {
      const buffer: string[] = [],
        pending: string[] = [],
        delivered: string[] = [];
      let dropped = 0;
      const events = ["P1", "P2", "P3", "C", "P4", "C", "C", "C"];
      events.forEach((event, i) => {
        let why = "";
        if (event === "C") {
          if (buffer.length) {
            const item = buffer.shift()!;
            delivered.push(item);
            why = `Consume ${item}.`;
            if (pending.length) {
              const next = pending.shift()!;
              buffer.push(next);
              why += ` Waiting producer ${next} now enters the buffer.`;
            }
          } else why = "Buffer empty: consumer waits; no item is fabricated.";
        } else if (buffer.length < n) {
          buffer.push(event);
          why = `Enqueue ${event}.`;
        } else if (variant === "block") {
          pending.push(event);
          why = `Buffer full: ${event} waits for capacity.`;
        } else {
          dropped++;
          why = `Buffer full: reject ${event}.`;
        }
        frames.push(
          f(
            `Event ${i + 1} · ${event === "C" ? "consume" : `produce ${event}`}`,
            why,
            Array.from({ length: n }, (_, j) =>
              c(
                String(j),
                `FIFO slot ${j + 1}`,
                buffer[j] ?? "empty",
                buffer[j] ? "active" : undefined,
              ),
            ),
            {
              Buffered: buffer.length,
              "Waiting producers": pending.length,
              Delivered: delivered.length,
              Dropped: dropped,
            },
          ),
        );
      });
      code = `capacity = ${n}\nproduce(item):\n  ${variant === "block" ? "wait until buffer has space" : "if full: reject(item); return"}\n  enqueue(item)\nconsume():\n  wait until buffer has an item\n  return dequeue()`;
      break;
    }
    case "disk-scheduling": {
      let head = n,
        total = 0;
      const pending = [98, 183, 37, 122, 14];
      frames.push(
        f(
          "Initial request queue",
          "Requests arrived in order: 98, 183, 37, 122, 14.",
          [c("head", "Head cylinder", head)],
          { "Total movement": 0 },
        ),
      );
      while (pending.length) {
        const idx =
            variant === "sstf"
              ? pending.reduce(
                  (best, v, i) =>
                    Math.abs(v - head) < Math.abs(pending[best] - head)
                      ? i
                      : best,
                  0,
                )
              : 0,
          next = pending.splice(idx, 1)[0],
          distance = Math.abs(next - head);
        total += distance;
        frames.push(
          f(
            `Move ${head} → ${next}`,
            `Travel ${distance} cylinders to serve this request. ${variant === "sstf" ? "Choose the closest pending request; ties use arrival order." : "Preserve arrival order."}`,
            [
              c("head", "Head cylinder", next, "active"),
              ...pending.map((v) => c(String(v), "Pending cylinder", v)),
            ],
            {
              "This movement": distance,
              "Total movement": total,
              "Remaining requests": pending.length,
            },
          ),
        );
        head = next;
      }
      code =
        variant === "sstf"
          ? "while pending:\n  request = nearest(pending, head)\n  seek(request); serve(request)"
          : "for request in arrivalOrder:\n  seek(request); serve(request)";
      break;
    }
    case "shortest-routing": {
      nodes = [
        { id: "A", label: "Router A", x: 15, y: 50 },
        { id: "B", label: "Router B", x: 45, y: 20 },
        { id: "C", label: "Router C", x: 45, y: 80 },
        { id: "D", label: "Router D", x: 85, y: 50 },
      ];
      const links: [string, string, number][] = [
        ["A", "B", 2],
        ["A", "C", 5],
        ...(variant === "offline"
          ? []
          : [["B", "C", 1] as [string, string, number]]),
        ["B", "D", n],
        ["C", "D", 2],
      ];
      edges = links.map(([a, b]) => [a, b]);
      const dist: Record<string, number> = {
          A: 0,
          B: Infinity,
          C: Infinity,
          D: Infinity,
        },
        prev: Record<string, string> = {},
        done = new Set<string>();
      frames.push({
        ...f(
          "Read the network",
          "Undirected links have the costs shown below. Start at A with distance zero.",
        ),
        table: {
          columns: ["Link", "Cost"],
          rows: links.map(([a, b, w]) => [`${a} ↔ ${b}`, w]),
        },
      });
      while (done.size < 4) {
        const u = Object.keys(dist)
          .filter((k) => !done.has(k))
          .sort((a, b) => dist[a] - dist[b])[0];
        if (!u || !Number.isFinite(dist[u])) break;
        done.add(u);
        let updates: string[] = [];
        for (const [a, b, w] of links) {
          const v = a === u ? b : b === u ? a : null;
          if (v && !done.has(v) && dist[u] + w < dist[v]) {
            dist[v] = dist[u] + w;
            prev[v] = u;
            updates.push(`${v} becomes ${dist[v]}`);
          }
        }
        frames.push(
          f(
            `Settle router ${u}`,
            updates.length
              ? `Relax its links: ${updates.join("; ")}.`
              : "No remaining distance improves.",
            Object.entries(dist).map(([key, value]) =>
              c(
                key,
                `Distance to ${key}`,
                Number.isFinite(value) ? value : "∞",
                done.has(key) ? "done" : undefined,
              ),
            ),
            {},
            [u],
          ),
        );
      }
      const path = ["D"];
      while (prev[path[0]]) path.unshift(prev[path[0]]);
      frames.push(
        f(
          "Selected A → D route",
          path.join(" → "),
          [],
          { "Route cost": dist.D, Hops: path.length - 1 },
          path,
        ),
      );
      code =
        "dist[source] = 0\nwhile unsettled nodes remain:\n  u = unsettled node with minimum dist\n  settle(u)\n  for each neighbor v:\n    dist[v] = min(dist[v], dist[u] + cost(u,v))";
      assumptions += " Links are undirected and available in both directions.";
      break;
    }
    case "sliding-window-network": {
      nodes = flow(["Sender", "Network", "Receiver"]);
      edges = [
        ["0", "1"],
        ["1", "2"],
        ["2", "0"],
      ];
      let base = 1,
        next = 1,
        transmissions = 0,
        lost = false,
        round = 0;
      const received = new Set<number>();
      while (base <= 6) {
        round++;
        const sends: number[] = [];
        if (next > base && !received.has(base)) sends.push(base);
        while (next <= 6 && next < base + n) sends.push(next++);
        for (const seq of sends) {
          transmissions++;
          if (variant === "loss" && seq === 2 && !lost) {
            lost = true;
            frames.push(
              f(
                `Round ${round} · segment 2 lost`,
                "The receiver cannot advance past the missing segment.",
                [],
                { Transmissions: transmissions, "Next expected segment": base },
                ["1"],
              ),
            );
            continue;
          }
          received.add(seq);
          frames.push(
            f(
              `Round ${round} · receive segment ${seq}`,
              "Buffer this segment until all earlier segments are present.",
              Array.from({ length: 6 }, (_, i) =>
                c(
                  String(i + 1),
                  `Segment ${i + 1}`,
                  received.has(i + 1) ? "received" : "missing",
                  received.has(i + 1) ? "done" : "waiting",
                ),
              ),
              { Transmissions: transmissions },
              ["2"],
            ),
          );
        }
        while (received.has(base)) base++;
        frames.push(
          f(
            `Cumulative ACK · next expected ${base}`,
            base === 7
              ? "All six segments have been received."
              : `The sender may now use the window starting at segment ${base}. Missing data is retried in the next idealized round.`,
            [],
            {
              "Delivered prefix": base - 1,
              "Next expected segment": base,
              Transmissions: transmissions,
              Rounds: round,
            },
            ["0"],
          ),
        );
      }
      code = `window = ${n}\nsend new segments while next < base + window\nreceiver buffers out-of-order segments\nACK = first missing segment\non timeout: retry first missing segment`;
      break;
    }
    case "congestion-control": {
      let window = variant === "fixed" ? 8 : 1,
        losses = 0,
        total = 0;
      for (let round = 1; round <= 10; round++) {
        const offered = window,
          loss = offered > n;
        losses += loss ? 1 : 0;
        total += Math.min(offered, n);
        window =
          variant === "fixed"
            ? 8
            : loss
              ? Math.max(1, Math.floor(window / 2))
              : window + 1;
        frames.push(
          f(
            `Round ${round} · offer ${offered} segments`,
            loss
              ? `Path accepts ${n}; excess is lost. ${variant === "aimd" ? `Halve the next window to ${window}.` : "The fixed sender ignores feedback."}`
              : `No loss. ${variant === "aimd" ? `Increase the next window to ${window}.` : "Keep the fixed window."}`,
            [
              c(
                "offered",
                "Sending window",
                offered,
                loss ? "error" : "active",
              ),
              c("capacity", "Path capacity", n),
              c("next", "Next window", window),
            ],
            { "Loss rounds": losses, "Delivered total": total },
          ),
        );
      }
      code =
        variant === "aimd"
          ? "on successful round: cwnd += 1\non loss: cwnd = max(1, floor(cwnd / 2))"
          : "cwnd = 8\n// Fixed comparison: ignore feedback";
      break;
    }
    case "encapsulation": {
      const allowed = variant === "public" || n <= 100,
        balance = allowed ? 100 - n : 100;
      nodes = flow(["Caller", "Account method", "Private balance"]);
      edges = [
        ["0", "1"],
        ["1", "2"],
      ];
      frames = [
        f("Initial state", "The account begins with balance 100.", [
          c("balance", "Balance", 100),
        ]),
        f(
          `Request withdrawal ${n}`,
          variant === "public"
            ? "Direct field mutation bypasses the account’s validation."
            : `Check amount > 0 and amount ≤ balance: ${allowed ? "passes" : "fails"}.`,
          [c("amount", "Requested amount", n)],
          {},
          ["1"],
        ),
        f(
          allowed ? "Apply the change" : "Reject the operation",
          allowed
            ? `New balance is ${balance}. ${balance < 0 ? "The nonnegative invariant is broken." : "The invariant remains true."}`
            : "Insufficient funds: the object keeps its original balance.",
          [c("balance", "Balance", balance, balance < 0 ? "error" : "done")],
          {
            Accepted: allowed ? "yes" : "no",
            "Invariant holds": balance >= 0 ? "yes" : "no",
          },
          ["2"],
        ),
      ];
      code =
        variant === "public"
          ? `account.balance -= ${n};`
          : "private int balance = 100;\nboolean withdraw(int amount) {\n  if (amount <= 0 || amount > balance) return false;\n  balance -= amount;\n  return true;\n}";
      break;
    }
    case "adapter-pattern": {
      const converted = (n * 9) / 5 + 32,
        actual = variant === "adapter" ? converted : n;
      nodes = flow(["Celsius source", "Adapter", "Fahrenheit client"]);
      edges = [
        ["0", "1"],
        ["1", "2"],
      ];
      frames = [
        f(
          "Read the existing interface",
          `The source reports ${n} degrees Celsius.`,
          [c("source", "Celsius", n)],
          {},
          ["0"],
        ),
        f(
          variant === "adapter"
            ? "Translate the units"
            : "Forward without translation",
          variant === "adapter"
            ? `${n} × 9/5 + 32 = ${converted}.`
            : "The numeric type matches, but the unit meaning does not.",
          [
            c("expected", "Expected Fahrenheit", converted),
            c(
              "actual",
              "Returned number",
              actual,
              variant === "adapter" ? "done" : "error",
            ),
          ],
          {},
          ["1"],
        ),
        f(
          "Client receives the result",
          variant === "adapter"
            ? "The adapter satisfies the Fahrenheit contract."
            : "The client interprets a Celsius number as Fahrenheit: a contract violation.",
          [c("client", "Client Fahrenheit", actual)],
          { "Contract satisfied": actual === converted ? "yes" : "no" },
          ["2"],
        ),
      ];
      code =
        variant === "adapter"
          ? "class FahrenheitAdapter implements FahrenheitSource {\n  CelsiusSource source;\n  double readFahrenheit() {\n    return source.readCelsius() * 9.0 / 5.0 + 32;\n  }\n}"
          : "double readFahrenheit() {\n  return source.readCelsius(); // incorrect unit\n}";
      break;
    }
    case "decorator-pattern": {
      const order =
        variant === "compress-encrypt"
          ? ["Compress", "Encrypt"]
          : ["Encrypt", "Compress"];
      nodes = flow(["Plain payload", ...order, "Output"]);
      edges = [
        ["0", "1"],
        ["1", "2"],
        ["2", "3"],
      ];
      let size = n,
        encrypted = false;
      frames = [
        f(
          "Start with plaintext",
          "The payload begins as compressible bytes.",
          [c("bytes", "Bytes", size)],
          {},
          ["0"],
        ),
      ];
      order.forEach((op, i) => {
        const before = size;
        if (op === "Encrypt") {
          encrypted = true;
          size += 16;
        } else if (!encrypted) size = Math.ceil(size / 2);
        frames.push(
          f(
            `Wrapper ${i + 1} · ${op}`,
            op === "Encrypt"
              ? `Add 16 bytes of illustrative encryption overhead: ${before} → ${size}.`
              : encrypted
                ? "The input is encrypted, so this toy compressor does not shrink it."
                : `Halve the plaintext size, rounding up: ${before} → ${size}.`,
            [
              c("bytes", "Bytes", size, "active"),
              c("encrypted", "Encrypted", encrypted ? "yes" : "no"),
            ],
            {},
            [String(i + 1)],
          ),
        );
      });
      frames.push(
        f(
          "Write the output",
          "Both wrappers preserve the writer interface, but their order changes the final representation.",
          [c("bytes", "Final bytes", size, "done")],
          { "Input bytes": n, "Output bytes": size },
          ["3"],
        ),
      );
      code = `Writer pipeline = ${variant === "compress-encrypt" ? "new Compress(new Encrypt(new Sink()))" : "new Encrypt(new Compress(new Sink()))"};\npipeline.write(message);\n// Each wrapper transforms before delegating.`;
      break;
    }
  }
  if (id === "congestion-control")
    frames.forEach((item, i) => {
      item.chart = {
        values: frames.slice(0, i + 1).map((f) => Number(f.cells[0].value)),
        limit: n,
      };
    });
  return {
    frames,
    nodes,
    edges,
    code,
    assumptions,
    undirected: id === "shortest-routing",
  };
}
