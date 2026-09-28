# Problem workspace and browser execution

The published workspace called an unconfigured hosted runner, while the Play
button remained active even when Run was disabled. The panels also stacked fixed
340px, 220px, 100px and 190px regions, leaving empty gaps and pushing playback out
of view.

## Implementation

- The shared runtime client uses a connected server when available. Otherwise,
  Python and JavaScript execute the actual edited source in a disposable worker.
- Pyodide and its standard library are served with the site's assets. The worker
  is bundled independently so Vite's development client cannot inject references
  to `window` into the worker.
- Loading, execution timeouts, cancellation, syntax/runtime errors, source lines,
  stdout, trace limits and fresh state per run are supported.
- C++ retains its saved editor content and explains the compiler requirement;
  Play, Run, example checks and practice checks share language-aware availability.
- Practice uses the shared grading engine on the device when the server is absent.
  These checks do not masquerade as server-verified account grades.

## Design reference lock

The existing Trace design and the user's screenshot are the primary references.
Live Refero research returned an inactive-subscription error. Bundled Refero
typography and craft guidance supplies the secondary spacing, type and responsive
rules.

| Decision | Source and role |
| --- | --- |
| Preserve sidebar, dark canvas and mint actions | User constraint and existing product |
| Shared panel height and header baseline | Screenshot alignment issue |
| Compact example selector and grouped tools | Craft hierarchy and user focus on problem work |
| Flexible scene with bounded inspector | Remove empty fixed-height gaps while keeping controls stable |
| Run action above source; playback at panel bottom | Keep actions discoverable and reachable |
| Stack panels at narrow widths | Craft overflow and responsive rules |
| Neutral interface text; monospace source and state | Typography role discipline |

The full problem walkthrough remains available below the workspace. No bitmap
assets or sidebar changes are needed.

## Verification

- 102 WebAssembly Python tests passed: all 100 problem references, edited code,
  stdout, source-line errors and the trace limit.
- 333 native execution, automatic tracing, practice and playback regressions passed.
- Real Chrome checks passed all 100 JavaScript references with automatic tracing,
  edited source, syntax errors, timeout and cancellation, with server execution
  deliberately unavailable.
- Browser-based Python practice passed the full eight-case suite.
- The built production site passed Python and JavaScript runs in local Wrangler.
- Desktop panel baselines/heights and visible playback were asserted at 1440×1000;
  no page-level horizontal overflow at widths 1100, 768 and 390. Screenshots were
  inspected at desktop and mobile sizes.
- TypeScript, targeted lint, diff whitespace checks and the production build passed.

The user explicitly approved source upload and live publication. Publication is
currently blocked because Sites returns `project_not_found` for the existing
project when reading it and requesting upload credentials. No changes have been
uploaded or published. Reconnect the owning account/workspace before retrying.
