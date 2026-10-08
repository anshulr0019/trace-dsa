# Teaching research → Trace interactions

Reviewed 7 October 2026. These are selected strong public resources, not an objective ranking of every course. Scope: course syllabi, accessible teaching pages and selected project specifications. No claim to have completed their courses or watched every lecture. Educative's public course page did not expose usable lesson content in this session and was not used as a teaching source.

## Sources and observations

| Track | Primary material reviewed | Teaching observation | Original Trace adaptation |
|---|---|---|---|
| DSA | [MIT 6.006 syllabus](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/pages/syllabus/) and [lecture 1 page](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/resources/lecture-1-algorithms-and-computation/) | Connect algorithms, implementation, correctness and work. | A four-stage learning route plus actual recorded before/after variables in all roadmap problems. Existing prediction and complexity tools remain available. |
| System design | [MIT 6.5840](https://pdos.csail.mit.edu/6.824/) and [Raft lab](https://pdos.csail.mit.edu/6.824/labs/lab-raft1.html) | Case studies and incremental implementation expose fault tolerance, replication and consistency. | Compare normal, overloaded and unavailable-component examples; inspect computed outcomes. Trace's capacity models remain explicitly simplified. |
| Databases | [Berkeley CS186](https://cs186berkeley.net/fa24/), [joins/optimization project outline](https://cs186.gitbook.io/project/assignments/proj3), [concurrency project outline](https://cs186.gitbook.io/project/assignments/proj4) | Topics connect to projects involving query execution, optimization and locking. | Pair scenario traces; inspect changes to rows, cells and metrics; predict a recorded result. |
| OS | [OSTEP simulator homework](https://pages.cs.wisc.edu/~remzi/OSTEP/Homework/homework.html) | Learners calculate an answer before revealing a simulator result, then vary inputs. | Prediction checkpoints derive answers from the existing model. Compare workload/policy examples, with differing settings disclosed. |
| Networks | [Stanford CS144](https://cs144.github.io/) and [checkpoint 1 specification](https://cs144.github.io/assignments/check1.pdf) | Small components build a reliable abstraction over unreliable delivery; hands-on observations support implementation. | Inspect sequential events, compare loss/recovery conditions, animate new chart segments, and keep previous values visible. |
| OOP | [Refactoring.Guru Strategy lesson](https://refactoring.guru/design-patterns/strategy) | A concrete changing requirement motivates structure, delegation and implementation choices. This is a teaching reference, not a university course. | Trace responsibility through the existing object diagrams, compare behavior variants, and explain what stays unchanged. |
| Interviews | [Tech Interview Handbook process guide](https://www.techinterviewhandbook.org/coding-interview-cheatsheet/) | Clarify, consider approaches, explain trade-offs, implement and check edge cases. | Clickable reasoning stages alongside each prompt and the existing self-review. No automated grading claim. |

## Reference lock and decision ledger

Primary visual reference: Trace's existing guided-foundation Bubble Sort experience. Preserve the dark canvas, green activity accent, monospace state values, aligned panels, existing 850 ms playback and reduced-motion preference. Refero's live library returned NO_SUBSCRIPTION; bundled motion guidance was used.

| Decision | Basis | Role |
|---|---|---|
| Before → after state tiles | Actual Trace snapshots + motion continuity guidance | Explain measured changes; never imply an unrecorded state |
| Short prediction, then reveal | OSTEP exercise pattern | Feedback from model output, not generated guesses |
| Two examples side by side | Existing Trace examples + case-based instruction | Compare outcomes while showing differing settings; equal step index does not mean equal physical time |
| Animated new chart segment and timeline entry | Motion guidance: hierarchy and continuity | Draw attention to the new measurement, with reduced-motion support |
| Learning route and reasoning stages | Course synthesis above | Support learner actions, not a claim of certification or mastery |

All new wording, UI and interaction code are original. No course videos, diagrams, assignment solutions, branded assets or paid lesson text are reproduced. Source links are further-reading references; no affiliation is implied.

## Verification scope

Unit checks cover state additions/removals, nested values, prediction correctness, and all 105 presets across 35 CS modules. Browser checks cover prediction reveal, comparison playback and responsive layout. The language follow-up adds real C++/Java/JavaScript execution to all six foundations, keeps separate drafts, and retains shared motion timing. The roadmap has references for all 100 problems in all four languages. Verification includes 37 targeted tests, 23 compiled C++ inputs and all six default Java foundation runs in the browser; JavaScript default and boundary outputs are compared with the Python reference. This does not establish end-to-end correctness of every algorithm or reproduce the full scope of any source course.

## Foundation language integration (9 October 2026)

The former Python-only foundation panel now selects Python, C++17, Java and JavaScript. Python keeps the original guided interpreter. The other languages use the same browser runtimes as the roadmap, with actual checkpoints adapted to the existing foundation animations. Only assignments supported by both source and recorded values produce transfer cues; repeated identical snapshots are skipped. Python's guided runner still accepts its documented subset. Cross-language code drafts and replay links preserve the language.
