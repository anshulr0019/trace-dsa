# Roadmap concept visualizations

All 100 roadmap problems use the foundation visual language: a dark stage, green focus, amber boundaries/frontiers, blue changes/dependencies, aligned code, and a persistent explanation. Play enters a desktop layout that fits the workbench above the transport controls. Large diagrams can scroll; the explanation is a separate, visible panel.

## Coverage

| Problem family | Stage |
| --- | --- |
| Arrays, strings, sliding windows, binary search, greedy, KMP | Indexed foundation tiles, moving pointers, window ranges, counts and metrics; terrain bars for water/histogram problems |
| Stacks and parsing | Input tiles and animated vertical stack, with push/pop observations |
| Linked lists | Stable node identities, animated next links, cycle and random-pointer connections |
| Intervals | Intervals on a common numbered axis, room end times and merged output |
| Trees | Tree edges, current node, BFS frontier and recursive contributions |
| Tries | Shared-prefix branches and terminal markers |
| Grids | Indexed cells, visited/frontier states, island components, ocean reachability and priority frontier |
| Graphs | Weighted/directed connections, distances, prerequisites, ready queues and union-find groups |
| Heaps | Array-backed heap trees; separate lower/upper heaps for streaming median |
| Backtracking | Growing/shrinking choice paths and collected solutions; N-Queens gets a chessboard with attacked squares |
| Dynamic programming | Prefix-labelled tables or state cards, reference dependencies and recurrences; sign-count and stock-state views |
| Bit operations | 32-bit rows with observed changes |

Cells, DP cards and nodes are keyboard accessible and can be selected to inspect values. Large grids show a bounded window that follows the current indices; pan buttons and “Follow step” control it. Larger diagrams explicitly report display limits. Playback speed and reduced-motion preferences affect movement.

## Recorded state and teaching annotations

The stage reads actual input and captured frames. Unrecorded values remain absent or marked `·`. Green focus means the recorded indices/pointers, which may be immediately before a statement executes. A reference DP recurrence is explicitly labelled; it is not a claim that custom code used that recurrence. Queen attack squares and input graph connections are structural teaching annotations.

N-Queens references now capture rejection, placement and undo checkpoints in JavaScript, C++ and Java. Pacific/Atlantic checkpoints retain both ocean sets/matrices, and Build Matrix placement checkpoints retain both topological orders. Python already captures local variables at line boundaries. Saved user drafts remain user code; adopt/reset the guided reference to use its newer explicit checkpoints.

Automatic visualization expects reference variable conventions (`grid`, `dp`, `links`, `current`, etc.). Custom variable names can still use the manual “Visualize variable” binding. Opaque objects or absent checkpoints cannot be reconstructed as precise algorithm motion.

## Verification

`node --import tsx --test tests/visual-state.test.mjs` checks coordinate and boolean-grid snapshots, cyclic parent handling, input preservation, DP boundaries and queen explanations. TypeScript and the Vercel production build are separate checks. Representative browser playback reviews cover layout and visual behavior; they do not certify all 100 problems in all four languages. The owner acceptance matrix remains the place for that full testing.
