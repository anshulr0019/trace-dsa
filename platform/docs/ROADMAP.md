# Product roadmap

## Implemented

- Six foundational lessons and a shared responsive workbench for the 100-problem roadmap.
- Complete references in Python, C++17, Java 8 and JavaScript; editable input, bounded browser execution, recorded states and playback.
- Practice cases, authored hints, browser correctness feedback, saved attempts and reference solution comparisons.
- Teacher lesson links with custom input and instructions, current-code replay links, and presentation mode.
- Prediction pauses based on recorded state, beginner pace, local notes, bookmarks, revision lists and concept learning paths.
- Notebook JSON export/import with validation and confirmed restoration.
- Product introduction, quick tour, showcase examples, demo script and pitch material.

## Implemented, awaiting external setup

Supabase email sign-in, explicit cross-device notebook backup/restore, class invitations, assignments, due dates, submissions and teacher views of explanations and code. See [setup](TEACHER-SETUP.md). These features require a configured database and authentication service; the application shows this requirement when they are unavailable.

## Owner acceptance testing

The project owner will test this product release. Compilation, dependency installation checks and a production build establish buildability; they do not verify classroom workflows or learning outcomes.

## Future work after a classroom pilot

- Automatic notebook synchronization with conflict handling and account data deletion/export.
- Teacher moderation of enrollment, class archiving and structured written feedback.
- Additional authored brute-force/optimized comparisons. Count operations explicitly; distinguish trace storage from auxiliary algorithm memory.
- Authoritative grading on isolated execution infrastructure before exams, rankings or competitions.
- Optional AI hints grounded in the learner's actual code, current input and recorded state.
- Private collaborative rooms with access controls and a shared playback model.
- Consent and retention policies appropriate to participating schools or organizations.

A commercial Java deployment also needs an appropriate CheerpJ licence. A recorded demo should follow the owner's acceptance testing and describe the configured features accurately.
