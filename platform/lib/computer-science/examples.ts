import type { Module } from "./catalog";
import { defaultSettings, type Settings } from "./models";
import { architectureTemplate, type Architecture } from "./architecture";
import { deepSpecs } from "./deeper-catalog";
export type LessonScenario = { settings: Settings; architecture: Architecture };
export function initialScenario(id: string): LessonScenario {
  const spec = deepSpecs[id];
  return {
    settings: {
      ...defaultSettings,
      ...(spec ? { quantity: spec.initial, variant: spec.variants[0][0] } : {}),
    },
    architecture: architectureTemplate(id),
  };
}
const changes: Record<string, [string, string, Partial<Settings>][]> = {
  "sql-joins": [
    [
      "Keep unmatched rows",
      "LEFT JOIN preserves the customer with no order.",
      { join: "LEFT", minimum: 0 },
    ],
    [
      "Only matching rows",
      "INNER JOIN excludes unmatched customers.",
      { join: "INNER", minimum: 0 },
    ],
    [
      "Filter after joining",
      "WHERE removes NULL order rows and smaller orders.",
      { join: "LEFT", minimum: 100 },
    ],
  ],
  "database-index": [
    [
      "Middle key",
      "Find a key near the middle of the sorted index.",
      { target: 15 },
    ],
    [
      "Last key",
      "Compare a late scan match with binary search.",
      { target: 29 },
    ],
    [
      "Missing key",
      "A failed lookup must also terminate correctly.",
      { target: 14 },
    ],
  ],
  transactions: [
    [
      "Commit both changes",
      "The debit and credit commit together.",
      { amount: 30, fail: false },
    ],
    [
      "Roll back after debit",
      "An injected failure leaves both committed balances intact.",
      { amount: 30, fail: true },
    ],
    [
      "Move the full balance",
      "A larger valid transfer still preserves the total.",
      { amount: 100, fail: false },
    ],
  ],
  normalization: [
    [
      "Update one course fact",
      "Normalized data stores the instructor once.",
      { normalized: true, instructor: "Dr. Rao" },
    ],
    [
      "Partial duplicate update",
      "An unnormalized update can leave conflicting copies.",
      { normalized: false, instructor: "Dr. Rao" },
    ],
    [
      "Another instructor",
      "Reconstruct enrollments using the updated course fact.",
      { normalized: true, instructor: "Dr. Park" },
    ],
  ],
  "cpu-scheduling": [
    [
      "Arrival order",
      "All jobs arrive at t=0; run them in list order.",
      { bursts: "5,3,1", policy: "FCFS" },
    ],
    [
      "Shortest job first",
      "The same work completes in a different order.",
      { bursts: "5,3,1", policy: "SJF" },
    ],
    [
      "Share the CPU",
      "Round robin rotates in two-unit time slices.",
      { bursts: "5,3,1", policy: "RR", quantum: 2 },
    ],
  ],
  "page-replacement": [
    [
      "FIFO loading order",
      "Page hits do not refresh loading age.",
      { pages: "1,2,3,1,4", slots: 3, pagePolicy: "FIFO" },
    ],
    [
      "LRU access recency",
      "A hit protects the recently accessed page.",
      { pages: "1,2,3,1,4", slots: 3, pagePolicy: "LRU" },
    ],
    [
      "Less memory",
      "Repeat with only two frames.",
      { pages: "1,2,3,1,4", slots: 2, pagePolicy: "LRU" },
    ],
  ],
  deadlocks: [
    [
      "Consistent lock order",
      "Both processes acquire A before B.",
      { safe: true },
    ],
    ["Circular wait", "Opposite orders can deadlock.", { safe: false }],
    [
      "Break the cycle",
      "Return to a global order and explain why it helps.",
      { safe: true },
    ],
  ],
  synchronization: [
    [
      "Protected increment",
      "A binary semaphore guards the critical section.",
      { safe: true },
    ],
    [
      "Lost update",
      "Two unprotected reads can overwrite one increment.",
      { safe: false },
    ],
    [
      "Restore mutual exclusion",
      "Only one process performs the read-modify-write at a time.",
      { safe: true },
    ],
  ],
  "dns-lookup": [
    ["Cold cache", "Resolve through root, TLD and authority.", { warm: false }],
    ["Warm cache", "Use a still-valid cached record.", { warm: true }],
    ["After expiry", "Treat the expired entry as a miss.", { warm: false }],
  ],
  "https-journey": [
    [
      "New connection",
      "Resolve, connect, negotiate TLS, then send HTTP.",
      { reuse: false },
    ],
    [
      "Connection reuse",
      "Reuse an already established TLS connection.",
      { reuse: true },
    ],
    [
      "Connect again",
      "A closed connection needs a new handshake.",
      { reuse: false },
    ],
  ],
  "tcp-retries": [
    [
      "Reliable delivery",
      "All four segments arrive on their first attempt.",
      { drop: 0 },
    ],
    [
      "Middle segment lost",
      "Retry segment 2 using the same byte positions.",
      { drop: 2 },
    ],
    [
      "Final segment lost",
      "The transfer is incomplete until the last segment arrives.",
      { drop: 4 },
    ],
  ],
  "strategy-pattern": [
    [
      "Regular pricing",
      "Apply no discount.",
      { price: 100, quantity: 2, discount: "regular" },
    ],
    [
      "Percentage discount",
      "Subtract 10% from the same basket.",
      { price: 100, quantity: 2, discount: "percent" },
    ],
    [
      "Flat discount",
      "Compare a fixed discount with the percentage strategy.",
      { price: 100, quantity: 2, discount: "flat" },
    ],
  ],
  "observer-pattern": [
    [
      "All listeners",
      "Publish to three subscribers.",
      { subscribers: ["chart", "alert", "audit"] },
    ],
    [
      "Unsubscribe alert",
      "Only chart and audit receive the event.",
      { subscribers: ["chart", "audit"] },
    ],
    [
      "No listeners",
      "Publication completes without callbacks.",
      { subscribers: [] },
    ],
  ],
  "factory-pattern": [
    [
      "Email notifier",
      "The factory selects the email implementation.",
      { channel: "email" },
    ],
    ["SMS notifier", "The client contract stays the same.", { channel: "sms" }],
    [
      "Push notifier",
      "Construction changes behind the factory.",
      { channel: "push" },
    ],
  ],
};
export function examplesFor(
  m: Module,
): { title: string; why: string; scenario: LessonScenario }[] {
  const spec = deepSpecs[m.id];
  if (spec)
    return spec.examples.map((e) => ({
      title: e.title,
      why: e.why,
      scenario: {
        ...initialScenario(m.id),
        settings: {
          ...initialScenario(m.id).settings,
          quantity: e.quantity,
          variant: e.variant,
        },
      },
    }));
  if (m.kind === "architecture") {
    const base = initialScenario(m.id),
      burst = initialScenario(m.id),
      failed = initialScenario(m.id);
    burst.architecture.traffic = 300;
    failed.architecture.nodes = failed.architecture.nodes.map((n) => ({
      ...n,
      failed: n.role === "database" || n.role === "external",
    }));
    return [
      {
        title: "Normal traffic",
        why: "Follow the default request path and observe its capacity.",
        scenario: base,
      },
      {
        title: "Traffic burst",
        why: "Triple-digit arrivals expose the slowest required stage.",
        scenario: burst,
      },
      {
        title: "Destination outage",
        why: "Make the destination unavailable; compare rejection with queueing.",
        scenario: failed,
      },
    ];
  }
  return (changes[m.id] ?? []).map(([title, why, settings]) => ({
    title,
    why,
    scenario: {
      ...initialScenario(m.id),
      settings: { ...defaultSettings, ...settings },
    },
  }));
}
