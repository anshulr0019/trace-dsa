import type { Module } from "./catalog";
export type Cell = {
  id: string;
  label: string;
  value: string | number;
  tone?: "active" | "waiting" | "done" | "error";
};
export type DiagramNode = {
  id: string;
  label: string;
  x: number;
  y: number;
  role?: string;
};
export type Frame = {
  title: string;
  explanation: string;
  active: string[];
  cells: Cell[];
  metrics: Record<string, string | number>;
  table?: { columns: string[]; rows: (string | number)[][] };
  timeline?: string[];
};
export type LabResult = {
  frames: Frame[];
  nodes: DiagramNode[];
  edges: [string, string][];
  code: string;
  assumptions: string;
  error?: string;
};
export type Settings = {
  bursts: string;
  quantum: number;
  policy: string;
  pages: string;
  slots: number;
  pagePolicy: string;
  join: string;
  minimum: number;
  target: number;
  amount: number;
  fail: boolean;
  safe: boolean;
  warm: boolean;
  reuse: boolean;
  drop: number;
  discount: string;
  price: number;
  quantity: number;
  subscribers: string[];
  channel: string;
  instructor: string;
  normalized: boolean;
};
export const defaultSettings: Settings = {
  bursts: "5,3,1",
  quantum: 2,
  policy: "FCFS",
  pages: "1,2,3,1,4,2",
  slots: 3,
  pagePolicy: "FIFO",
  join: "LEFT",
  minimum: 0,
  target: 15,
  amount: 30,
  fail: false,
  safe: true,
  warm: false,
  reuse: false,
  drop: 2,
  discount: "percent",
  price: 100,
  quantity: 2,
  subscribers: ["chart", "alert", "audit"],
  channel: "email",
  instructor: "Dr. Rao",
  normalized: true,
};
export const frame = (
  title: string,
  explanation: string,
  active: string[] = [],
  cells: Cell[] = [],
  metrics: Frame["metrics"] = {},
): Frame => ({ title, explanation, active, cells, metrics });
const cell = (
  id: string,
  label: string,
  value: string | number,
  tone?: Cell["tone"],
): Cell => ({ id, label, value, tone });
const sequence = (raw: string, maxLength = 20, maxValue = 30) => {
  const values = raw.split(",").map((s) => Number(s.trim()));
  if (
    !raw.trim() ||
    raw.split(",").some((s) => !s.trim()) ||
    values.length > maxLength ||
    values.some((v) => !Number.isInteger(v) || v < 1 || v > maxValue)
  )
    throw new Error(
      `Enter 1–${maxLength} comma-separated whole numbers, each from 1 to ${maxValue}.`,
    );
  return values;
};
const number = (v: number, min: number, max: number) => {
  if (!Number.isFinite(v) || v < min || v > max)
    throw new Error(`Choose a value between ${min} and ${max}.`);
  return v;
};
const customers = [
  [1, "Asha"],
  [2, "Ben"],
  [3, "Chen"],
  [4, "Dia"],
] as const;
const orders = [
  [101, 1, 80],
  [102, 1, 150],
  [103, 2, 40],
  [104, 4, 200],
];
export function simulateJoin(join: string, minimum: number): Frame[] {
  const frames: Frame[] = [],
    rows: (string | number)[][] = [];
  for (const [id, name] of customers) {
    const matched = orders.filter((o) => o[1] === id);
    const added: (string | number)[][] = matched
      .filter((o) => o[2] >= minimum)
      .map((o) => [name, o[0], o[2]]);
    if (!matched.length && join === "LEFT" && minimum === 0)
      added.push([name, "NULL", "NULL"]);
    rows.push(...added);
    frames.push({
      ...frame(
        `Match ${name}'s orders`,
        !matched.length
          ? minimum > 0
            ? "No matching order. The right-side WHERE condition removes this unmatched row."
            : join === "LEFT"
              ? "LEFT JOIN retains this customer with NULL order fields."
              : "INNER JOIN produces no row without a match."
          : `${matched.length} matching order(s); ${added.length} survive the amount filter.`,
        [],
        customers.map(([key, label]) =>
          cell(String(key), label, key, key === id ? "active" : undefined),
        ),
        { "Result rows": rows.length },
      ),
      table: {
        columns: ["Customer", "Order", "Amount"],
        rows: rows.map((r) => [...r]),
      },
    });
  }
  return frames;
}
export function simulateSchedule(
  bursts: number[],
  policy: string,
  quantum: number,
): Frame[] {
  const remaining = [...bursts],
    queue = bursts.map((_, i) => i),
    finished: number[] = [],
    timeline: string[] = [],
    frames: Frame[] = [];
  if (policy === "SJF") queue.sort((a, b) => bursts[a] - bursts[b] || a - b);
  while (queue.length) {
    const id = queue.shift()!,
      turn = policy === "RR" ? Math.min(quantum, remaining[id]) : remaining[id];
    for (let t = 0; t < turn; t++) {
      remaining[id]--;
      timeline.push(`P${id + 1}`);
      if (remaining[id] === 0) finished[id] = timeline.length;
      frames.push({
        ...frame(
          `CPU → P${id + 1}`,
          remaining[id] === 0
            ? `P${id + 1} finishes at t=${timeline.length}.`
            : policy === "RR"
              ? `This turn uses ${t + 1} of up to ${quantum} time units.`
              : "This process keeps the CPU until its burst finishes.",
          [],
          remaining.map((n, i) =>
            cell(
              String(i),
              `P${i + 1}`,
              `${n} remaining`,
              i === id ? "active" : n === 0 ? "done" : "waiting",
            ),
          ),
          {
            Time: timeline.length,
            Completed: remaining.filter((n) => n === 0).length,
          },
        ),
        timeline: [...timeline],
      });
    }
    if (remaining[id] > 0) queue.push(id);
  }
  const waiting = finished.map((end, i) => end - bursts[i]);
  frames.push({
    ...frame(
      "Compare waiting time",
      "All arrivals are at time zero. Waiting time = completion time − CPU burst. Response time and waiting time are different measures.",
      [],
      waiting.map((n, i) => cell(String(i), `P${i + 1} wait`, n, "done")),
      {
        "Average wait": (
          waiting.reduce((a, b) => a + b, 0) / bursts.length
        ).toFixed(2),
        "Total CPU time": timeline.length,
      },
    ),
    timeline,
  });
  return frames;
}
export function simulatePages(
  pages: number[],
  slots: number,
  policy: string,
): Frame[] {
  const resident: number[] = [],
    loaded: number[] = [],
    used = new Map<number, number>();
  let faults = 0,
    hits = 0;
  return pages.map((page, t) => {
    let message: string, evicted: number | undefined;
    if (resident.includes(page)) {
      hits++;
      message = `Page ${page} is already resident. ${policy === "LRU" ? "Refresh its access recency." : "FIFO loading order stays unchanged."}`;
    } else {
      faults++;
      if (resident.length === slots) {
        evicted =
          policy === "FIFO"
            ? loaded.shift()
            : resident.reduce((a, b) =>
                (used.get(a) ?? 0) < (used.get(b) ?? 0) ? a : b,
              );
        resident[resident.indexOf(evicted!)] = page;
        const li = loaded.indexOf(evicted!);
        if (li >= 0) loaded.splice(li, 1);
      } else resident.push(page);
      loaded.push(page);
      message = `Page fault: load ${page}${evicted !== undefined ? ` after evicting ${evicted}` : ""}.`;
    }
    used.set(page, t);
    return {
      ...frame(
        `Access ${t + 1}: page ${page}`,
        message,
        [],
        Array.from({ length: slots }, (_, i) =>
          cell(
            String(i),
            `Frame ${i}`,
            resident[i] ?? "empty",
            resident[i] === page ? "active" : undefined,
          ),
        ),
        { Hits: hits, Faults: faults, Evicted: evicted ?? "none" },
      ),
      timeline: pages.slice(0, t + 1).map(String),
    };
  });
}
function transaction(s: Settings): Frame[] {
  const amount = number(s.amount, 1, 100);
  const balances = [100, 50];
  const cells = (a: number, b: number) => [
    cell("a", "Committed A", balances[0]),
    cell("b", "Committed B", balances[1]),
    cell("sa", "Staged A", a, "active"),
    cell("sb", "Staged B", b, "active"),
  ];
  return [
    frame(
      "BEGIN",
      "Start a transaction with a private staged balance snapshot.",
      [],
      cells(100, 50),
    ),
    frame(
      "Stage the debit",
      `Subtract ${amount} from the staged A balance. Committed balances have not changed.`,
      [],
      cells(100 - amount, 50),
    ),
    s.fail
      ? frame(
          "ROLLBACK",
          "An injected failure discards the debit. Both committed balances stay unchanged.",
          [],
          [
            cell("a", "Committed A", 100, "done"),
            cell("b", "Committed B", 50, "done"),
          ],
          { "Committed total": 150 },
        )
      : frame(
          "Stage the credit",
          `Add ${amount} to B in the same transaction.`,
          [],
          cells(100 - amount, 50 + amount),
        ),
    ...(s.fail
      ? []
      : [
          frame(
            "COMMIT",
            "Publish both changes together. This model does not simulate database locks, isolation levels or crash recovery.",
            [],
            [
              cell("a", "Committed A", 100 - amount, "done"),
              cell("b", "Committed B", 50 + amount, "done"),
            ],
            { "Committed total": 150 },
          ),
        ]),
  ];
}
function indexTrace(target: number): Frame[] {
  const keys = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29];
  let lo = 0,
    hi = keys.length - 1,
    comparisons = 0;
  const frames: Frame[] = [];
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    comparisons++;
    frames.push(
      frame(
        `Inspect index entry ${mid}`,
        `${keys[mid]} ${keys[mid] === target ? "matches" : keys[mid] < target ? "is below" : "is above"} target ${target}. ${keys[mid] === target ? "Follow the index reference to the row." : keys[mid] < target ? "Keep the higher half." : "Keep the lower half."}`,
        [],
        keys.map((n, i) =>
          cell(
            String(i),
            `Entry ${i}`,
            n,
            i === mid ? "active" : i < lo || i > hi ? "done" : undefined,
          ),
        ),
        { "Index comparisons": comparisons, Target: target },
      ),
    );
    if (keys[mid] === target) break;
    if (keys[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  const scan = keys.includes(target) ? keys.indexOf(target) + 1 : keys.length;
  frames.push(
    frame(
      keys.includes(target) ? "Row found" : "Key absent",
      "Compare entry inspections for this toy sorted index and a sequential scan. Actual database cost also depends on pages, caching and row lookups.",
      [],
      [
        cell("scan", "Sequential scan", scan),
        cell("index", "Sorted index", comparisons, "done"),
      ],
      { "Saved inspections": scan - comparisons },
    ),
  );
  return frames;
}
function normalization(s: Settings): Frame[] {
  const name = s.instructor.trim() || "Dr. Rao";
  const base = [
    ["Asha", "CS101", "Dr. Sen"],
    ["Ben", "CS101", "Dr. Sen"],
    ["Chen", "CS202", "Dr. Lee"],
  ];
  return [
    {
      ...frame(
        "Find the duplicated fact",
        "CS101’s instructor appears once for each enrollment. Updating only one copy creates conflicting answers.",
      ),
      table: { columns: ["Student", "Course", "Instructor"], rows: base },
    },
    {
      ...frame(
        s.normalized
          ? "Update the course table once"
          : "Update just one duplicated enrollment",
        s.normalized
          ? "The course record changes once; every enrollment still refers to CS101."
          : "The first enrollment changes, but the second still says Dr. Sen. The data now disagrees.",
        [],
        [],
        { "Rows updated": 1 },
      ),
      table: {
        columns: s.normalized
          ? ["Course", "Instructor"]
          : ["Student", "Course", "Instructor"],
        rows: s.normalized
          ? [
              ["CS101", name],
              ["CS202", "Dr. Lee"],
            ]
          : [["Asha", "CS101", name], ...base.slice(1)],
      },
    },
    {
      ...frame(
        s.normalized
          ? "Join the normalized facts"
          : "Observe the update anomaly",
        s.normalized
          ? "Joining course facts to enrollments reconstructs a consistent view."
          : "Repair requires updating every duplicate. A course table removes the repeated fact.",
        [],
        [],
        { Consistent: s.normalized ? "yes" : "no" },
      ),
      table: {
        columns: ["Student", "Course", "Instructor"],
        rows: s.normalized
          ? [["Asha", "CS101", name], ["Ben", "CS101", name], base[2]]
          : [["Asha", "CS101", name], ...base.slice(1)],
      },
    },
  ];
}
const lineNodes = (names: string[]) =>
  names.map((label, i) => ({
    id: String(i),
    label,
    x: 10 + (i % 4) * 26,
    y: 25 + Math.floor(i / 4) * 45,
  }));
const chain = (nodes: DiagramNode[]): [string, string][] =>
  nodes.slice(1).map((n, i) => [nodes[i].id, n.id]);
function network(m: Module, s: Settings): LabResult {
  let nodes: DiagramNode[],
    frames: Frame[] = [];
  let code = "";
  const assumptions =
    "Illustrated protocol events. Durations, encryption and network I/O are not executed.";
  if (m.id === "dns-lookup") {
    nodes = lineNodes([
      "Client",
      "Recursive resolver",
      "Root server",
      "TLD server",
      "Authoritative server",
    ]);
    const events = s.warm
      ? [
          [
            0,
            "Ask for example.com",
            "The client sends a DNS question to its recursive resolver.",
          ],
          [
            1,
            "Use a valid cached record",
            "The resolver returns its cached address without querying root, TLD or authoritative servers.",
          ],
          [
            0,
            "Receive the address",
            "The client can now connect to the address.",
          ],
        ]
      : [
          [
            0,
            "Ask for example.com",
            "The client asks its recursive resolver for an address.",
          ],
          [
            1,
            "Start recursive resolution",
            "The resolver performs the upstream lookup on behalf of the client.",
          ],
          [
            2,
            "Find the TLD authority",
            "The root returns a referral toward the .com servers.",
          ],
          [
            3,
            "Find the domain authority",
            "The TLD returns the authoritative nameserver for example.com.",
          ],
          [
            4,
            "Read the address record",
            "The authoritative server returns the requested record and TTL.",
          ],
          [
            1,
            "Cache the answer",
            "The resolver may reuse the answer until its TTL expires.",
          ],
          [
            0,
            "Receive the address",
            "The client receives the answer from its resolver.",
          ],
        ];
    frames = events.map(([id, title, why]) =>
      frame(String(title), String(why), [String(id)], [], {
        "Upstream queries": s.warm ? 0 : 3,
      }),
    );
    code =
      'resolve("example.com")\nif cache.hasValidRecord(name): return cache[name]\nauthority = followReferrals(root, tld, domain)\nanswer, ttl = authority.lookup(name)\ncache.store(name, answer, ttl)\nreturn answer';
  } else if (m.id === "https-journey") {
    nodes = lineNodes(["Browser", "DNS resolver", "Web server", "Application"]);
    const events = s.reuse
      ? [
          [
            0,
            "Reuse an encrypted connection",
            "An existing valid TLS connection is available. DNS, TCP and TLS setup need not be repeated.",
          ],
          [
            2,
            "Send HTTP request",
            "Send the encrypted GET / request through the existing connection.",
          ],
          [3, "Build a response", "The application processes the request."],
          [
            0,
            "Receive HTTP response",
            "The browser receives the encrypted response and interprets its status, headers and body.",
          ],
        ]
      : [
          [1, "Resolve the name", "Resolve the host to an IP address."],
          [
            2,
            "Establish TCP",
            "Exchange SYN, SYN-ACK and ACK to establish the connection.",
          ],
          [
            2,
            "Establish TLS",
            "Authenticate the server and agree on encryption parameters.",
          ],
          [
            2,
            "Send HTTP request",
            "The browser sends an HTTP request protected by TLS.",
          ],
          [
            3,
            "Build a response",
            "The application produces response status, headers and body.",
          ],
          [
            0,
            "Receive HTTP response",
            "The browser reads the response and may request more resources.",
          ],
        ];
    frames = events.map(([id, title, why]) =>
      frame(String(title), String(why), [String(id)]),
    );
    code =
      'address = resolve(host)\nconnection = tcp.connect(address, 443)\nsecure = tls.handshake(connection, host)\nsecure.write("GET / HTTP/1.1")\nresponse = secure.read()';
  } else {
    nodes = lineNodes(["Sender", "Network", "Receiver"]);
    let delivered = 0,
      transmissions = 0;
    for (let segment = 1; segment <= 4; segment++) {
      const seq = (segment - 1) * 100;
      transmissions++;
      frames.push(
        frame(
          `Send bytes ${seq}–${seq + 99}`,
          "One segment is in flight in this simplified trace.",
          ["0"],
          [],
          { Transmissions: transmissions, "Delivered bytes": delivered },
        ),
      );
      if (s.drop === segment) {
        frames.push(
          frame(
            "Segment lost",
            "The receiver receives no new bytes; the sender eventually times out.",
            ["1"],
            [],
            { "Next expected byte": delivered },
          ),
        );
        transmissions++;
        frames.push(
          frame(
            `Retransmit bytes ${seq}–${seq + 99}`,
            "Retry the same byte positions, using the same sequence number.",
            ["0"],
            [],
            { Transmissions: transmissions },
          ),
        );
      }
      delivered += 100;
      frames.push(
        frame(
          `ACK ${delivered}`,
          "The receiver acknowledges the next expected byte. The acknowledged bytes have been delivered once.",
          ["2"],
          [],
          {
            "Delivered bytes": delivered,
            "Next expected byte": delivered,
            Transmissions: transmissions,
          },
        ),
      );
    }
    code =
      "seq = 0\nfor segment in segments:\n    send(segment, seq)\n    if acknowledgment_times_out():\n        send(segment, seq)  // same bytes\n    await_ack(seq + segment.length)\n    seq += segment.length";
  }
  return {
    frames,
    nodes,
    edges:
      m.id === "dns-lookup"
        ? [
            ["0", "1"],
            ["1", "2"],
            ["1", "3"],
            ["1", "4"],
          ]
        : chain(nodes),
    code,
    assumptions,
  };
}
export function buildLab(m: Module, s: Settings): LabResult {
  let frames: Frame[] = [],
    nodes: DiagramNode[] = [],
    edges: [string, string][] = [],
    code = "",
    assumptions =
      "A deterministic teaching model. Change the controls and replay to compare outcomes.";
  try {
    switch (m.kind) {
      case "sql":
        number(s.minimum, 0, 250);
        frames = simulateJoin(s.join, s.minimum);
        code = `SELECT c.name, o.id, o.amount\nFROM customers c\n${s.join} JOIN orders o ON o.customer_id = c.id${s.minimum > 0 ? `\nWHERE o.amount >= ${s.minimum}` : ""};`;
        assumptions =
          "A guided query builder over four customers and four orders. It is not a general SQL server.";
        break;
      case "index":
        frames = indexTrace(number(s.target, 0, 30));
        code = `SELECT * FROM customers WHERE id = ${s.target};\n\n// Teaching index: sorted keys → row references\nwhile low <= high:\n    mid = (low + high) // 2\n    compare(keys[mid], target)\n    discard_the_wrong_half()`;
        break;
      case "transaction":
        frames = transaction(s);
        code = `BEGIN;\nUPDATE accounts SET balance = balance - ${s.amount} WHERE id = 'A';\nUPDATE accounts SET balance = balance + ${s.amount} WHERE id = 'B';\n${s.fail ? "ROLLBACK; -- injected failure" : "COMMIT;"}`;
        break;
      case "normalization":
        frames = normalization(s);
        code =
          "courses(course_id PRIMARY KEY, instructor)\nenrollments(student_id, course_id REFERENCES courses)\n\nSELECT e.student_id, c.instructor\nFROM enrollments e JOIN courses c\nON e.course_id = c.course_id;";
        break;
      case "scheduler":
        frames = simulateSchedule(
          sequence(s.bursts, 8, 12),
          s.policy,
          Math.round(number(s.quantum, 1, 6)),
        );
        code =
          s.policy === "RR"
            ? "while readyQueue is not empty:\n    p = readyQueue.removeFirst()\n    run(p, min(quantum, p.remaining))\n    if p.remaining > 0: readyQueue.addLast(p)"
            : s.policy === "SJF"
              ? "sort processes by CPU burst\nfor process in sortedProcesses:\n    run process until completion"
              : "for process in arrivalOrder:\n    run process until completion";
        assumptions =
          "All processes arrive at t=0; one CPU burst per process; one CPU; no I/O or context-switch cost.";
        break;
      case "memory":
        frames = simulatePages(
          sequence(s.pages),
          Math.round(number(s.slots, 1, 5)),
          s.pagePolicy,
        );
        code = `for page in references:\n    if page is resident: record hit\n    else:\n        record page fault\n        if frames are full:\n            evict ${s.pagePolicy === "FIFO" ? "oldest loaded page" : "least recently accessed page"}\n        load page\n    ${s.pagePolicy === "LRU" ? "update access recency" : "keep loading order on a hit"}`;
        break;
      case "deadlock":
        nodes = [
          { id: "p1", label: "Process 1", x: 20, y: 25 },
          { id: "r1", label: "Resource A", x: 75, y: 25 },
          { id: "p2", label: "Process 2", x: 75, y: 75 },
          { id: "r2", label: "Resource B", x: 20, y: 75 },
        ];
        edges = [
          ["p1", "r1"],
          ["p1", "r2"],
          ["p2", "r1"],
          ["p2", "r2"],
        ];
        frames = s.safe
          ? [
              frame("P1 acquires A", "Both processes request A before B.", [
                "p1",
                "r1",
              ]),
              frame(
                "P2 waits for A",
                "P2 holds no resource while waiting; it cannot block P1 from acquiring B.",
                ["p2"],
              ),
              frame(
                "P1 acquires B, completes and releases",
                "P1 can finish its work and release both resources.",
                ["p1", "r2"],
                [],
                { Deadlocked: "no" },
              ),
              frame(
                "P2 acquires A then B",
                "P2 proceeds after P1 releases A.",
                ["p2", "r1", "r2"],
                [],
                { "Completed processes": 2 },
              ),
            ]
          : [
              frame(
                "P1 holds A; P2 holds B",
                "Opposite acquisition orders let each process hold a different resource.",
                ["p1", "r1", "p2", "r2"],
              ),
              frame("P1 requests B", "P1 waits for the resource held by P2.", [
                "p1",
                "r2",
              ]),
              frame(
                "P2 requests A",
                "P2 waits for P1. Neither process can release its held resource by completing.",
                ["p2", "r1"],
                [],
                { Deadlocked: "yes", Cycle: "P1 → P2 → P1" },
              ),
            ];
        code = s.safe
          ? "P1: lock(A); lock(B); work(); unlock(B); unlock(A);\nP2: lock(A); lock(B); work(); unlock(B); unlock(A);"
          : "P1: lock(A); wait_for(B);\nP2: lock(B); wait_for(A);";
        assumptions =
          "One instance per resource, exclusive locks, no timeout or preemption. Arrows show which resources each process may request; the current step describes ownership and waiting.";
        break;
      case "semaphore":
        frames = s.safe
          ? [
              frame(
                "P1 acquires the semaphore",
                "P2 must wait before entering the critical section.",
                [],
                [
                  cell("counter", "Shared counter", 0),
                  cell("lock", "Semaphore", "held by P1", "active"),
                ],
              ),
              frame(
                "P1 reads, increments and writes",
                "P1 changes the shared counter from 0 to 1, then releases the semaphore.",
                [],
                [cell("counter", "Shared counter", 1, "active")],
              ),
              frame(
                "P2 acquires and increments",
                "P2 reads 1 and writes 2, then releases the semaphore.",
                [],
                [cell("counter", "Shared counter", 2, "done")],
                { Expected: 2, Actual: 2 },
              ),
            ]
          : [
              frame(
                "Both processes read 0",
                "P1 and P2 each keep a local copy of the same value.",
                [],
                [
                  cell("counter", "Shared counter", 0),
                  cell("p1", "P1 local", 0),
                  cell("p2", "P2 local", 0),
                ],
              ),
              frame(
                "P1 writes 1",
                "P1 computes its local value plus one.",
                [],
                [
                  cell("counter", "Shared counter", 1, "active"),
                  cell("p2", "P2 local", 0),
                ],
              ),
              frame(
                "P2 also writes 1",
                "P2 uses its stale local value. One increment has been lost.",
                [],
                [cell("counter", "Shared counter", 1, "error")],
                { Expected: 2, Actual: 1 },
              ),
            ];
        code = s.safe
          ? "semaphore.acquire();\ntry { counter = counter + 1; }\nfinally { semaphore.release(); }"
          : "local = counter;\nlocal = local + 1;\ncounter = local;";
        break;
      case "network":
        return network(m, s);
      case "strategy": {
        const subtotal = number(s.price, 1, 1000) * number(s.quantity, 1, 10),
          total =
            s.discount === "percent"
              ? subtotal * 0.9
              : s.discount === "flat"
                ? Math.max(0, subtotal - 50)
                : subtotal;
        nodes = lineNodes([
          "Checkout",
          "PricingStrategy",
          s.discount === "percent"
            ? "TenPercentOff"
            : s.discount === "flat"
              ? "FlatDiscount"
              : "RegularPrice",
          "Quote",
        ]);
        edges = chain(nodes);
        frames = [
          frame(
            "Build the basket",
            "The caller calculates a subtotal.",
            ["0"],
            [],
            { Subtotal: subtotal },
          ),
          frame(
            "Select a strategy",
            "The selected object implements the common pricing contract.",
            ["1", "2"],
          ),
          frame(
            "Return the quote",
            "The caller receives the result without implementing the discount formula.",
            ["3"],
            [],
            {
              Subtotal: subtotal,
              Total: Number(total.toFixed(2)),
              Discount: Number((subtotal - total).toFixed(2)),
            },
          ),
        ];
        code = `interface PricingStrategy {\n  double total(double subtotal);\n}\nclass Checkout {\n  double quote(PricingStrategy pricing, double subtotal) {\n    return pricing.total(subtotal);\n  }\n}\n// Selected formula: ${s.discount === "percent" ? "subtotal * 0.9" : s.discount === "flat" ? "Math.max(0, subtotal - 50)" : "subtotal"}`;
        break;
      }
      case "observer":
        nodes = [
          { id: "publisher", label: "Publisher", x: 20, y: 50 },
          ...["chart", "alert", "audit"].map((id, i) => ({
            id,
            label: id,
            x: 75,
            y: 20 + i * 30,
          })),
        ];
        edges = s.subscribers.map((id) => ["publisher", id]);
        frames = [
          frame(
            "Publish an event",
            `Publish value ${s.price} to the current subscriber list.`,
            ["publisher"],
            [],
            { Subscribers: s.subscribers.length },
          ),
          ...s.subscribers.map((id) =>
            frame(
              `Notify ${id}`,
              `The ${id} observer receives value ${s.price}. Other observers have their own callbacks.`,
              [id],
              [],
              { "Received value": s.price },
            ),
          ),
          frame(
            "Publication complete",
            "Unsubscribed listeners received no callback.",
            [],
            [],
            { Callbacks: s.subscribers.length },
          ),
        ];
        code =
          "interface Observer { void update(int value); }\nclass Publisher {\n  List<Observer> listeners;\n  void publish(int value) {\n    for (Observer o : listeners) o.update(value);\n  }\n}";
        break;
      case "factory":
        nodes = lineNodes([
          "Client",
          "NotifierFactory",
          `${s.channel} notifier`,
          "Simulated outbox",
        ]);
        edges = chain(nodes);
        frames = [
          frame(
            "Request a notifier",
            `The client requests channel “${s.channel}”.`,
            ["0"],
          ),
          frame(
            "Create the concrete object",
            "The factory chooses the implementation and returns it through a Notifier interface.",
            ["1", "2"],
          ),
          frame(
            "Invoke the common contract",
            `send() uses the ${s.channel} implementation. This is a local simulation; no message leaves the site.`,
            ["3"],
            [],
            { Channel: s.channel, "External messages sent": 0 },
          ),
        ];
        code = `interface Notifier { void send(String message); }\nNotifier create(String channel) {\n  switch (channel) {\n    case "email": return new EmailNotifier();\n    case "sms": return new SmsNotifier();\n    case "push": return new PushNotifier();\n    default: throw new IllegalArgumentException(channel);\n  }\n}\ncreate("${s.channel}").send("Hello");`;
        break;
    }
    return { frames, nodes, edges, code, assumptions };
  } catch (error) {
    return {
      frames: [],
      nodes: [],
      edges: [],
      code,
      assumptions,
      error: error instanceof Error ? error.message : "Invalid input",
    };
  }
}
export const sampleTables = { customers, orders };
