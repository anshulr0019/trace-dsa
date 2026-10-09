# Readable lessons and practical learning

## Implemented

- Foundations, the 100-problem roadmap, and CS labs place the visual workspace before expanded study material. Understand, Watch, Try, Solve, and Review control the learning journey.
- Desktop playback focuses the visual and code workspace. Narrow screens provide Visualization, Code & state, and Explanation tabs. The roadmap sidebar returns to the problem list.
- The algorithm view hides tracing boilerplate while retaining original source line positions. Full source and the editable four-language editor remain available. Execution always uses the original source.
- Roadmap exercises use the selected input, language, and actual recorded execution. Learners predict scalar, collection, or grid changes. Fixed-window lessons also offer a window exercise built from the selected values and k.
- Progress distinguishes exploration, visual/quiz practice, supported code submissions, and independent submissions. Revision dates use the most recent successful attempt. Existing review marks and successful code attempts are imported without changing saved drafts or attempt history.
- My progress summarizes activity across foundations, DSA, CS, and SQLite practice. The notebook includes automatic revision reminders alongside learner-scheduled dates.
- Large workspaces, reference solutions, scenes, and CodeMirror load in separate bundles. Initial application JavaScript changed from 729.89 kB gzip to 319.85 kB gzip (about 56% smaller). This measures bundle transfer size, not device load time. Large-chunk warnings remain for the application and editor.

## Verification

- TypeScript and Vercel production build passed.
- 16 targeted tests passed: all 400 reference source projections, actual trace predictions, 105 CS scenarios, playback timing, backup restoration, legacy progress migration, and executable SQLite queries/constraints.
- Browser checks covered Java window playback/prediction, Java foundation bubble sort, JavaScript grid prediction, CS network playback, the full Java editor, practice navigation, progress updates, sidebar return, and a 390 × 844 mobile viewport.
- These checks do not constitute a manual review of every problem and every language/runtime combination.

## Remaining account setup

Cloud accounts and shared classes require a Supabase project URL and public publishable key, database migrations, and the authentication redirect configuration described in `platform/docs/TEACHER-SETUP.md`. Those project details were unavailable during this release. Local learning and backups work independently of this setup.

## Suggested pilot

Invite one teacher and a small student group after account setup. Ask each student to complete a foundation lesson, one roadmap prediction, an independent solution, a CS scenario, and a SQLite task. Have the teacher create a class, collect submissions, and export the progress matrix. Collect feedback on whether the animation explains the decision, whether the next action is clear, and where the learner becomes stuck. Record browser/device, lesson, language, input, and steps for each reported issue.

No pilot invitations, public posts, payment collection, or paid service setup were performed by this release.
