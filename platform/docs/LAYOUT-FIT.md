# Responsive visualization review

Target: existing Trace UI and the supplied Minimum Window Substring screenshot.
Keep the current colors, typography, state colors, code syntax, and panel structure.
Refero live style/screen research was unavailable (inactive subscription). The bundled
Craft Details reference informed ResizeObserver measurement and keyboard/touch access.

Decisions:
- Fit ordinary arrays to the available panel; wrap long arrays with continuous indices.
  Source: user's clipped string screenshot and request to avoid scrolling through lists.
- Compute pointers and active range segments from the same row geometry as the cells.
  Source: existing animated visualization semantics.
- Let visualization and exercise panels grow with their contents, rather than trapping
  the learner in nested vertical scrolling. Keep source-editor scrolling for long code.
  Source: the user's request and the observed fixed-height overflow.
- Scale coordinate-based matrices and foundational drawings within their containers.
  Source: existing diagrams must keep their positional relationships.
- Compact sidebar spacing on laptops so the six lesson links remain discoverable.
  Source: screenshot and measured sidebar clipping at normal laptop heights.
