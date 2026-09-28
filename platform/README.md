# Trace — DSA Learning Studio

A visual DSA learning platform with six foundational lessons and a 100-problem, four-tier curriculum. All 100 curriculum problems have editable Python, C++17 and JavaScript references, custom JSON inputs, actual execution results, and state visualizations.

## Run locally

Requires Node 22.13+ for the application (Node 24+ recommended for the native TypeScript test runner).

The curriculum code runner currently supports this macOS machine: Homebrew Python 3.14 at `/opt/homebrew/bin/python3`, Apple Command Line Tools for C++17, and the Node executable running the dev server. It uses macOS Seatbelt and refuses execution on unsupported hosts. Java and other language runtimes are not provided.

```sh
npm install
npm run dev
```

Open `http://localhost:5173/?view=curriculum`. The bundled Sites runtime uses React 19, TypeScript, Vinext, Vite, and a Cloudflare Worker build. Python, C++17 and JavaScript run in disposable browser workers when no server runner is connected, including on the published site. Python uses the pinned Pyodide CPython/WebAssembly runtime. C++ uses the MIT-licensed `@live-codes/clang-wasm` toolchain with assets served by the site. The six foundational browser-worker lessons remain independent of it.

`npm run dev` and `npm run build` prepare browser workers and runtime assets in `public/browser-runtime/`. These generated assets are included in the built site. Re-run `node scripts/prepare-browser-runtime.mjs` after editing the browser worker or C++ trace header during a running development session. Browser C++ loads about 28 MB of compiler assets on first use and supports the project's C++17 references and trace checkpoints. This WebAssembly toolchain does not support general C++ exception handling; reference `runtime_error` checks are adapted to report errors in the browser. Browser C++ has a 120-second initialization deadline and a 30-second compile/run deadline; Python and JavaScript keep their 60-second initialization and six-second execution deadlines. Cancellation terminates the worker. Each run starts with fresh program state. Automatic traces are bounded to 1,200 frames and 30,000 observed steps. This worker keeps computation off the UI thread; it is not a network-isolation security boundary.

Browser practice checks use the same eight-case grading rules and store attempts on this device. They are educational feedback, not trusted account grades. AI review continues to require a connected service.

## Practice and feedback

Every curriculum problem now includes Predict, Solve, and Challenge modes, with 300 practice inputs, eight-case correctness ratings, saved drafts and attempts, and verified solution comparisons with explicit adoption and undo. Playback has smooth, speed-aware transitions and reduced-motion support. See [Practice and feedback](docs/PRACTICE-AND-FEEDBACK.md) for behavior, verification, optional AI configuration, and hosted prerequisites.

## Validate

```sh
npx tsc --noEmit
node --test tests/engine.test.mjs
node --import tsx --test tests/curriculum.test.mjs tests/languages.test.mjs
node --import tsx --test tests/practice.test.mjs tests/playback.test.mjs
node --import tsx --test tests/browser-python.test.mjs
npm run build
```

## Implemented

- 100 unique problems in the requested 25 patterns and Concept / Direct / Disguised / Edge-case trap sequence. Two Sum II and Standard Binary Search link their existing foundational lessons.
- 300 complete reference solutions: Python, C++17 and JavaScript. CodeMirror provides syntax colors, indentation, undo/redo and Cmd/Ctrl+Enter execution.
- Arrays and strings, interval plots, linked pointers, tree edges, tries, graph edges and union-find parents, grids, stacks, heaps, backtracking state, DP tables and 32-bit rows.
- Actual Python line tracing; C++ `TRACE` and JavaScript `trace` checkpoints capture the variables supplied by the edited program. Animations never substitute reference execution for user code.
- Play, pause, speed, step backward/forward, timeline seeking, changed-value highlights and source line highlighting.
- Editable JSON input with problem constraints and visualization-size limits. Compile/runtime errors and stdout appear in the console. A stale-run banner identifies traces from an earlier editor/input version.
- Per-problem, per-language drafts and understanding marks in local storage. Problem and language URLs support reloads and sharing on the same local server.
- Same-origin, loopback-only execution endpoint; no network or personal-file access inside the subprocess sandbox. Runs have a 6-second timeout, compilation 25 seconds, trace 1,200 states, response 8 MB. Python additionally limits CPU time, file size and open files. These are local learning tools, not a public multi-tenant execution platform.

### Original foundational studio

- Six lessons: two sum, binary search, sliding window, bubble sort, insertion sort, prefix sums.
- Play/pause, adjustable speed, next/previous, reset, and keyboard-accessible timeline seek.
- Synchronized code highlighting, actual variables, array mutation, and labeled pointers.
- Editable inputs with sortedness and boundary validation.
- Editable bounded Python subset, parsed and evaluated in a Web Worker. No JavaScript eval or Function.
- Real operation counts for reference approach comparisons, including preprocessing caveats and unfavorable small-input cases.
- Eighteen authored questions, explanation feedback, and graduated lesson hints.
- Browser-local progress, reload recovery, lesson URLs, replay sharing, and JSON replay export.
- Responsive navigation, reduced-motion support, and keyboard controls.

## Execution contract

Supported values: bounded numbers, booleans, None, and flat numeric lists. Supported syntax: assignments (including list indices), arithmetic, short-circuit and/or, comparisons, if/else, while, for, break, and len/range/min/max/abs. Four-space indentation is recommended. No imports, function definitions, recursion, methods, strings, classes, arbitrary modules, file access, or network access.

Snapshots describe state **after** the highlighted statement or condition. The final snapshot has no highlighted line. Backward stepping selects earlier immutable snapshots; it never re-executes side effects. Aliased arrays are cloned together so identity is preserved within each snapshot.

The interpreter limits source length, list size, nesting, variables, steps, and arithmetic magnitude. The worker has a timeout. It is an educational interpreter, not CPython. Language semantics intentionally reject unsupported constructs. A bounded synchronous fallback is used if worker construction is unavailable.

The visual view uses conventional pointer names (`left`, `right`, `mid`, `i`, `j`). Custom code produces actual state traces, but the lesson hints, invariant, asymptotic complexity, and comparison counts still refer to the reference implementation. They are labeled accordingly. Comparisons count selected algorithm operations, not interpreter overhead or animation duration.

## Structure

- `lib/trace/interpreter.ts`: tokenizer, expression parser, block parser, bounded evaluator, snapshots.
- `lib/trace/runner.worker.ts`: worker protocol.
- `lib/lessons.ts`: lesson content, reference code, questions, input validation, comparison counters.
- `components/studio.tsx`: application state and learning UI.
- `app/globals.css`: dark workbench theme and responsive layout.
- `tests/engine.test.mjs`: correctness, boundary, mutation, edited-code and resource-limit checks.
- `docs/BUILD.md`: scope and reference decisions.
- `docs/ROADMAP.md`: remaining platform work.

Local progress stays in this browser. Hosted account history and optional AI reviews require the connections described in the practice guide; neither is simulated. Replay links contain the shared source and input in their URL fragment; private deployment access still applies.
