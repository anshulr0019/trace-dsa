"use client";
import { useEffect, useRef } from "react";
import {
  EditorView,
  lineNumbers,
  highlightActiveLine,
  keymap,
  Decoration,
  gutter,
  GutterMarker,
} from "@codemirror/view";
import { EditorState, StateEffect, StateField } from "@codemirror/state";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import {
  syntaxHighlighting,
  HighlightStyle,
  bracketMatching,
} from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { javascript } from "@codemirror/lang-javascript";
const breakpointEffect = StateEffect.define<number[]>();
const breakpointField = StateField.define<number[]>({
  create: () => [],
  update(value, tr) {
    for (const e of tr.effects) if (e.is(breakpointEffect)) value = e.value;
    return value;
  },
});
const markLine = StateEffect.define<number>();
const codeColors = HighlightStyle.define([
  { tag: tags.keyword, color: "#c5b4ee" },
  { tag: tags.string, color: "#dbc58f" },
  { tag: tags.number, color: "#a9d5ea" },
  { tag: tags.comment, color: "#89a093" },
  { tag: tags.typeName, color: "#a7d8b8" },
  { tag: tags.function(tags.variableName), color: "#b7d7ef" },
  { tag: tags.operator, color: "#bdd2c4" },
  { tag: tags.meta, color: "#a7c7bb" },
]);
const executionLine = StateField.define({
  create: () => Decoration.none,
  update(value, tr) {
    value = value.map(tr.changes);
    for (const e of tr.effects)
      if (e.is(markLine)) {
        value =
          e.value > 0 && e.value <= tr.state.doc.lines
            ? Decoration.set([
                Decoration.line({ class: "execution-line" }).range(
                  tr.state.doc.line(e.value).from,
                ),
              ])
            : Decoration.none;
      }
    return value;
  },
  provide: (f) => EditorView.decorations.from(f),
});
export function Editor({
  value,
  onChange,
  language,
  line,
  onRun,
  readOnly = false,
  breakpoints = [],
  onBreakpoint,
}: {
  value: string;
  onChange: (s: string) => void;
  language: string;
  line: number;
  onRun: () => void;
  readOnly?: boolean;
  breakpoints?: number[];
  onBreakpoint?: (line: number) => void;
}) {
  const host = useRef<HTMLDivElement>(null),
    editor = useRef<EditorView | null>(null);
  const change = useRef(onChange),
    run = useRef(onRun),
    toggle = useRef(onBreakpoint);
  change.current = onChange;
  run.current = onRun;
  toggle.current = onBreakpoint;
  useEffect(() => {
    if (!host.current) return;
    class BreakpointDot extends GutterMarker {
      constructor(
        readonly number: number,
        readonly active: boolean,
      ) {
        super();
      }
      eq(other: BreakpointDot) {
        return this.number === other.number && this.active === other.active;
      }
      toDOM() {
        const button = document.createElement("button");
        button.className = this.active
          ? "breakpoint-dot active"
          : "breakpoint-dot";
        button.textContent = this.active ? "●" : "○";
        button.type = "button";
        button.setAttribute(
          "aria-label",
          `${this.active ? "Remove" : "Add"} breakpoint at line ${this.number}`,
        );
        button.disabled = !this.number;
        button.onclick = () => toggle.current?.(this.number);
        return button;
      }
    }
    const view = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          EditorState.readOnly.of(readOnly),
          EditorView.editable.of(!readOnly),
          lineNumbers(),
          ...(onBreakpoint
            ? [
                breakpointField,
                gutter({
                  class: "breakpoint-gutter",
                  lineMarker: (view, line) =>
                    new BreakpointDot(
                      view.state.doc.lineAt(line.from).number,
                      view.state
                        .field(breakpointField)
                        .includes(view.state.doc.lineAt(line.from).number),
                    ),
                  lineMarkerChange: (update) =>
                    update.docChanged ||
                    update.transactions.some((t) =>
                      t.effects.some((e) => e.is(breakpointEffect)),
                    ),
                  initialSpacer: () => new BreakpointDot(0, false),
                }),
              ]
            : []),
          history(),
          highlightActiveLine(),
          bracketMatching(),
          executionLine,
          syntaxHighlighting(codeColors),
          language === "python"
            ? python()
            : language === "cpp"
              ? cpp()
              : language === "java"
                ? java()
                : javascript(),
          keymap.of([
            {
              key: "Mod-Enter",
              run: () => {
                run.current();
                return true;
              },
            },
            indentWithTab,
            ...defaultKeymap,
            ...historyKeymap,
          ]),
          EditorView.updateListener.of((v) => {
            if (v.docChanged) change.current(v.state.doc.toString());
          }),
          EditorView.theme(
            {
              "&": {
                height: "100%",
                fontSize: "12px",
                backgroundColor: "#111819",
                color: "#d6e3dc",
              },
              ".cm-scroller": {
                fontFamily: "var(--font-mono, monospace)",
                overflow: "auto",
              },
              ".cm-gutters": {
                backgroundColor: "#111819",
                color: "#657b70",
                border: "none",
              },
              ".cm-content": { padding: "16px 0", caretColor: "#a3e8bf" },
              ".cm-line": { padding: "0 14px" },
              ".cm-activeLine": { backgroundColor: "#ffffff05" },
              ".execution-line": {
                backgroundColor: "#9cddae18",
                boxShadow: "inset 2px 0 #a3e8bf",
              },
              ".cm-selectionBackground": {
                backgroundColor: "#456e55 !important",
              },
            },
            { dark: true },
          ),
          EditorView.contentAttributes.of({
            "aria-label": "Solution code editor",
          }),
        ],
      }),
    });
    editor.current = view;
    return () => {
      view.destroy();
      editor.current = null;
    };
    // Language changes recreate the parser; document changes are dispatched below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, readOnly]);
  useEffect(() => {
    const view = editor.current;
    if (view && view.state.doc.toString() !== value)
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: value },
      });
  }, [value]);
  useEffect(() => {
    const view = editor.current;
    if (!view) return;
    const effects: StateEffect<unknown>[] = [markLine.of(line)];
    if (line > 0 && line <= view.state.doc.lines)
      effects.push(
        EditorView.scrollIntoView(view.state.doc.line(line).from, {
          y: "nearest",
        }),
      );
    view.dispatch({ effects });
  }, [line]);
  useEffect(() => {
    const view = editor.current;
    if (view && onBreakpoint)
      view.dispatch({ effects: breakpointEffect.of(breakpoints) });
  }, [breakpoints, onBreakpoint, language, readOnly]);
  return <div ref={host} className="curriculum-editor" />;
}
