"use client";
import { lazy, Suspense, type ComponentProps } from "react";
const CodeEditor = lazy(() =>
  import("./editor-impl").then((m) => ({ default: m.Editor })),
);
export function Editor(props: ComponentProps<typeof CodeEditor>) {
  return (
    <Suspense
      fallback={
        <textarea
          className="curriculum-editor editor-loading"
          aria-label="Solution code editor loading"
          value={props.value}
          readOnly={props.readOnly}
          spellCheck={false}
          onChange={(e) => props.onChange(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              props.onRun();
            }
          }}
        />
      }
    >
      <CodeEditor {...props} />
    </Suspense>
  );
}
