"use client";
import { useEffect, useMemo, useRef } from "react";
import {
  readableSource,
  visibleSourceLine,
} from "@/lib/learning/readable-source";
import "./lesson-workspace.css";
function syntax(text: string) {
  return text
    .split(
      /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:def|return|public|private|class|void|Object|int|double|long|boolean|while|if|else|for|in|break|continue|new|const|let|auto|true|false|null|None|True|False)\b|\b\d+(?:\.\d+)?\b)/g,
    )
    .map((part, i) => (
      <span
        key={i}
        className={
          /^["']/.test(part)
            ? "syn-string"
            : /^\d|^(None|True|False|null|true|false)$/.test(part)
              ? "syn-num"
              : /^(def|return|public|private|class|void|Object|int|double|long|boolean|while|if|else|for|in|break|continue|new|const|let|auto)$/.test(
                    part,
                  )
                ? "syn-key"
                : ""
        }
      >
        {part}
      </span>
    ));
}
export function ReadableCode({
  source,
  language,
  line = 0,
}: {
  source: string;
  language: string;
  line?: number;
}) {
  const rows = useMemo(
    () => readableSource(source, language),
    [source, language],
  );
  const indent = Math.min(
    ...rows.map((r) => r.text.match(/^\s*/)?.[0].length ?? 0),
  );
  const active = visibleSourceLine(rows, line);
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const panel = host.current,
      current = panel?.querySelector<HTMLElement>('[data-current="true"]');
    if (panel && current) {
      const top = current.offsetTop - panel.offsetTop;
      if (
        top < panel.scrollTop ||
        top + current.offsetHeight > panel.scrollTop + panel.clientHeight
      )
        panel.scrollTo({
          top: Math.max(0, top - panel.clientHeight / 2),
          behavior: "instant",
        });
    }
  }, [active]);
  return (
    <div
      className="readable-code"
      ref={host}
      tabIndex={0}
      role="region"
      aria-label="Algorithm code, tracing setup hidden"
    >
      {rows.map((row) => (
        <div
          key={row.line}
          data-current={row.line === active}
          className={`readable-code-line ${row.line === active ? "current-line" : ""}`}
        >
          <span aria-label={`Source line ${row.line}`}>{row.line}</span>
          <code>{syntax(row.text.slice(indent))}</code>
        </div>
      ))}
    </div>
  );
}
