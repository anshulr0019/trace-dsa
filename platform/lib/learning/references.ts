export type LearningTrack =
  | "dsa"
  | "system-design"
  | "databases"
  | "operating-systems"
  | "networks"
  | "oop"
  | "interviews";
export const teachingReferences: Record<
  LearningTrack,
  {
    name: string;
    url: string;
    method: string;
    observe: string;
    experiment: string;
  }
> = {
  dsa: {
    name: "MIT 6.006 · Algorithms",
    url: "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/",
    method:
      "Connect the procedure to correctness and the amount of work it performs.",
    observe:
      "Follow the active element and explain why the next move preserves a valid answer.",
    experiment: "Try a boundary input. Which assumption does it test?",
  },
  "system-design": {
    name: "MIT 6.5840 · Distributed Systems",
    url: "https://pdos.csail.mit.edu/6.824/",
    method: "Use concrete cases and failures to examine a design’s guarantees.",
    observe:
      "Follow one request. Identify the component that decides whether it can finish.",
    experiment:
      "Compare normal operation with a traffic burst or unavailable component. Which guarantee changes?",
  },
  databases: {
    name: "Berkeley CS186 · Database Systems",
    url: "https://cs186berkeley.net/fa24/",
    method:
      "Connect query behavior, storage work and concurrency to implementation.",
    observe:
      "Track the rows or state touched by each operation, including work that produces no output.",
    experiment:
      "Compare two examples. Separate a change in the answer from a change in the work needed.",
  },
  "operating-systems": {
    name: "OSTEP · Simulator exercises",
    url: "https://pages.cs.wisc.edu/~remzi/OSTEP/Homework/homework.html",
    method:
      "Calculate a simulator’s next result before asking it to reveal the answer.",
    observe: "Follow the owner of each resource and the tasks waiting for it.",
    experiment:
      "Change a policy while keeping the workload fixed. Who waits longer and why?",
  },
  networks: {
    name: "Stanford CS144 · Computer Networking",
    url: "https://cs144.github.io/",
    method:
      "Build understanding in small stages, from unreliable delivery to useful abstractions.",
    observe:
      "Distinguish what was sent from what was received or acknowledged.",
    experiment:
      "Introduce a dropped packet or change a capacity. Watch the recovery rather than just the final result.",
  },
  oop: {
    name: "Refactoring.Guru · Design Patterns",
    url: "https://refactoring.guru/design-patterns/strategy",
    method:
      "Start with a changing requirement, then trace which object owns each responsibility.",
    observe:
      "Follow the caller, the selected implementation and the returned result.",
    experiment:
      "Swap a behavior. Identify what changes and which callers can remain unchanged.",
  },
  interviews: {
    name: "Tech Interview Handbook · Interview process",
    url: "https://www.techinterviewhandbook.org/coding-interview-cheatsheet/",
    method:
      "Clarify the task, compare approaches, explain a choice and check it with examples.",
    observe:
      "Make assumptions and trade-offs explicit before committing to an approach.",
    experiment:
      "Challenge your answer with a failure or edge case. Explain how you would detect it.",
  },
};
