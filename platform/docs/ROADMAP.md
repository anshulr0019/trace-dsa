# Product roadmap

## Delivered foundation

Six interactive lessons and a tested, deterministic trace/replay architecture. Learning flow: explore → compare → predict/explain/transfer. Build and validate these mechanisms before broadening the runtime or services.

## Next: durable learner accounts and assessment

- Identity provider, session security, user-owned progress and attempts in Postgres (Neon or one chosen primary backend).
- Versioned lesson/question schema and server-side grading. Client-local quiz answers are not suitable for rankings.
- Independent implementation exercises, spaced retrieval, misconception tracking, instructor assignment links.
- Instrument learning events with a deliberate consent and retention policy.

## Full language execution

- Select a hardened execution provider; provision secrets and dedicated isolated workers.
- Implement a real CPython tracing adapter, object identity, stack frames, exceptions, and library-call policy.
- Bound trace bytes, chunk transfer, checkpoints/deltas, run cancellation, and queue/backpressure behavior.
- Keep the current browser interpreter visibly labeled until replaced. Never silently treat it as CPython.

## AI hints

- Add a server-side provider adapter and secret configuration.
- Ground prompts in a verified run ID, code version, trace cursor, misconception, and authored hint progression.
- Evaluate factual accuracy and spoiler rate; keep authored hints as fallback.

## Collaboration and competition

- Validate shared replays first. Add private rooms, authorization, presence, conflict-resolved text editing and a single authoritative replay control model.
- Choose realtime transport after validating the interaction; do not broadcast every frame through the database.
- Add authoritative judging, abuse protections and operation-count definitions before competitive scoring.
- College membership verification and opt-in leaderboards only after identity and credible assessment are established.

## Curriculum expansion

Recursion and stack frames → linked structures → trees and BFS/DFS → memoization/DP. Introduce runtime support and representations together. Add production case studies that explain real tradeoffs rather than language-only toggles.
