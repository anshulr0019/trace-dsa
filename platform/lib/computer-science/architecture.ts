import { frame, type Frame, type DiagramNode } from "./models";
export const componentRoles = [
  "client",
  "gateway",
  "server",
  "cache",
  "database",
  "queue",
  "worker",
  "external",
] as const;
export type Role = (typeof componentRoles)[number];
export type Component = DiagramNode & { role: Role; failed: boolean };
export type Architecture = {
  nodes: Component[];
  edges: [string, string][];
  traffic: number;
  hitRate: number;
  backlog: number;
};
export const capacities: Record<Role, number> = {
  client: 1000000,
  gateway: 1000,
  server: 150,
  cache: 1000,
  database: 80,
  queue: 1000,
  worker: 100,
  external: 120,
};
export function architectureTemplate(id: string): Architecture {
  const roles: Role[] =
    id === "chat-service"
      ? ["client", "gateway", "server", "queue", "worker", "database"]
      : id === "notifications"
        ? ["client", "server", "queue", "worker", "external"]
        : ["url-shortener", "news-feed"].includes(id)
          ? ["client", "gateway", "server", "cache", "database"]
          : ["client", "gateway", "server", "database"];
  const labels: Record<Role, string> = {
    client: "Client",
    gateway: "Load balancer",
    server: "Application",
    cache: "Read cache",
    database: "Database",
    queue: "Job queue",
    worker: "Worker",
    external: "Delivery provider",
  };
  const nodes = roles.map((role, i) => ({
    id: `${role}-1`,
    label: labels[role],
    role,
    x: 12 + (Math.floor(i / 3) % 2 ? 2 - (i % 3) : i % 3) * 37,
    y: 22 + Math.floor(i / 3) * 54,
    failed: false,
  }));
  return {
    nodes,
    edges: nodes.slice(1).map((node, i) => [nodes[i].id, node.id]),
    traffic: 120,
    hitRate: roles.includes("cache") ? 70 : 0,
    backlog: 0,
  };
}
export function validArchitecture(value: unknown): value is Architecture {
  if (!value || typeof value !== "object") return false;
  const v = value as Architecture;
  return (
    Array.isArray(v.nodes) &&
    v.nodes.length <= 16 &&
    v.nodes.length > 0 &&
    v.nodes.every(
      (n) =>
        n &&
        typeof n.id === "string" &&
        n.id.length < 80 &&
        typeof n.label === "string" &&
        n.label.length < 60 &&
        componentRoles.includes(n.role) &&
        Number.isFinite(n.x) &&
        n.x >= 5 &&
        n.x <= 95 &&
        Number.isFinite(n.y) &&
        n.y >= 10 &&
        n.y <= 90 &&
        typeof n.failed === "boolean",
    ) &&
    new Set(v.nodes.map((n) => n.id)).size === v.nodes.length &&
    Array.isArray(v.edges) &&
    v.edges.length <= 64 &&
    v.edges.every(
      (e) =>
        Array.isArray(e) &&
        e.length === 2 &&
        e.every((id) => v.nodes.some((n) => n.id === id)),
    ) &&
    Number.isFinite(v.traffic) &&
    v.traffic >= 0 &&
    v.traffic <= 1000 &&
    Number.isFinite(v.hitRate) &&
    v.hitRate >= 0 &&
    v.hitRate <= 95 &&
    Number.isFinite(v.backlog) &&
    v.backlog >= 0 &&
    v.backlog <= 2000
  );
}
function reachable(
  start: string,
  edges: [string, string][],
  allowed: Set<string>,
): Set<string> {
  const seen = new Set<string>(),
    pending = [start];
  while (pending.length) {
    const id = pending.shift()!;
    if (seen.has(id) || !allowed.has(id)) continue;
    seen.add(id);
    for (const [a, b] of edges) if (a === id) pending.push(b);
  }
  return seen;
}
function findPath(
  start: string,
  target: Set<string>,
  edges: [string, string][],
  allowed: Set<string>,
): string[] {
  const pending = [[start]],
    seen = new Set<string>();
  while (pending.length) {
    const path = pending.shift()!,
      id = path.at(-1)!;
    if (seen.has(id) || !allowed.has(id)) continue;
    seen.add(id);
    if (target.has(id)) return path;
    for (const [a, b] of edges) if (a === id) pending.push([...path, b]);
  }
  return [];
}
export function simulateArchitecture(a: Architecture): {
  frames: Frame[];
  path: string[];
  capacity: number;
  queue: number;
  warning?: string;
} {
  const client = a.nodes.find((n) => n.role === "client"),
    sinks = a.nodes.filter(
      (n) => n.role === "database" || n.role === "external",
    ),
    available = new Set(a.nodes.filter((n) => !n.failed).map((n) => n.id));
  if (!client || !sinks.length)
    return {
      frames: [
        frame(
          "Complete your architecture",
          "Add a client and a database or delivery provider, then connect a directed route between them.",
        ),
      ],
      path: [],
      capacity: 0,
      queue: a.backlog,
      warning: "A client and a destination are required.",
    };
  const fromClient = reachable(client.id, a.edges, available),
    toSink = new Set(
      sinks.flatMap((n) => [
        ...reachable(
          n.id,
          a.edges.map(([x, y]) => [y, x]),
          available,
        ),
      ]),
    ),
    viable = a.nodes.filter((n) => fromClient.has(n.id) && toSink.has(n.id)),
    path = findPath(
      client.id,
      new Set(sinks.map((n) => n.id)),
      a.edges,
      available,
    );
  const queueNode = a.nodes.find(
      (n) => n.role === "queue" && fromClient.has(n.id),
    ),
    cache = viable.some((n) => n.role === "cache"),
    hit = cache ? a.hitRate / 100 : 0;
  // Aggregate equal-role capacity on viable paths; required stages share one traffic stream.
  const stages = componentRoles.filter(
    (role) =>
      role !== "client" &&
      role !== "queue" &&
      viable.some((n) => n.role === role),
  );
  const limits = stages.map((role) => ({
    role,
    capacity:
      (viable.filter((n) => n.role === role).length * capacities[role]) /
      (role === "database" ? 1 - hit : 1),
  }));
  const capacity = path.length
      ? Math.floor(Math.min(...limits.map((l) => l.capacity)))
      : 0,
    bottleneck = limits.sort((x, y) => x.capacity - y.capacity)[0];
  let queued = a.backlog,
    totalCompleted = 0,
    totalRejected = 0;
  const frames: Frame[] = path.map((id, i) =>
    frame(
      `Request → ${a.nodes.find((n) => n.id === id)!.label}`,
      i === 0
        ? "The client starts a request."
        : a.nodes.find((n) => n.id === id)?.role === "cache"
          ? `In the load model, ${a.hitRate}% of reads hit this cache; misses continue to storage.`
          : "Follow this directed connection to the next responsibility.",
      [id],
    ),
  );
  if (!path.length)
    frames.push(
      frame(
        "The required route is unavailable",
        queueNode
          ? "The ingress can still reach the queue, but the full processing route is unavailable. Accepted work waits."
          : "No available directed route reaches the destination. Requests cannot complete.",
        [],
        [],
        { Capacity: 0 },
      ),
    );
  const ingressNodes = queueNode
    ? a.nodes.filter(
        (n) =>
          fromClient.has(n.id) &&
          reachable(n.id, a.edges, available).has(queueNode.id),
      )
    : [];
  const ingressRoles = componentRoles.filter(
    (r) =>
      !["client", "cache", "database", "worker", "external"].includes(r) &&
      ingressNodes.some((n) => n.role === r),
  );
  const ingressCapacity = queueNode
    ? Math.min(
        ...ingressRoles.map(
          (r) =>
            ingressNodes.filter((n) => n.role === r).length * capacities[r],
        ),
      )
    : capacity;
  for (let second = 1; second <= 10; second++) {
    let completed = 0,
      rejected = 0,
      accepted = a.traffic;
    if (queueNode) {
      accepted = Math.min(a.traffic, ingressCapacity);
      const work = queued + accepted;
      completed = Math.min(work, capacity);
      const remaining = work - completed;
      queued = Math.min(2000, remaining);
      rejected = a.traffic - accepted + Math.max(0, remaining - 2000);
    } else {
      completed = Math.min(a.traffic, capacity);
      rejected = a.traffic - completed;
      queued = a.nodes.some((n) => n.role === "queue") ? queued : 0;
    }
    totalCompleted += completed;
    totalRejected += rejected;
    frames.push(
      frame(
        `Load simulation · second ${second}`,
        queueNode
          ? `Accepted ${accepted} arrivals, completed ${completed}, queued ${queued}. Queue capacity is 2,000 jobs; overflow is rejected.`
          : `Completed ${completed} of ${a.traffic} arrivals. Excess requests are rejected immediately in this model.`,
        path.length
          ? [path[second % path.length]]
          : queueNode
            ? [queueNode.id]
            : [],
        a.nodes
          .filter((n) => n.role !== "client")
          .map((n) => ({
            id: n.id,
            label: n.label,
            value: n.failed ? "offline" : `${capacities[n.role]}/s`,
            tone: n.failed
              ? "error"
              : n.role === bottleneck?.role
                ? "waiting"
                : undefined,
          })),
        {
          "Capacity / second": capacity,
          "Completed total": totalCompleted,
          Queued: queued,
          "Rejected total": totalRejected,
          Bottleneck: bottleneck?.role ?? "unavailable",
        },
      ),
    );
  }
  return { frames, path, capacity, queue: queued };
}
