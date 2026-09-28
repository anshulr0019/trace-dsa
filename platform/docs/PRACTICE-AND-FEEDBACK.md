# Practice and feedback

All 100 curriculum problems now include Predict, Solve, and Challenge modes. Three practice inputs per problem join the five worked examples for an eight-case suite. The new bank contains 300 inputs; one N-Queens board size also appears in its worked examples because the supported board sizes are deliberately bounded. Answers were cross-checked against Python and JavaScript references with `scripts/verify-practice.ts`.

## Learner behavior

- Practice opens from the problem's mode switch or the button below its explanation. `practice=1` preserves the selected surface on reload.
- Each problem/language/level has a separate starter-code draft, hints, reflection, and original-code backup. Browser storage keeps temporary drafts; storage failures are displayed.
- Predictions are checked on the server without executing code. Solutions run against eight server-selected cases. Each case has equal weight: score = passed / total × 100.
- The rating is correctness on the suite, not a proof, benchmark, efficiency score, or readability score. Equivalent valid outputs are recognized for supported non-unique-answer problems.
- Progressive hints and reference/AI help mark an attempt assisted. Confidence requires two distinct case selections solved independently, including a challenge with a written reflection. This is a self-study indicator, not a tamper-proof certification or competitive ranking; help usage is client-reported and written reflections are not automatically assessed.
- Optimization preserves the user's code until they choose Use this version. Every proposed code replacement passes the same suite first. Restore my original code remains available after adoption. An AI no-change response never silently substitutes a reference solution.
- Without AI credentials, authored hints and a verified reference comparison remain functional. Efficiency copy explicitly refers to the reference implementation.
- Playback uses a visibility-aware animation clock and speed-scaled transitions for arrays, pointers, networks, stack changes, and recursion frames. Reduced-motion preferences are honored.

## Run locally

`npm run dev` on the supported Mac enables the existing Seatbelt-isolated Python, JavaScript, and C++ runtimes plus `/api/practice`. Checks are loopback-only and same-origin. Two practice requests can run concurrently. Cancel aborts subsequent cases and kills the active local process group. Existing CPU/output/trace limits remain in place.

Attempts in local development stay in this browser. Hosted account history is separate; local attempts are not silently uploaded or treated as authoritative.

## Hosted connections still required

The production build has protected routes and a D1 migration, but this does not provision a language execution service or an AI account.

1. Publish to the existing private Sites project with the logical `DB` binding. Sites applies the generated `drizzle/0000_curvy_onslaught.sql` migration. Do not edit applied migrations.
2. Configure `TRACE_EXECUTION_URL` and secret `TRACE_EXECUTION_TOKEN` for a separately provisioned, isolated execution service over HTTPS. Its POST contract accepts `{language, code, input, problemId, automatic}` and returns `{frames, result, error, stdout, truncated}` matching the local runtime. It must enforce sandbox isolation, bounded time/memory/output, concurrency limits, and cancellation. Never expose the development runner publicly or run visitor code directly inside the web Worker. The adapter is implemented; an execution service has not been deployed or integration-tested remotely.
3. To enable optional AI reviews, configure secret `OPENAI_API_KEY` and `TRACE_AI_MODEL` on the server (locally via an ignored `.env.local`, in production through Sites settings). Choose a Responses API model supporting structured outputs. No API key is bundled or requested from visitors. No live AI call has been tested without credentials.
4. Account history uses the Sites dispatcher-provided identity and user-scoped prepared D1 statements. Hosted routes require sign-in and same-origin POSTs, and enforce per-user execution/AI usage limits. Do not expose the Worker behind an untrusted proxy that allows visitors to forge identity headers.

AI integration follows the [official Structured Outputs documentation](https://developers.openai.com/api/docs/guides/structured-outputs), requests `store:false`, has no model tools, and validates structured responses. AI reviews are advisory; generated code is tested independently before adoption.

## Verification

- `npx tsc --noEmit`
- `node --import tsx --test tests/practice.test.mjs tests/playback.test.mjs tests/engine.test.mjs`
- `node --import tsx scripts/verify-practice.ts` (supported Mac; regenerates answers after cross-language agreement)
- `npm run build`

Integration checks cover all three local languages, partial and invalid submissions, alternate valid outputs, cancellation, per-user storage isolation and limits, AI refusal parsing, no-change responses, and verified proposals. AI checks use mocked API responses. Browser QA covers prediction, rating, reference adoption/undo, draft reload, challenge validation, and responsive layout.

## Design reference lock

Primary reference: the existing Trace studio and curriculum workbench. Preserve graphite/green surfaces, mint primary actions, monospace code, adjacent input/editor panes, and visible playback controls. Refero live style research returned NO_SUBSCRIPTION; its bundled motion guidance supplies interruptible, short state transitions and reduced-motion behavior. Three learning stages follow the approved user brief; the rating panel exposes its evidence and rubric instead of presenting an unexplained score.

## Publication status

The user explicitly authorized uploading this source and deploying it to the existing private Trace site. Publication preserves owner-only access. Optional AI review and hosted language execution still require the service connections described above.

## Playback layout refinement

Preserve the existing Trace graphite/green workbench as the design reference. Following the bundled Refero motion guidance, changing explanations and scalar values enter with a short 180ms fade and 3px movement, disabled for reduced motion. Keep diagram tracks unchanged. Fixed-height, scrollable state and explanation regions prevent roadmap and practice controls moving between frames; the guided transport is portalled to the document body so route transforms cannot change its viewport anchor. The six original lessons are labeled Guided foundations, with their relationship to the 100-problem roadmap explained in the library.
