export type SourceRow = { line: number; text: string };

// This is a display projection. The compiler always receives the original source.
// Keep line positions intact while hiding standalone instrumentation statements.
export function readableSource(source: string, language: string): SourceRow[] {
  let masked = "",
    quote = "",
    comment = "";
  for (let i = 0; i < source.length; i++) {
    const c = source[i],
      next = source[i + 1];
    if (comment === "line") {
      if (c === "\n") comment = "";
      masked += c === "\n" ? c : " ";
    } else if (comment === "block") {
      if (c === "*" && next === "/") {
        masked += "  ";
        i++;
        comment = "";
      } else masked += c === "\n" ? c : " ";
    } else if (quote) {
      if (c === "\\") {
        masked += "  ";
        i++;
      } else {
        if (c === quote) quote = "";
        masked += c === "\n" ? c : " ";
      }
    } else if (['"', "'", "`"].includes(c)) {
      quote = c;
      masked += " ";
    } else if (
      (c === "/" && next === "/") ||
      (language === "python" && c === "#")
    ) {
      comment = "line";
      masked += " ";
    } else if (c === "/" && next === "*") {
      comment = "block";
      masked += "  ";
      i++;
    } else masked += c;
  }
  // Work with UTF-16 positions, as regex indices and compiler line offsets do.
  const projected = source.split("");
  const hide = (start: number, end: number) => {
    for (let i = start; i < end; i++)
      if (projected[i] !== "\n") projected[i] = " ";
  };
  const endStatement = (start: number) => {
    let depth = 0;
    for (let i = start; i < masked.length; i++) {
      if ("({[".includes(masked[i])) depth++;
      if (")}]".includes(masked[i])) depth--;
      if (masked[i] === ";" && depth === 0) return i + 1;
      if (depth < 0) return -1;
    }
    return -1;
  };
  let safeSnapshot = false,
    unsafeSnapshot = false;
  for (const match of masked.matchAll(/\b(?:const|let|auto)\s+snapshot\s*=/g)) {
    const end = endStatement(match.index!);
    if (end > 0) {
      const body = masked.slice(match.index!, end);
      const calls = [...body.matchAll(/\b(\w+)\s*\(/g)];
      if (
        calls.every((call) => ["trace", "TRACE"].includes(call[1])) &&
        !/(?:\+\+|--|\+=|-=|\*=|\/=)/.test(body) &&
        !/[^=!<>]=(?!=|>)/.test(body.slice(body.indexOf("=") + 1))
      ) {
        hide(match.index!, end);
        safeSnapshot = true;
      } else unsafeSnapshot = true;
    }
  }
  for (const match of masked.matchAll(/\b(?:trace|TRACE|snapshot)\s*\(/g)) {
    if (match[0].startsWith("snapshot") && (!safeSnapshot || unsafeSnapshot))
      continue;
    const start = match.index!,
      prefix = masked
        .slice(masked.lastIndexOf("\n", start - 1) + 1, start)
        .trimEnd();
    if (prefix && !/[;{]$/.test(prefix)) continue;
    const end = endStatement(start);
    if (end > 0) hide(start, end);
  }
  if (language !== "python") {
    for (const match of masked.matchAll(
      /^\s*(?:public\s+Object|json|function)\s+solve\([^\n]*\)\s*\{\s*$/gm,
    )) {
      const open = masked.indexOf("{", match.index!);
      let depth = 1,
        end = open + 1;
      for (; end < masked.length && depth; end++) {
        if (masked[end] === "{") depth++;
        else if (masked[end] === "}") depth--;
      }
      if (!depth) {
        hide(match.index!, open + 1);
        hide(end - 1, end);
      }
    }
  }
  const rows = projected
    .join("")
    .split("\n")
    .map((text, i) => ({ line: i + 1, text: text.trimEnd() }));
  const classIndex = rows.findIndex((r) =>
    /^\s*public class Solution extends Trace\s*\{\s*$/.test(r.text),
  );
  const last = rows.findLastIndex((r) => r.text.trim());
  return rows.filter(
    (r, i) =>
      r.text.trim() &&
      !/^\s*(?:import\s|from\s|#include\b|\/\/ (?:Trace supplies|Input helpers and trace)|def solve\(data\):\s*$)/.test(
        r.text,
      ) &&
      i !== classIndex &&
      !(classIndex >= 0 && i === last && r.text.trim() === "}"),
  );
}
export function visibleSourceLine(rows: SourceRow[], line: number) {
  if (line <= 0) return 0;
  if (rows.some((r) => r.line === line)) return line;
  return rows.findLast((r) => r.line < line)?.line ?? rows[0]?.line ?? 0;
}
