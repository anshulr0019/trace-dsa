# Trace: first product slice

Audience: students who know syntax but struggle to reason about algorithms.
Build target: a dark algorithm workbench, directly usable on arrival.

## Reference lock

Live Refero research was attempted but unavailable (inactive subscription). Fallback references: Refero typography, color and craft-details; VisuAlgo custom-input visualizations and Python Tutor synchronized source/state, reviewed in the product assessment.

| Decision                                                              | Reference                                       | Role                                               |
| --------------------------------------------------------------------- | ----------------------------------------------- | -------------------------------------------------- |
| Near-black canvas, 16px body, neutral system sans                     | User dark-mode brief + Refero typography        | Product UI, no decorative display type             |
| Code and numeric values in monospace                                  | Refero developer-tool typography                | Code/state only                                    |
| Mint primary action and left pointer; amber right pointer with labels | User high-contrast states + craft accessibility | Consistent operational meaning, never color alone  |
| Lessons beside source and replay                                      | VisuAlgo + Python Tutor                         | Discovery and synchronized understanding           |
| Predict/explain/transfer exercises                                    | Product review                                  | Active learning and local progress                 |
| SVG diagrams and array cells                                          | User algorithm sandbox                          | Functional data geometry, no bitmap imagery needed |

## Release boundary

This release implements six lessons, a bounded Python-subset interpreter, actual edited-code traces in a worker, backward/forward/seek, comparisons, authored hints, practice, and browser-local progress. Full CPython, recursive stack frames, accounts, cloud progress, realtime collaboration, AI providers and college leaderboards are later integration work. No fake services or simulated multiplayer.

The Sites starter uses React + TypeScript with Next-compatible App Router through Vinext. Keep trace/lesson modules framework-independent so deployment/runtime choices can change.

## Verification

- TypeScript check and production Worker build passed.
- Engine tests cover reference lessons, random sorting inputs, empty/negative/duplicate inputs, window boundaries, prefix resizing, alias snapshots, edited code, short-circuit behavior, and execution limits.
- Browser QA verified forward/backward stepping, end seeking, edited-code results, sorted-input errors, operation comparisons, practice explanations, persistence across reload, and the lesson library.
- Desktop and mobile layouts inspected. Mobile navigation closes after choosing a lesson, with no page-level horizontal overflow; long arrays scroll inside the visualization.
- Publication stopped: automatic approval review rejected uploading the new source/build to the private Sites source repository without explicit destination authorization. No source was uploaded. Local preview remains available.
