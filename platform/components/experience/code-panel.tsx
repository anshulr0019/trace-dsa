"use client";
import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import { Code2, RotateCcw, Play, ChevronRight, Terminal } from "lucide-react";
import type { Frame } from "@/lib/trace/interpreter";
import { foundationLanguages } from "@/lib/foundations/sources";
import type { Language } from "@/lib/curriculum/playground";
import type { Lesson } from "@/lib/lessons";
const format = (v: unknown, language: Language = "python"): string =>
  v === null
    ? language === "python"
      ? "None"
      : "null"
    : typeof v === "boolean"
      ? v
        ? "True"
        : "False"
      : Array.isArray(v)
        ? `[${v.join(", ")}]`
        : String(v);
function syntax(line: string) {
  return line
    .split(
      /(\b(?:while|if|else|for|in|break|None|True|False|and|or|not|let|const|int|auto|return|public|class|extends|import|null|true|false|new)\b|\b(?:len|range|max|min|abs)\b|\b\d+\b|#.*$)/g,
    )
    .map((part, i) => (
      <span
        key={i}
        className={
          /^(while|if|else|for|in|break|and|or|not|let|const|int|auto|return|public|class|extends|import|new)$/.test(
            part,
          )
            ? "syn-key"
            : /^(None|True|False|null|true|false|\d+)$/.test(part)
              ? "syn-num"
              : /^(len|range|max|min|abs)$/.test(part)
                ? "syn-call"
                : part.startsWith("#")
                  ? "syn-comment"
                  : ""
        }
      >
        {part}
      </span>
    ));
}
export function CodePanel({
  language = "python",
  onLanguageChange,
  frame,
  nextLine,
  lesson,
  editing,
  setEditing,
  setPlaying,
  code,
  setCode,
  executedCode,
  dirty,
  custom,
  running,
  error,
  resetCode,
  runEdits,
}: {
  language?: Language;
  onLanguageChange?: (language: Language) => void;
  frame: Frame;
  nextLine?: number;
  lesson: Lesson;
  editing: boolean;
  setEditing: Dispatch<SetStateAction<boolean>>;
  setPlaying: Dispatch<SetStateAction<boolean>>;
  code: string;
  setCode: Dispatch<SetStateAction<string>>;
  executedCode: string;
  dirty: boolean;
  custom: boolean;
  running: boolean;
  error?: string;
  resetCode: () => void;
  runEdits: () => void;
}) {
  const codeRef = useRef<HTMLDivElement | null>(null);
  const selectedLanguage = foundationLanguages.find((l) => l.id === language)!;
  const vars = Object.entries(frame.vars).filter(
    ([name]) => !["nums", "prefix", "result"].includes(name),
  );
  useEffect(() => {
    const parent = codeRef.current;
    const active = parent?.querySelector<HTMLElement>('[data-current="true"]');
    if (parent && active) {
      const top = active.offsetTop;
      if (
        top < parent.scrollTop ||
        top + 28 > parent.scrollTop + parent.clientHeight
      )
        parent.scrollTo({
          top: Math.max(0, top - parent.clientHeight / 2),
          behavior: "instant",
        });
    }
  }, [frame.line, nextLine]);
  return (
    <section className="code-panel panel">
      <div className="panel-title">
        <span>
          <Code2 size={16} />
          Implementation
        </span>
        <button
          className="text-button"
          disabled={running}
          onClick={() => {
            setPlaying(false);
            setEditing((e) => !e);
          }}
        >
          {editing ? "View trace" : "Edit code"}
          <Code2 size={13} />
        </button>
      </div>
      <div className="file-tab">
        <span className="python-dot" /> {lesson.id.replaceAll("-", "_")}.
        {selectedLanguage.extension}{" "}
        {onLanguageChange ? (
          <select
            aria-label="Programming language"
            value={language}
            disabled={running}
            onChange={(e) => onLanguageChange(e.target.value as Language)}
          >
            {foundationLanguages.map((l) => (
              <option value={l.id} key={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        ) : (
          <span>{selectedLanguage.label}</span>
        )}
      </div>
      {editing ? (
        <textarea
          className="code-editor"
          aria-label={`${selectedLanguage.label} code editor`}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          maxLength={16000}
        />
      ) : (
        <div
          className="source-code"
          ref={codeRef}
          aria-label="Executed source code"
        >
          {executedCode.split("\n").map((line, i) => (
            <div
              key={i}
              data-current={(nextLine ?? frame.line) === i + 1}
              className={
                "code-line " +
                ((nextLine ?? frame.line) === i + 1 ? "current-line" : "")
              }
            >
              <span className="line-number">
                {(nextLine ?? frame.line) === i + 1 ? (
                  <ChevronRight size={12} />
                ) : (
                  i + 1
                )}
              </span>
              <code>{syntax(line) || " "}</code>
            </div>
          ))}
        </div>
      )}
      <div className="code-footer">
        <button
          className="text-button muted"
          onClick={resetCode}
          disabled={running}
        >
          <RotateCcw size={13} />
          Reset code
        </button>
        <button
          className="button small-button"
          onClick={runEdits}
          disabled={running}
        >
          <Play size={13} />
          {running ? "Running…" : dirty ? "Run changes" : "Run code"}
        </button>
      </div>
      {dirty && (
        <div className="code-warning">
          You have unrun edits. The visualization shows the last executed code.
        </div>
      )}
      {custom && (
        <div className="code-warning">
          Custom code: lesson explanations and complexity describe the reference
          algorithm.
        </div>
      )}
      {error && (
        <div className="inline-error" role="alert">
          {error}
        </div>
      )}
      <div className="state-header">
        <Terminal size={14} />
        Live state<span>after this step</span>
      </div>
      <div className="variables">
        {vars.length ? (
          vars.map(([name, v]) => (
            <div className="variable" key={name}>
              <span>{name}</span>
              <code className="step-transition" key={format(v, language)}>
                {format(v, language)}
              </code>
            </div>
          ))
        ) : (
          <span className="muted">Variables appear as the code executes.</span>
        )}
      </div>
      {"result" in frame.vars && (
        <div className="result-row">
          <span>result</span>
          <code>{format(frame.vars.result, language)}</code>
        </div>
      )}
    </section>
  );
}
