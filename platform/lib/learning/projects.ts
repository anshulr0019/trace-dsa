import type { LearningTrack } from "./references";
export type Project = {
  title: string;
  brief: string;
  milestones: { title: string; task: string; model: string }[];
  checks: string[];
  labIds: string[];
};
export const trackProjects: Record<LearningTrack, Project> = {
  "system-design": {
    title: "Design a reliable reservation service",
    brief:
      "A campus event sells 500 seats. During launch, 2,000 clients arrive in one minute; clients may retry and the notification provider may fail. Produce a design and evidence from the related labs.",
    milestones: [
      {
        title: "Define the contract",
        task: "Specify reserve, cancel and status operations. State what a successful reservation promises and distinguish a request id from a reservation id.",
        model:
          "A successful reservation identifies a durable seat allocation. Give reserve a stable client operation id for retries. Define expiration and cancellation explicitly; an email confirmation is a separate outcome.",
      },
      {
        title: "Make the critical path correct",
        task: "Describe how two clients competing for the last seat are handled. Decide which work happens inside the authoritative state change and which is asynchronous.",
        model:
          "Use an atomic condition on remaining inventory and a unique logical operation key. The seat change and reservation outcome must agree. Publish delivery work reliably after acceptance; a queue alone does not prove that publication and database commit are coordinated.",
      },
      {
        title: "Test the limits",
        task: "Compare baseline traffic, a burst and an unavailable required component in the system-design labs. Record observed capacity, rejected work or backlog and explain the model’s limits.",
        model:
          "Identify the slowest required stage before scaling. Calculate arrivals minus completions for backlog. Retry processing needs an idempotency rule, bounded backoff and observable failures; model capacities are teaching assumptions, not production benchmarks.",
      },
    ],
    checks: [
      "A repeated operation id does not allocate a second seat.",
      "Two requests for the last seat cannot both succeed under the chosen atomic rule.",
      "Provider failure does not silently erase an accepted reservation.",
      "Average traffic (about 33.3 requests/s) is distinguished from peak load.",
    ],
    labIds: [
      "request-journey",
      "rate-limiting",
      "replication-lag",
      "notifications",
    ],
  },
  databases: {
    title: "Investigate a course-enrollment database",
    brief:
      "Model Students, Courses and Enrollments. A course has a capacity, enrollments must be unique, and reports must include courses with no students. Produce schema decisions, example queries and concurrency reasoning.",
    milestones: [
      {
        title: "Model the facts",
        task: "Choose primary keys, foreign keys and a unique enrollment rule. Explain where course instructor and capacity belong.",
        model:
          "Store course facts once in Courses and reference them from Enrollments. A composite uniqueness constraint on (studentId, courseId) prevents duplicate enrollment. Define deletion behavior instead of leaving dangling references.",
      },
      {
        title: "Build a correct report",
        task: "Explain how to count enrolled students per course while retaining empty courses. Then add a condition on the complete count.",
        model:
          "Start from Courses with a LEFT JOIN to Enrollments, GROUP BY the course, and COUNT a non-NULL enrollment identifier. COUNT(*) would count the preserved unmatched row. Use HAVING for the group condition.",
      },
      {
        title: "Protect concurrent enrollment",
        task: "Two transactions see one remaining place. Explain how the capacity rule is protected and how failed attempts are retried.",
        model:
          "Checking capacity and inserting independently is unsafe. Use a transaction strategy that protects the relevant row or predicate, or an equivalent atomic condition. State isolation and retry behavior. An index can accelerate checks but is not itself the concurrency guarantee.",
      },
    ],
    checks: [
      "An empty course reports zero students rather than disappearing or reporting one.",
      "Duplicate enrollment is rejected by a shared constraint.",
      "Course facts are updated in one authoritative location.",
      "The last available place cannot be allocated twice.",
    ],
    labIds: [
      "sql-joins",
      "sql-aggregation",
      "normalization",
      "transaction-isolation",
    ],
  },
  "operating-systems": {
    title: "Analyze a bounded job-processing system",
    brief:
      "A worker pool receives jobs, uses a bounded buffer and shares a completion counter. Compare fairness, memory use and correctness using the scheduling and synchronization labs.",
    milestones: [
      {
        title: "Choose admission semantics",
        task: "Specify whether a full buffer blocks, rejects or drops a job. Describe what the caller observes and what shutdown means for queued work.",
        model:
          "Capacity bounds memory only when overload behavior is explicit. A blocking producer waits for space; a rejecting producer returns failure to the caller. Shutdown needs a policy to drain, cancel or preserve pending work.",
      },
      {
        title: "Protect shared state",
        task: "Draw the lost-update interleaving for two completion-counter increments. State the lock or atomic boundary and the lock-acquisition order.",
        model:
          "Protect the whole read-modify-write, using the same synchronization mechanism for all participating threads. A global resource order avoids circular acquisition in the relevant lock set. Condition waits must recheck their predicates.",
      },
      {
        title: "Compare policy outcomes",
        task: "Run a long job followed by short jobs under FCFS and round robin. Record waiting and completion behavior; explain why the teaching model cannot measure real context-switch overhead.",
        model:
          "FCFS can delay short jobs behind a long burst. Round robin gives unfinished jobs repeated turns but does not remove the total work. Real latency depends on arrival times, I/O and switching overhead, all of which must be stated.",
      },
    ],
    checks: [
      "Buffer occupancy never exceeds the declared capacity.",
      "Two completed jobs contribute two protected increments.",
      "Waiting predicates are checked after waking and reacquiring the lock.",
      "Fairness claims are tied to a workload and explicit overhead assumptions.",
    ],
    labIds: [
      "bounded-buffer",
      "synchronization",
      "deadlocks",
      "cpu-scheduling",
    ],
  },
  networks: {
    title: "Explain reliable delivery over a lossy path",
    brief:
      "Build a paper protocol trace for six numbered teaching segments. Segment 2 is lost once and an acknowledgment can be lost. Explain buffering, retry, contiguous progress and congestion feedback.",
    milestones: [
      {
        title: "Declare the numbering rules",
        task: "State whether numbers identify teaching segments or bytes, and whether an acknowledgment names the last contiguous item or the next expected item.",
        model:
          "Use one convention consistently. For this paper trace, segments are 1 through 6 and the acknowledgment gives the next expected segment. Real TCP sequence numbers describe byte positions.",
      },
      {
        title: "Trace the gap and recovery",
        task: "Show the receiver after 1, 3 and 4 arrive. Then show what changes when 2 arrives and what happens if 3 is retransmitted.",
        model:
          "The next expected item remains 2 while 3 and 4 can be buffered. Receiving 2 closes the gap and advances the next expected item to 5. A duplicate 3 must not be delivered to the application again.",
      },
      {
        title: "Separate the controls",
        task: "Explain a receiver-capacity limit and a path-congestion limit. Compare the fixed and adaptive sending examples and identify what their feedback can and cannot prove.",
        model:
          "Receiver capacity constrains how much data can be accepted/buffered; congestion control constrains offered load to the path. Silence may mean data loss or ACK loss. The simplified capacity-round model demonstrates a feedback rule rather than a complete transport stack.",
      },
    ],
    checks: [
      "Acknowledgment progress never falsely crosses an unfilled gap.",
      "Retransmission preserves the logical sequence identity.",
      "The application does not receive duplicate logical data.",
      "Flow control, congestion control and loss detection are distinguished.",
    ],
    labIds: [
      "tcp-retries",
      "sliding-window-network",
      "congestion-control",
      "https-journey",
    ],
  },
  oop: {
    title: "Design an extensible checkout workflow",
    brief:
      "A checkout supports percentage and fixed discounts, a legacy price provider, and optional logging and auditing. Draw responsibilities and trace object calls before writing an implementation.",
    milestones: [
      {
        title: "Own the invariant",
        task: "Define a pricing contract, currency representation and the rule for discounts larger than the subtotal. Decide which class owns the validation boundary.",
        model:
          "A cart or pricing boundary owns the valid-total rule. State whether excessive discounts clamp or reject. Prefer exact integer units or a declared decimal representation. Implementations must preserve the common contract.",
      },
      {
        title: "Compose changing behavior",
        task: "Use a strategy for the discount and an adapter for the legacy provider. Explain why these two objects solve different kinds of change.",
        model:
          "The strategy varies a calculation behind a shared interface. The adapter translates a foreign interface’s units, names and errors. Neither role should silently assume the responsibilities of the other.",
      },
      {
        title: "Trace optional effects",
        task: "Place logging and audit behavior around the operation. Trace failures and different wrapper orders; specify which event counts as success.",
        model:
          "Decorator order can change observed operations. An observer needs registration and failure rules. A retry can create multiple attempts for one logical operation, so auditing must state whether it records attempts or accepted outcomes.",
      },
    ],
    checks: [
      "Every discount implementation satisfies the declared pricing contract.",
      "Provider units and error behavior are translated explicitly.",
      "The design avoids a class for every combination of optional features.",
      "Failure and ordering behavior can be explained by following the call chain.",
    ],
    labIds: [
      "encapsulation",
      "strategy-pattern",
      "adapter-pattern",
      "decorator-pattern",
      "observer-pattern",
    ],
  },
  dsa: {
    title: "Build an algorithm-selection portfolio",
    brief:
      "Choose one problem from each tier. For each, record a baseline, an improvement, a correctness argument, a complexity analysis and five predicted test outcomes. Use the runtime traces to challenge your reasoning.",
    milestones: [
      {
        title: "Start with a correct baseline",
        task: "Pick a normal and boundary input. State the required output contract, including indexing, duplicate rules and allowed mutation. Describe a simple algorithm that meets it.",
        model:
          "A slow correct baseline makes the target behavior explicit. Test one-element/empty cases where permitted and use the problem’s actual duplicate and mutation rules. Do not optimize by silently changing the question.",
      },
      {
        title: "Justify the optimization",
        task: "Identify repeated work or structure you can reuse. Write the invariant or state meaning and justify one elimination, relaxation or recurrence.",
        model:
          "For a window, prove the maintained range rule. For graph paths, state the weight assumptions. For DP, give a precise subproblem meaning and dependency order. The argument must match the chosen problem, not just the pattern name.",
      },
      {
        title: "Verify and explain",
        task: "Run the provided explained cases and at least one legal custom boundary case. Compare the trace to your prediction. Explain costs using operations, including sorting or data-structure work.",
        model:
          "A successful example is evidence, not a complete correctness proof. Include adversarial cases for the failure mode you identified. Analyze algorithm work separately from Trace’s snapshot storage and input/output conversion.",
      },
    ],
    checks: [
      "Four chosen problems span all four tiers.",
      "Each optimization has a problem-specific correctness argument.",
      "Each claimed complexity accounts for its actual data structures and preprocessing.",
      "Predicted outputs are recorded before checking the runtime.",
    ],
    labIds: [],
  },
  interviews: {
    title: "Complete a reasoned mock-interview portfolio",
    brief:
      "Solve one coding prompt and one CS design prompt under a time limit. Save your assumptions, decisions, examples and review evidence. Repeat after identifying the weakest part of the first attempt.",
    milestones: [
      {
        title: "Clarify before committing",
        task: "Choose the prompt and write the required operations, input constraints and success conditions. Identify an ambiguity that could change the design.",
        model:
          "Ask targeted questions or explicitly document assumptions. A missing concurrency rule, endpoint convention or failure guarantee can make two superficially similar solutions answer different problems.",
      },
      {
        title: "Deliver a working argument",
        task: "Explain a baseline, improve it only where the requirements justify it, and walk through a small case. Reserve time for a failure or boundary case.",
        model:
          "Show a complete core solution before adding optional complexity. Name the state at each decision and explain the safety of changes. Discuss trade-offs using the workload or constraints, rather than naming fashionable technologies.",
      },
      {
        title: "Review and repeat",
        task: "Use the prompt rubric, identify one unsupported claim and revise it. Repeat the session and compare the quality of the explanation, not only elapsed time.",
        model:
          "Self-review must cite evidence: a calculation, trace, test or explicit guarantee. Distinguish an observed result from a proof and state what remains uncertain. A polished explanation does not make incorrect assumptions true.",
      },
    ],
    checks: [
      "Assumptions are explicit and relevant to the prompt.",
      "A complete core solution is delivered within the chosen time.",
      "The solution is challenged with a legal failure or boundary case.",
      "The final review identifies and corrects a specific weak claim.",
    ],
    labIds: [],
  },
};
