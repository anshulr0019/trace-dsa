# Language references

`catalog.ts` defines the 100 canonical problem IDs, inputs, sample answers and progression. The two existing foundational algorithms are linked, preserving their earlier lesson content and progress.

Python sources are split across four files and use `trace_support.py` for compact level-order trees and index-based linked lists. Python reports state before a line and on function return; nested frames expose the caller's algorithm state.

C++ sources are native implementations using STL and nlohmann JSON (vendored 3.12.0, MIT license included in the header). `trace.hpp` provides explicit checkpoints. JavaScript sources run in Node and use an included binary heap where needed. Set/Map snapshots preserve their contents across the VM context boundary. Both checkpoint languages capture the actual calling line.

`formatted-sources.json` is a checked-in generated artifact consumed by the editor. Regenerate after editing C++ or JavaScript banks with:

```sh
node --import tsx scripts/format-curriculum.ts
```

The formatter removes unused support helpers and makes each solution readable before it reaches the editor. It does not change the algorithms. Saved browser drafts remain user-owned; use **Reset code** to load a newer reference.

Supported runtime languages are Python, C++17 and JavaScript. Additional languages require a real runtime adapter and reference/test coverage. No selector option claims unavailable execution. The runner is local macOS development middleware; deployment of a public execution service is separate work.

Reference inputs use ASCII strings so character indexing is consistent across these three implementations. Learning inputs are deliberately small. Solutions retain normal language numeric limits; C++ uses 64-bit counts and JavaScript uses IEEE-754 numbers. Python returned answers are never silently shortened to match the bounded visualization previews.
