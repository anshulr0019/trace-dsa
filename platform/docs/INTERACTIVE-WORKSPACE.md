# Interactive workspace guide

## Experiment with inputs

Open a roadmap problem and expand **Interactive input builder**. Edit array cells, add/remove values, change grid cells, add tree children, or connect graph nodes. Graph nodes also support dragging and arrow keys; connecting nodes has a keyboard alternative. Apply the input before playing. Node positions change the builder drawing; edges and weights are the algorithm input.

Tree serialization uses compact level order. Null children do not receive descendants. Graph inputs follow the chosen problem's directed/undirected, weighted and index conventions. In course prerequisites, the stored pair is course/prerequisite; the arrow depicts prerequisite to course.

## Inspect recorded execution

Expand **Visual debugger** to add source-line breakpoints and watched paths such as `total` or `nums[2]`. Watch values also appear beside the source during playback. Breakpoints stop playback at captured source lines; they do not suspend the worker while the code executes.

Step into selects the next recorded state. Step over/out use captured stack depth. Those controls are disabled when a state has no recorded stack. Java uses explicit checkpoints; a breakpoint at a line without a captured checkpoint will not stop playback. Watches do not evaluate expressions or infer unrecorded variables. Editing source clears its breakpoints.

## Investigate a wrong answer

**Find my mistake** checks the current source against five learning examples and three practice cases, stopping at the first failure. Load that input and its actual trace into the main workbench. Compare it with a reference run verified against the same expected answer.

The two traces can have different intermediate states because approaches and checkpoint placement differ. The comparison does not declare the first differing state to be the incorrect decision. Runtime errors and returned/expected answers provide the concrete evidence; the learner inspects the code and reasoning.

## Keep your own study work

Save a custom variant with its code, input and question, or save a named code version. The notebook lists custom variants and scheduled revision dates. Versions retain the latest 12 per base problem; custom variants retain the latest 40. A failing case can enter the mistake journal, which retains the latest 12 per problem. Restore supports undo in the study panel.

These variants use a base roadmap problem's input contract and visualization. The authored correctness suite still checks that base problem's goal. A different mathematical task needs its own expected answers rather than interpreting a base-suite failure as proof of a mistake.

## Review and deployment

The implementation has TypeScript and production-build checks and a visual layout review. User acceptance testing remains with the project owner. The owner matrix starts with **Not checked** values and never infers a visual check from a successful build.

Database-backed features use the migrations and configuration in [Teacher setup](TEACHER-SETUP.md). Without those connections, the interface explains which features need setup.
