"use client";
import { usePreferences } from "../experience/use-preferences";
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
import {
  EditorState,
  StateEffect,
  StateField,
  Compartment,
} from "@codemirror/state";
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
  indentUnit,
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
  { tag: tags.keyword, color: "var(--trace-color-c5b4ee, #c5b4ee)" },
  { tag: tags.string, color: "var(--trace-color-dbc58f, #dbc58f)" },
  { tag: tags.number, color: "var(--trace-color-a9d5ea, #a9d5ea)" },
  { tag: tags.comment, color: "var(--trace-color-89a093, #89a093)" },
  { tag: tags.typeName, color: "var(--trace-color-a7d8b8, #a7d8b8)" },
  {
    tag: tags.function(tags.variableName),
    color: "var(--trace-color-b7d7ef, #b7d7ef)",
  },
  { tag: tags.operator, color: "var(--trace-color-bdd2c4, #bdd2c4)" },
  { tag: tags.meta, color: "var(--trace-color-a7c7bb, #a7c7bb)" },
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
  const preferences = usePreferences();
  const editorPreferences = useRef(new Compartment());
  const extensions = () => [
    EditorState.tabSize.of(preferences.tabSize),
    indentUnit.of(" ".repeat(preferences.tabSize)),
    ...(preferences.wordWrap ? [EditorView.lineWrapping] : []),
    ...(preferences.lineNumbers ? [lineNumbers()] : []),
    ...(preferences.highlightLine ? [highlightActiveLine()] : []),
  ];
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
          editorPreferences.current.of(extensions()),
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
                fontSize: "var(--trace-editor-size, 13px)",
                backgroundColor: "var(--trace-color-111819, #111819)",
                color: "var(--trace-color-d6e3dc, #d6e3dc)",
              },
              ".cm-scroller": {
                fontFamily: "var(--font-mono, monospace)",
                overflow: "auto",
              },
              ".cm-gutters": {
                backgroundColor: "var(--trace-color-111819, #111819)",
                color: "var(--trace-color-657b70, #657b70)",
                border: "none",
              },
              ".cm-content": {
                padding: "16px 0",
                caretColor: "var(--trace-color-a3e8bf, #a3e8bf)",
              },
              ".cm-line": { padding: "0 14px" },
              ".cm-activeLine": {
                backgroundColor: "var(--trace-color-ffffff05, #ffffff05)",
              },
              ".execution-line": {
                backgroundColor: "var(--trace-color-9cddae18, #9cddae18)",
                boxShadow: "inset 2px 0 var(--trace-color-a3e8bf, #a3e8bf)",
              },
              ".cm-selectionBackground": {
                backgroundColor:
                  "var(--trace-color-456e55, #456e55) !important",
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
    editor.current?.dispatch({
      effects: editorPreferences.current.reconfigure(extensions()),
    });
  }, [
    preferences.tabSize,
    preferences.wordWrap,
    preferences.lineNumbers,
    preferences.highlightLine,
    language,
    readOnly,
  ]);
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
    const effects: StateEffect<unknown>[] = [
      markLine.of(preferences.highlightLine ? line : 0),
    ];
    if (line > 0 && line <= view.state.doc.lines)
      effects.push(
        EditorView.scrollIntoView(view.state.doc.line(line).from, {
          y: "nearest",
        }),
      );
    view.dispatch({ effects });
  }, [line, preferences.highlightLine]);
  useEffect(() => {
    const view = editor.current;
    if (view && onBreakpoint)
      view.dispatch({ effects: breakpointEffect.of(breakpoints) });
  }, [breakpoints, onBreakpoint, language, readOnly]);
  return <div ref={host} className="curriculum-editor" />;
}
