# Three-reference curriculum audit

Reviewed 9 October 2026. This audit extends the earlier teaching research. It compares three strong online course/reference options per Trace track using current official public pages. It is a shortlist selected for Trace's beginner-to-interview audience, not an independently verified worldwide ranking.

## Selection criteria and access

Prefer clear prerequisites, staged learning, worked reasoning, implementation or substantial practice, correctness/trade-off discussion, and assessments or projects. Use instructor/university material and current official course pages. Availability means the linked public material was available during this review; it does not imply a free certificate or access to every enrolled lesson.

The review covers syllabi, public introductions, module outlines, selected public teaching guides and project specifications. It does not claim enrollment, completion, access to private course data, or watching all course videos. Design Gurus' individual fundamentals page could not be read; the official catalog and public descriptions were reviewed. Helsinki Java MOOC was examined but excluded from the current shortlist because its official page explicitly labels it a legacy course that is no longer maintained.

## Reference comparison

| Track | Reference 1 | Reference 2 | Reference 3 | What the comparison contributes to Trace |
|---|---|---|---|---|
| DSA | [MIT 6.006](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/) | [Princeton Algorithms](https://www.coursera.org/learn/algorithms-part1) | [Stanford Algorithms](https://www.coursera.org/specializations/algorithms) | Define state and correctness before optimizing; compare a baseline with a structured algorithm; justify cost using operations and test adversarial cases. |
| System design | [Hello Interview delivery guide](https://www.hellointerview.com/learn/system-design/in-a-hurry/delivery) | [Design Gurus catalog](https://www.designgurus.io/courses) | [MIT 6.5840](https://pdos.csail.mit.edu/6.824/) | Requirements and interfaces precede architecture. A working core design is followed by capacity, consistency and failure analysis. |
| Databases | [Harvard CS50 SQL](https://cs50.harvard.edu/sql/) | [Berkeley CS186](https://cs186berkeley.net/) | [CMU 15-445](https://15445.courses.cs.cmu.edu/) | Connect logical query results and schema rules with physical work, concurrency and implementation projects. |
| OS | [OSTEP](https://pages.cs.wisc.edu/~remzi/OSTEP/) | [MIT 6.1810 Fall 2026](https://pdos.csail.mit.edu/6.1810/2026/schedule.html) | [Georgia Tech CS6200](https://omscs.gatech.edu/cs-6200-introduction-operating-systems) | Explicit machine/resource state, simulator prediction, concrete interleavings and implementation assumptions. |
| Networks | [Stanford CS144](https://cs144.github.io/) | [Kurose/Ross interactive exercises](https://gaia.cs.umass.edu/kurose_ross/interactive/) | [Georgia Tech CS6250](https://omscs.gatech.edu/cs-6250-computer-networks) | Follow layered behavior, calculate protocol state and distinguish transport, routing and control guarantees. |
| OOP/design | [UCSD OOP in Java](https://www.coursera.org/learn/object-oriented-java/) | [Alberta Object-Oriented Design](https://www.coursera.org/learn/object-oriented-design) | [LearnQuest OOP with Java](https://www.coursera.org/learn/object-oriented-programming-with-java) | Move from objects and invariants to responsibilities, contracts, relationships and a composed application design. |
| Interviews | [NeetCode introduction](https://neetcode.io/courses/dsa-for-beginners/0) | [Striver A2Z](https://takeuforward.org/prep-hub/strivers-a2z-dsa-sheet) | [CodePath interview prep](https://www.codepath.org/courses/tech-interview-prep) | Progressive difficulty, efficient problem-solving, clear communication, timed practice and evidence-based review. |

The current CMU and Berkeley root pages identify Fall 2026 offerings. Earlier archived schedules were also inspected because they expose complete topic sequences. Academic material from older editions can remain available and useful; it is labeled with its original edition rather than relabeled as newly published content.

## Implementation, mapped to the audited standards

- 35 CS study units: prerequisites, mental model, a separate worked paper example, baseline/improvement/trade-off, a common misconception, a transfer exercise with hint and model reasoning, and a three-point self-review.
- Six foundation study units: concrete hand calculations and edge cases matching each lesson's actual output/indexing contract.
- 25 DSA pattern workshops available in all 100 roadmap problems: baseline, optimization, proof obligation, complexity, caveats and a saved test/solution plan. Existing problem-specific walkthroughs and five explained inputs remain part of each workshop.
- Seven track projects: three milestones, review guidance, evidence collection, four acceptance/self-review criteria, saved work and Markdown export.
- Every track exposes the three reference links, their pedagogical role and the access scope reviewed.

All text, worked inputs, exercises, projects and UI in this implementation were authored for Trace. The work adapts pedagogical patterns and established CS ideas. It does not reproduce another provider's proprietary question bank, videos, diagrams, paid lesson wording or assignment solutions.

## Coverage boundaries

Trace is still a focused learning platform built around its existing lab/problem set. These additions deepen those lessons; they do not establish equivalence to entire university courses or a provider's complete paid program. Broader benchmark topics outside the current interactive lab set include balanced-tree implementations and randomized/complexity-theory topics; distributed consensus and full storage sharding; database recovery and buffer-engine implementations; operating-system filesystem/kernel programming; distributed routing/security projects; and large IDE-based OOP application projects.

Those boundaries matter when describing or selling the product: say which interactive mechanisms and practice tools it supplies, rather than claiming a complete replacement for the benchmark courses. Self-review checks are learner judgments, not automatic grades or certifications.

## Quality checks

Structural coverage checks enforce a study unit for every CS/foundation lesson, a workshop for every DSA problem, and three distinct references plus a project for every track. The six foundation worked examples are checked against the executable Python reference. Browser verification checks the worked-step sequence, hint/model-solution flow, saved responses, project export and the transition to the existing visualization. Build and type checks verify the integrations.
