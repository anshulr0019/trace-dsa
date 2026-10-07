import { modules, type TopicId } from "./catalog";
export const stages = [
  {
    id: "foundations",
    title: "01 · Foundations",
    description: "Understand the state, vocabulary, and basic rules.",
  },
  {
    id: "applied",
    title: "02 · Apply the concept",
    description: "Change inputs and compare how the mechanism behaves.",
  },
  {
    id: "tradeoffs",
    title: "03 · Trade-offs & failures",
    description: "Investigate limits, failure cases, and design choices.",
  },
] as const;
export type Stage = (typeof stages)[number]["id"];
const paths: Record<Exclude<TopicId, "interviews">, string[][]> = {
  "system-design": [
    ["request-journey", "load-balancing"],
    ["cache-invalidation", "rate-limiting", "replication-lag"],
    ["url-shortener", "chat-service", "notifications", "news-feed"],
  ],
  databases: [
    ["sql-joins", "sql-aggregation"],
    ["database-index", "composite-index", "normalization"],
    ["transactions", "transaction-isolation"],
  ],
  "operating-systems": [
    ["cpu-scheduling", "virtual-memory"],
    ["page-replacement", "disk-scheduling"],
    ["synchronization", "bounded-buffer", "deadlocks"],
  ],
  networks: [
    ["dns-lookup", "https-journey"],
    ["tcp-retries", "sliding-window-network"],
    ["shortest-routing", "congestion-control"],
  ],
  oop: [
    ["encapsulation", "strategy-pattern"],
    ["adapter-pattern", "factory-pattern"],
    ["observer-pattern", "decorator-pattern"],
  ],
};
export function trackModules(topic: TopicId) {
  return topic === "interviews"
    ? []
    : paths[topic].flat().map((id) => modules.find((m) => m.id === id)!);
}
export function stageFor(id: string): Stage {
  for (const path of Object.values(paths)) {
    const idx = path.findIndex((group) => group.includes(id));
    if (idx >= 0) return stages[idx].id;
  }
  return "foundations";
}
export function neighbors(id: string) {
  const m = modules.find((m) => m.id === id);
  if (!m) return {};
  const path = trackModules(m.topic),
    idx = path.findIndex((m) => m.id === id);
  return { previous: path[idx - 1], next: path[idx + 1] };
}
