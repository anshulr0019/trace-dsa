import type { LearningTrack } from "./references";
export type CourseBenchmark = {
  name: string;
  url: string;
  focus: string;
  access: string;
};
const b = (
  name: string,
  url: string,
  focus: string,
  access = "Public syllabus and teaching material",
): CourseBenchmark => ({ name, url, focus, access });
export const courseBenchmarks: Record<LearningTrack, CourseBenchmark[]> = {
  dsa: [
    b(
      "MIT 6.006",
      "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/",
      "Correctness arguments, algorithm design and analysis.",
    ),
    b(
      "Princeton Algorithms",
      "https://www.coursera.org/learn/algorithms-part1",
      "Implementation, measured performance and substantial programming assignments.",
      "Public course outline; assignment descriptions",
    ),
    b(
      "Stanford Algorithms",
      "https://www.coursera.org/specializations/algorithms",
      "Divide and conquer, graph algorithms, greedy methods and dynamic programming.",
      "Public specialization outline",
    ),
  ],
  "system-design": [
    b(
      "Hello Interview · System Design",
      "https://www.hellointerview.com/learn/system-design/in-a-hurry/delivery",
      "Requirements, interfaces, a working design and focused deep dives.",
      "Public teaching guide",
    ),
    b(
      "Design Gurus · System Design",
      "https://www.designgurus.io/courses",
      "Foundations followed by interview cases and trade-offs.",
      "Public catalog and course descriptions",
    ),
    b(
      "MIT 6.5840 · Distributed Systems",
      "https://pdos.csail.mit.edu/6.824/",
      "Fault tolerance, replication, consistency and implementation labs.",
    ),
  ],
  databases: [
    b(
      "Harvard CS50 SQL",
      "https://cs50.harvard.edu/sql/",
      "Queries, schema design, constraints, indexes and a final project.",
    ),
    b(
      "Berkeley CS186",
      "https://cs186berkeley.net/",
      "Storage, query processing, concurrency and recovery.",
      "Public current schedule and project outlines; class videos require access",
    ),
    b(
      "CMU 15-445",
      "https://15445.courses.cs.cmu.edu/",
      "Database internals and incremental database implementation projects.",
    ),
  ],
  "operating-systems": [
    b(
      "OSTEP",
      "https://pages.cs.wisc.edu/~remzi/OSTEP/",
      "Virtualization, concurrency and persistence with simulator exercises.",
    ),
    b(
      "MIT 6.1810",
      "https://pdos.csail.mit.edu/6.1810/2026/schedule.html",
      "Build and investigate operating-system mechanisms with xv6 labs.",
    ),
    b(
      "Georgia Tech CS6200",
      "https://omscs.gatech.edu/cs-6200-introduction-operating-systems",
      "Threads, synchronization, resource management and distributed interaction.",
      "Public overview and sample syllabus; lessons require an account",
    ),
  ],
  networks: [
    b(
      "Stanford CS144",
      "https://cs144.github.io/",
      "Build a reliable byte stream from unreliable packet delivery.",
    ),
    b(
      "Kurose & Ross · Interactive Problems",
      "https://gaia.cs.umass.edu/kurose_ross/interactive/",
      "Calculate transport, routing and timing behavior through interactive exercises.",
      "Public textbook companion, exercises and animations",
    ),
    b(
      "Georgia Tech CS6250",
      "https://omscs.gatech.edu/cs-6250-computer-networks",
      "Routing, software-defined networking and network-security applications.",
      "Public overview and syllabus",
    ),
  ],
  oop: [
    b(
      "UCSD · Object Oriented Programming in Java",
      "https://www.coursera.org/learn/object-oriented-java/",
      "Trace object state and apply Java concepts in a visual project.",
      "Public course outline",
    ),
    b(
      "Alberta · Object-Oriented Design",
      "https://www.coursera.org/learn/object-oriented-design",
      "Responsibilities, relationships, UML and design trade-offs.",
      "Public course outline",
    ),
    b(
      "LearnQuest · OOP with Java",
      "https://www.coursera.org/learn/object-oriented-programming-with-java",
      "Classes, encapsulation, constructors, methods and packages.",
      "Public course outline",
    ),
  ],
  interviews: [
    b(
      "NeetCode · Interview Preparation",
      "https://neetcode.io/courses/dsa-for-beginners/0",
      "Pattern recognition, efficient implementations and trade-off discussion.",
      "Public introductory lesson and course outline",
    ),
    b(
      "Striver · A2Z DSA",
      "https://takeuforward.org/prep-hub/strivers-a2z-dsa-sheet",
      "A progression from basics to harder algorithmic exercises.",
      "Public sheet and course structure",
    ),
    b(
      "CodePath · Technical Interview Prep",
      "https://www.codepath.org/courses/tech-interview-prep",
      "Practice at different difficulty levels and communicate problem-solving decisions.",
      "Public course descriptions and syllabi",
    ),
  ],
};
