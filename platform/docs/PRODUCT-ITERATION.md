# Interactive workspace design decisions

Primary reference: Trace's existing six foundation lessons and shared roadmap workbench. The owner explicitly requested the same visual style across the product.

Preserve the dark blue/green canvas, aligned visualization and source panels, mint actions, amber scanning state, blue changed values, compact transport and readable explanations. New controls use the same surfaces and type scale. Input builders are native editable diagrams; no decorative imagery is needed.

| Decision | Source | Reason |
| --- | --- | --- |
| Keep the shared workbench and transport | Existing foundation lessons and owner request | Learners can move between problems without relearning controls. |
| Put builders and debugging controls in expandable sections | Existing lesson details and notebook patterns | Preserve the visualization/code reading area. |
| Use labelled native form controls and keyboard alternatives to dragging | Refero bundled craft-details guidance | Graphs and trees remain usable with keyboards and touch. |
| Use muted borders, mint actions and separate amber/blue algorithm states | Existing Trace styles | Preserve the meaning of colors. |
| Label each matrix check with its actual evidence and date | Owner's request to check everything | A successful build cannot imply a visual or runtime check passed. |
| Separate saved execution from playback control in classrooms | Supabase Postgres Changes documentation | A class receives an actual teacher run once and small playback updates afterward. |

Live Refero research was attempted but the service returned an inactive-subscription error. The existing product remains the locked build target, supplemented by the skill's bundled forms, accessibility and motion references.

Technical references: [Supabase Realtime](https://supabase.com/docs/guides/realtime/postgres-changes), [row access policies](https://supabase.com/docs/guides/database/postgres/row-level-security). The project owner handles acceptance testing; compiler/build checks do not establish user acceptance.
