import { deeperModules } from "./deeper-catalog";
export type TopicId =
  | "system-design"
  | "databases"
  | "operating-systems"
  | "networks"
  | "oop"
  | "interviews";
export type LabKind =
  | "deep"
  | "architecture"
  | "sql"
  | "index"
  | "transaction"
  | "normalization"
  | "scheduler"
  | "memory"
  | "deadlock"
  | "semaphore"
  | "network"
  | "strategy"
  | "observer"
  | "factory";
export type Module = {
  id: string;
  topic: TopicId;
  title: string;
  kind: LabKind;
  minutes: number;
  summary: string;
  idea: string;
  invariant: string;
  challenge: string;
  quiz: {
    question: string;
    choices: string[];
    answer: number;
    explanation: string;
  };
};
export const topics: {
  id: TopicId;
  title: string;
  subtitle: string;
  symbol: string;
}[] = [
  {
    id: "system-design",
    title: "System Design",
    subtitle: "Build an architecture. Follow a request. Find its limits.",
    symbol: "01",
  },
  {
    id: "databases",
    title: "Databases & SQL",
    subtitle: "See how rows, indexes and transactions behave.",
    symbol: "02",
  },
  {
    id: "operating-systems",
    title: "Operating Systems",
    subtitle: "Explore scheduling, memory and shared resources.",
    symbol: "03",
  },
  {
    id: "networks",
    title: "Computer Networks",
    subtitle: "Follow names, connections and packets across the network.",
    symbol: "04",
  },
  {
    id: "oop",
    title: "OOP & Design Patterns",
    subtitle: "Connect objects, responsibilities and changing behavior.",
    symbol: "05",
  },
  {
    id: "interviews",
    title: "Interview Practice",
    subtitle: "Practice explaining decisions under a time limit.",
    symbol: "06",
  },
];
const q = (
  question: string,
  choices: string[],
  answer: number,
  explanation: string,
) => ({ question, choices, answer, explanation });
export const modules: Module[] = [
  {
    id: "request-journey",
    topic: "system-design",
    kind: "architecture",
    title: "The request journey",
    minutes: 12,
    summary: "Clients, load balancers, application servers and storage.",
    idea: "A request crosses components with different responsibilities. Adding application servers helps only until another shared component becomes the bottleneck.",
    invariant:
      "Every successful route must reach its required destination through available components. Capacity estimates describe this simplified model, not a real benchmark.",
    challenge:
      "Add a second application server and connect it. Does throughput improve when the database remains at 80 requests per second?",
    quiz: q(
      "Why might doubling application servers leave throughput unchanged?",
      [
        "The client must use Java",
        "A shared database can still be the bottleneck",
        "A load balancer stores every response",
      ],
      1,
      "The slowest required stage bounds throughput. Extra application capacity cannot remove a database limit.",
    ),
  },
  {
    id: "url-shortener",
    topic: "system-design",
    kind: "architecture",
    title: "Design a URL shortener",
    minutes: 18,
    summary: "Look up a short code through a cache and durable mapping store.",
    idea: "A read cache can serve popular short-code mappings without repeating database reads. A production design also needs unique code generation, expiry rules and cache invalidation.",
    invariant:
      "The model estimates redirect reads. Creation of a new short code still needs a durable write; a cache hit does not make that write unnecessary.",
    challenge:
      "Compare 0% and 80% cache hits at 300 requests per second. Then fail the cache and observe the required route.",
    quiz: q(
      "Which operation must remain durable?",
      [
        "Creating the short-code to URL mapping",
        "Animating the request",
        "Choosing a cache color",
      ],
      0,
      "The mapping must survive process restarts; a cache can be rebuilt from durable storage.",
    ),
  },
  {
    id: "chat-service",
    topic: "system-design",
    kind: "architecture",
    title: "Design a chat service",
    minutes: 20,
    summary: "Accept messages, buffer work and persist delivery state.",
    idea: "A queue absorbs temporary bursts while workers persist messages. Real chat additionally needs connection management, per-conversation ordering, delivery acknowledgments and offline retrieval.",
    invariant:
      "Accepted into a queue does not mean delivered to a recipient. This lab models the backend message pipeline, not a WebSocket server.",
    challenge:
      "Fail the worker, run ten seconds of traffic, and inspect queued versus completed work. Restore it and lower incoming traffic to drain the queue.",
    quiz: q(
      "What does a queue acknowledgment usually establish in this model?",
      [
        "The recipient read the message",
        "The message was accepted for processing",
        "The message can never be duplicated",
      ],
      1,
      "Acceptance, persistence, delivery and read receipts are separate milestones.",
    ),
  },
  {
    id: "notifications",
    topic: "system-design",
    kind: "architecture",
    title: "Design a notification service",
    minutes: 18,
    summary: "Separate API acceptance from slow external delivery.",
    idea: "A queue lets the API accept work while workers call an external provider. Retries need limits and idempotency keys so a repeated attempt does not become an unwanted duplicate.",
    invariant:
      "The external provider has finite throughput. Buffering delays overload; it does not create unlimited capacity.",
    challenge:
      "Disable the provider, fill the queue, then restore it. Explain when you would use retries and a dead-letter queue.",
    quiz: q(
      "What helps prevent duplicate sends after a retry?",
      [
        "A larger font",
        "An idempotency key checked by the delivery workflow",
        "Removing all acknowledgments",
      ],
      1,
      "A stable operation identifier lets the receiver or workflow recognize a repeated delivery attempt.",
    ),
  },
  {
    id: "news-feed",
    topic: "system-design",
    kind: "architecture",
    title: "Design a news feed",
    minutes: 20,
    summary: "Compare cached reads with the work of rebuilding feeds.",
    idea: "Popular feed reads benefit from cached results. Fan-out on write shifts work to publication; fan-out on read shifts it to retrieval. Their suitability depends on audience size and read/write patterns.",
    invariant:
      "This lab models feed reads and cache misses. Its traffic numbers do not include fan-out write amplification or ranking costs.",
    challenge:
      "Run the same traffic with and without a warm cache. Explain why a celebrity account may need a different fan-out strategy.",
    quiz: q(
      "What does fan-out on write trade for faster reads?",
      [
        "More work and storage when publishing",
        "No need for storage",
        "Guaranteed immediate consistency everywhere",
      ],
      0,
      "Precomputing recipient feeds makes reads simpler but can multiply writes for large audiences.",
    ),
  },
  {
    id: "sql-joins",
    topic: "databases",
    kind: "sql",
    title: "Joins, one row at a time",
    minutes: 12,
    summary: "Build an INNER or LEFT JOIN and inspect matching rows.",
    idea: "A join pairs rows that satisfy a condition. A LEFT JOIN also retains unmatched rows from the left table, filling the right-side columns with NULL.",
    invariant:
      "Duplicate matches produce multiple result rows. A WHERE condition on right-side columns can remove unmatched LEFT JOIN rows.",
    challenge:
      "Choose LEFT JOIN with a minimum order of 0, then raise the minimum. Find the customer whose unmatched row disappears.",
    quiz: q(
      "A customer has two matching orders. How many joined rows are produced?",
      ["Zero", "One", "Two"],
      2,
      "Each matching pair contributes a row. A join does not automatically aggregate orders.",
    ),
  },
  {
    id: "database-index",
    topic: "databases",
    kind: "index",
    title: "Why an index saves work",
    minutes: 10,
    summary: "Compare a scan with binary search over a sorted key index.",
    idea: "An index provides another route to a row. This small sorted-array index demonstrates pruning; production databases commonly use B-tree variants and have page I/O, write and storage costs.",
    invariant:
      "The index remains sorted by key. The number of comparisons shown is not an estimate of real query latency.",
    challenge:
      "Search for the last key, then for a missing key. Compare inspected entries for both methods.",
    quiz: q(
      "What is a typical cost of maintaining an index?",
      [
        "Extra storage and work on writes",
        "All queries become constant time",
        "Transactions become unnecessary",
      ],
      0,
      "Indexes occupy space and must reflect inserts, updates and deletes.",
    ),
  },
  {
    id: "transactions",
    topic: "databases",
    kind: "transaction",
    title: "Commit or roll back",
    minutes: 12,
    summary: "Move funds through a staged transaction and inject a failure.",
    idea: "A transaction groups related changes into one committed outcome. The lab stages a debit and credit, then commits both or discards both on failure.",
    invariant:
      "The sum of committed account balances stays constant. Intermediate staged values are not exposed as committed data.",
    challenge:
      "Fail after the debit. Compare staged values with committed balances, then run a successful transfer.",
    quiz: q(
      "What should a rollback after the debit leave committed?",
      ["Only the debit", "Neither change", "Only the credit"],
      1,
      "Atomicity means the transaction commits all its changes or none of them.",
    ),
  },
  {
    id: "normalization",
    topic: "databases",
    kind: "normalization",
    title: "Remove an update anomaly",
    minutes: 10,
    summary: "Separate course facts from enrollments and reconstruct the view.",
    idea: "Store a course instructor once in a course table and refer to the course by key from each enrollment. Joins reconstruct the combined view when needed.",
    invariant:
      "One course identifier determines one instructor in this example. This assumption is what makes the decomposition useful.",
    challenge:
      "Change the instructor in the duplicated table, then in the normalized tables. Compare how many rows need updating.",
    quiz: q(
      "Why separate the course instructor from enrollment rows?",
      [
        "To remove every join",
        "To avoid storing the same course fact in many rows",
        "To allow one course key to mean different courses",
      ],
      1,
      "A single source for the course fact avoids conflicting copies during updates.",
    ),
  },
  {
    id: "cpu-scheduling",
    topic: "operating-systems",
    kind: "scheduler",
    title: "Who gets the CPU next?",
    minutes: 15,
    summary: "Compare FCFS, shortest-job-first and round robin.",
    idea: "Scheduling policies trade throughput, waiting time and responsiveness. All processes in this lab arrive at time zero and use one CPU burst; context switching is free in the model.",
    invariant:
      "Only one process occupies the CPU at a time. Round robin returns an unfinished process to the end of the ready queue after its quantum.",
    challenge:
      "Try bursts 8,2,1 with a quantum of 2. Compare average waiting time across the three policies.",
    quiz: q(
      "Which policy regularly gives unfinished processes another turn?",
      ["Nonpreemptive SJF", "FCFS", "Round robin"],
      2,
      "Round robin limits each turn with a time quantum, then rotates unfinished work.",
    ),
  },
  {
    id: "page-replacement",
    topic: "operating-systems",
    kind: "memory",
    title: "Keep a page or evict it?",
    minutes: 14,
    summary: "Follow page hits, faults and replacement with FIFO and LRU.",
    idea: "When a referenced page is absent, a page fault requires loading it. FIFO evicts the oldest loaded page; LRU evicts the page whose most recent use is oldest.",
    invariant:
      "A page hit does not load another frame. FIFO order changes on loading, while LRU recency changes on every access.",
    challenge:
      "Run 1,2,3,1,4 with three frames. Which page does each policy evict?",
    quiz: q(
      "Under LRU, which page is evicted?",
      [
        "The smallest page number",
        "The least recently accessed resident page",
        "Always the first array slot",
      ],
      1,
      "LRU uses access recency, independent of the numerical value of the page identifier.",
    ),
  },
  {
    id: "deadlocks",
    topic: "operating-systems",
    kind: "deadlock",
    title: "Break a circular wait",
    minutes: 12,
    summary: "Two processes compete for two exclusive resources.",
    idea: "If each process holds one resource and waits for the other, neither can proceed. A common lock order prevents this particular circular wait.",
    invariant:
      "Resources here have one instance each and are held exclusively. A cycle in this wait-for graph means deadlock in this model.",
    challenge:
      "Compare opposite resource orders with a shared order. Follow who is blocked and when a resource is released.",
    quiz: q(
      "Which change prevents this example’s circular wait?",
      [
        "Both processes acquire resources in the same global order",
        "Increase the animation speed",
        "Let both keep waiting forever",
      ],
      0,
      "A consistent acquisition order removes the cycle of competing lock dependencies.",
    ),
  },
  {
    id: "synchronization",
    topic: "operating-systems",
    kind: "semaphore",
    title: "Protect a shared counter",
    minutes: 12,
    summary: "Observe a lost update, then protect the critical section.",
    idea: "An increment includes a read, calculation and write. Interleaving two increments can lose one update. A binary semaphore allows one process into that critical section at a time.",
    invariant:
      "With the lock, each process reads the value after the previous process has committed its increment. The final counter should be two.",
    challenge:
      "Run without protection and identify the overwritten update. Enable the binary semaphore and compare the ordering.",
    quiz: q(
      "Why can two unprotected increments produce only one increase?",
      [
        "Both processes can read the same old value",
        "Addition stops being associative",
        "A semaphore always subtracts one",
      ],
      0,
      "Both compute old+1 and write the same result, overwriting one logical increment.",
    ),
  },
  {
    id: "dns-lookup",
    topic: "networks",
    kind: "network",
    title: "Resolve a domain name",
    minutes: 10,
    summary: "Follow recursive resolution and compare a warm cache.",
    idea: "A client asks a recursive resolver for an address. A cold lookup may consult root, TLD and authoritative servers; a cached record can avoid those upstream queries until its TTL expires.",
    invariant:
      "A cache hit uses a still-valid cached record. This simplified trace omits delegation caches, CNAME chains and DNSSEC.",
    challenge:
      "Compare cold and warm lookups. Identify which network trips disappear and explain what happens after TTL expiry.",
    quiz: q(
      "What does a DNS TTL limit?",
      [
        "How long a cached record may be reused",
        "The maximum length of an HTTP body",
        "The size of a TCP sequence number",
      ],
      0,
      "The TTL bounds reuse of a DNS record before it needs refreshing.",
    ),
  },
  {
    id: "https-journey",
    topic: "networks",
    kind: "network",
    title: "From URL to HTTPS response",
    minutes: 14,
    summary: "Connect DNS, TCP, TLS and HTTP in one request journey.",
    idea: "A fresh HTTPS connection over TCP needs address resolution, a TCP connection and a TLS handshake before HTTP application data is exchanged.",
    invariant:
      "This is a simplified new HTTP/1.1 or HTTP/2 connection over TCP. HTTP/3 uses QUIC and follows a different transport path.",
    challenge:
      "Compare a reused connection with a fresh connection. Explain which setup work can be avoided without skipping encryption.",
    quiz: q(
      "What establishes encryption for this HTTPS connection?",
      ["DNS alone", "The TLS handshake", "The HTTP status code"],
      1,
      "TLS establishes cryptographic parameters and authenticates the server certificate before application data is exchanged.",
    ),
  },
  {
    id: "tcp-retries",
    topic: "networks",
    kind: "network",
    title: "Sequence, acknowledge, retry",
    minutes: 14,
    summary: "Lose a data segment and watch ordered delivery recover.",
    idea: "TCP numbers bytes and acknowledges the next expected byte. Retransmission recovers missing data. The lab uses one segment in flight at a time to make that process visible.",
    invariant:
      "A retransmitted segment keeps the same sequence number. The receiver delivers each byte once, in order.",
    challenge:
      "Drop the second 100-byte segment. Follow the acknowledgment and explain why the retry does not create 100 extra delivered bytes.",
    quiz: q(
      "Does retransmission use a new sequence number for the same bytes?",
      [
        "Yes, always",
        "No, the bytes keep their sequence numbers",
        "Sequence numbers identify users",
      ],
      1,
      "Sequence numbers identify positions in the byte stream, allowing duplicate data to be recognized.",
    ),
  },
  {
    id: "strategy-pattern",
    topic: "oop",
    kind: "strategy",
    title: "Strategy: change one behavior",
    minutes: 12,
    summary: "Swap pricing rules behind the same interface.",
    idea: "The caller depends on a pricing interface. Different strategies implement that interface, so choosing a discount does not require changing the checkout workflow.",
    invariant:
      "Each strategy accepts the same subtotal and returns a nonnegative total. The example Java code is a readable reference; the visual model computes the displayed result.",
    challenge:
      "Compare percentage and flat discounts for small and large baskets. Find where one becomes more beneficial.",
    quiz: q(
      "What stays stable when the strategy changes?",
      [
        "The interface used by the caller",
        "The internal formula of every strategy",
        "Every returned price",
      ],
      0,
      "A common contract allows alternative behavior to be substituted.",
    ),
  },
  {
    id: "observer-pattern",
    topic: "oop",
    kind: "observer",
    title: "Observer: publish one event",
    minutes: 12,
    summary: "Subscribe listeners and trace which ones receive an update.",
    idea: "A publisher sends an event to its registered observers. Each observer can react independently, such as updating a chart or sending an alert.",
    invariant:
      "Only listeners subscribed at publication time receive this synchronous example event. Distributed delivery would require additional reliability rules.",
    challenge:
      "Unsubscribe one listener and publish a new value. Check that the other listeners still receive it.",
    quiz: q(
      "Who receives the next event in this model?",
      [
        "Every object ever created",
        "The currently subscribed observers",
        "Only the publisher",
      ],
      1,
      "The current subscriber collection determines which callbacks are invoked.",
    ),
  },
  {
    id: "factory-pattern",
    topic: "oop",
    kind: "factory",
    title: "Factory: choose an implementation",
    minutes: 12,
    summary:
      "Create an email, SMS or push notifier through one creation method.",
    idea: "A factory centralizes the choice of concrete class. Client code requests a Notifier and invokes its common send method.",
    invariant:
      "Each selected implementation satisfies the same Notifier contract. No real email, SMS or push message is sent by this teaching lab.",
    challenge:
      "Change the channel and follow the created object. Explain which code needs editing when adding a new channel.",
    quiz: q(
      "What is the factory responsible for here?",
      [
        "Choosing and creating the concrete notifier",
        "Guaranteeing message delivery",
        "Replacing the notifier interface",
      ],
      0,
      "The factory handles construction; the notifier implementation handles its channel-specific behavior.",
    ),
  },
];
modules.push(...deeperModules);
export const moduleById = Object.fromEntries(modules.map((m) => [m.id, m]));
export const interviewQuestions = [
  {
    topic: "system-design",
    prompt:
      "Design a URL shortener for a read-heavy workload. Explain creation, redirects and failures.",
    rubric: [
      "Clarify traffic, URL expiry and availability needs",
      "Explain unique codes and durable mappings",
      "Describe caching and invalidation",
      "Discuss collisions, rate limits and failure recovery",
    ],
  },
  {
    topic: "system-design",
    prompt:
      "Design a chat service with offline users. What does “delivered” mean?",
    rubric: [
      "Separate accepted, persisted, delivered and read states",
      "Explain connection routing and offline storage",
      "Define ordering and retry semantics",
      "Discuss idempotency and reconnection",
    ],
  },
  {
    topic: "system-design",
    prompt:
      "Design a notification pipeline when an external provider becomes slow.",
    rubric: [
      "Separate API acceptance from delivery",
      "Use bounded queues and backpressure",
      "Define retry limits and duplicate prevention",
      "Explain dead-letter handling and observability",
    ],
  },
  {
    topic: "system-design",
    prompt: "Compare fan-out on read and fan-out on write for a news feed.",
    rubric: [
      "Estimate reads, writes and follower counts",
      "Explain the work done on each path",
      "Handle very large audiences",
      "Discuss freshness and ranking costs",
    ],
  },
  {
    topic: "databases",
    prompt:
      "Explain INNER JOIN and LEFT JOIN, including a WHERE condition on the right table.",
    rubric: [
      "Describe matching pairs and duplicate matches",
      "Explain NULLs for unmatched rows",
      "Show how WHERE can remove unmatched rows",
      "Give a concrete example",
    ],
  },
  {
    topic: "databases",
    prompt: "When could adding an index make an application worse?",
    rubric: [
      "Discuss storage and write amplification",
      "Consider selectivity and query shape",
      "Explain composite index ordering",
      "Use query plans and measured workload evidence",
    ],
  },
  {
    topic: "databases",
    prompt: "How would you make a transfer between accounts safe?",
    rubric: [
      "Group debit and credit in one transaction",
      "Validate amount and available funds",
      "Discuss isolation and concurrent updates",
      "Handle rollback and repeated requests",
    ],
  },
  {
    topic: "operating-systems",
    prompt: "Compare FCFS, SJF and round robin for an interactive workload.",
    rubric: [
      "Define the policies",
      "Compare waiting time and response time",
      "Explain quantum and context-switch costs",
      "State arrival-time and burst assumptions",
    ],
  },
  {
    topic: "operating-systems",
    prompt: "Explain a deadlock and one prevention strategy.",
    rubric: [
      "Give a concrete resource cycle",
      "Describe exclusive ownership and waiting",
      "Explain a global lock order",
      "Discuss prevention versus detection and recovery",
    ],
  },
  {
    topic: "operating-systems",
    prompt: "Why does LRU behave differently from FIFO on page hits?",
    rubric: [
      "Distinguish loading age from access recency",
      "Show an example sequence",
      "Explain faults and eviction choices",
      "Mention implementation overhead",
    ],
  },
  {
    topic: "networks",
    prompt: "What happens when you open a new HTTPS URL?",
    rubric: [
      "Resolve the hostname",
      "Establish transport",
      "Explain TLS authentication and encryption",
      "Exchange HTTP messages and distinguish reuse/HTTP3",
    ],
  },
  {
    topic: "networks",
    prompt:
      "How do sequence numbers and acknowledgments help recover lost data?",
    rubric: [
      "Identify byte positions",
      "Explain the next expected byte",
      "Retry missing bytes with the same numbers",
      "Distinguish the simple model from real TCP windows and congestion control",
    ],
  },
  {
    topic: "networks",
    prompt:
      "What happens when a DNS record changes while clients have it cached?",
    rubric: [
      "Explain TTL",
      "Discuss valid stale cached values before expiry",
      "Describe resolver refresh",
      "Consider rollout timing and cache layers",
    ],
  },
  {
    topic: "oop",
    prompt:
      "When would you use Strategy instead of a large pricing conditional?",
    rubric: [
      "Define the common interface",
      "Show interchangeable implementations",
      "Explain how the caller chooses a strategy",
      "Discuss when the extra abstraction is worthwhile",
    ],
  },
  {
    topic: "oop",
    prompt: "Explain Observer and a problem it can introduce.",
    rubric: [
      "Identify publisher and subscriber roles",
      "Explain subscribing and unsubscribing",
      "Consider listener exceptions or lifecycle leaks",
      "Distinguish synchronous callbacks from distributed messaging",
    ],
  },
  {
    topic: "oop",
    prompt: "How does a factory reduce coupling in notification code?",
    rubric: [
      "Describe a common notifier contract",
      "Centralize concrete class selection",
      "Keep creation separate from use",
      "Explain extension and error handling",
    ],
  },
  {
    topic: "dsa",
    prompt: "Explain why binary search is correct and when you would avoid it.",
    rubric: [
      "State the sorted or monotonic precondition",
      "Maintain a candidate interval invariant",
      "Handle boundaries and termination",
      "Discuss complexity and counterexamples",
    ],
  },
  {
    topic: "dsa",
    prompt: "Explain the difference between BFS and DFS using a grid example.",
    rubric: [
      "Describe queue versus stack/recursion",
      "Discuss visited state",
      "Explain unweighted shortest paths",
      "Compare memory and traversal order",
    ],
  },
];

// Append so existing browser-local interview answer IDs remain stable.
interviewQuestions.push(
  ...deeperModules.map((m) => ({
    topic: m.topic,
    prompt: `Explain ${m.title.toLowerCase()}. ${m.challenge}`,
    rubric: [
      "State the initial conditions, inputs, and simplifying assumptions before explaining the steps",
      m.idea,
      m.invariant,
      "Use a concrete example to compare the policies and explain when you would choose each one",
    ],
  })),
);
