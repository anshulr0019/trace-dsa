/** Bounded educational Python subset. Never uses eval, Function, or host property access. */
export type Value = number | boolean | null | number[];
export type Environment = Record<string, Value>;
export interface Access { name: string; index?: number; value: Value }
export interface TraceEvent {
  kind: "assign" | "condition" | "loop" | "complete";
  reads: Access[];
  write?: Access;
  source?: Access;
  truth?: boolean;
}
export interface Frame {
  event?: TraceEvent;
  line: number;
  vars: Environment;
  comparisons: number;
  message: string;
}
export interface RunResult {
  frames: Frame[];
  error?: string;
  finished: boolean;
}
type Expr =
  | { type: "literal"; value: Value }
  | { type: "name"; name: string }
  | { type: "list"; items: Expr[] }
  | { type: "index"; base: Expr; index: Expr }
  | { type: "unary"; op: string; right: Expr }
  | { type: "binary"; op: string; left: Expr; right: Expr }
  | { type: "call"; name: string; args: Expr[] };
type Statement =
  | {
      line: number;
      text: string;
      type: "assign";
      target: Expr;
      value: Expr;
      op: string;
    }
  | {
      line: number;
      text: string;
      type: "while" | "if";
      condition: Expr;
      body: Statement[];
      otherwise: Statement[];
    }
  | {
      line: number;
      text: string;
      type: "for";
      name: string;
      iterable: Expr;
      body: Statement[];
    }
  | { line: number; text: string; type: "break" };
const MAX_STEPS = 2400;
const precedence: Record<string, number> = {
  or: 1,
  and: 2,
  "==": 3,
  "!=": 3,
  "<": 3,
  ">": 3,
  "<=": 3,
  ">=": 3,
  "+": 4,
  "-": 4,
  "*": 5,
  "/": 5,
  "//": 5,
  "%": 5,
};
function tokens(source: string) {
  const result: string[] = [];
  let at = 0;
  while (at < source.length) {
    if (/\s/.test(source[at])) {
      at++;
      continue;
    }
    const match = source
      .slice(at)
      .match(
        /^(?:\d+(?:\.\d+)?|[A-Za-z_][A-Za-z_0-9]*|\/\/|==|!=|<=|>=|[+\-*/%<>()\[\],])/,
      );
    if (!match)
      throw new Error(
        `Unsupported syntax near “${source.slice(at, at + 16)}”.`,
      );
    result.push(match[0]);
    at += match[0].length;
  }
  return result;
}
function parseExpr(source: string): Expr {
  const t = tokens(source);
  let p = 0;
  function expect(s: string) {
    if (t[p++] !== s) throw new Error(`Expected “${s}”.`);
  }
  function expr(min = 0): Expr {
    const token = t[p++];
    let left: Expr;
    if (!token) throw new Error("Expected an expression.");
    if (token === "-" || token === "+" || token === "not")
      left = { type: "unary", op: token, right: expr(token === "not" ? 3 : 6) };
    else if (token === "(") {
      left = expr();
      expect(")");
    } else if (token === "[") {
      const items: Expr[] = [];
      if (t[p] !== "]") {
        do {
          items.push(expr());
          if (t[p] !== ",") break;
          p++;
        } while (t[p] !== "]");
      }
      expect("]");
      left = { type: "list", items };
    } else if (/^\d/.test(token)) {
      const value = Number(token);
      if (!Number.isFinite(value) || value > 1e12)
        throw new Error("Numeric literals must stay within ±1 trillion.");
      left = { type: "literal", value };
    } else if (["True", "False", "None"].includes(token))
      left = {
        type: "literal",
        value: token === "None" ? null : token === "True",
      };
    else if (/^[A-Za-z_]\w*$/.test(token)) {
      if (t[p] === "(") {
        p++;
        const args: Expr[] = [];
        if (t[p] !== ")")
          do {
            args.push(expr());
            if (t[p] !== ",") break;
            p++;
          } while (t[p] !== ")");
        expect(")");
        left = { type: "call", name: token, args };
      } else left = { type: "name", name: token };
    } else throw new Error(`Unexpected token “${token}”.`);
    while (t[p] === "[") {
      p++;
      const index = expr();
      expect("]");
      left = { type: "index", base: left, index };
    }
    while (t[p] in precedence && precedence[t[p]] >= min) {
      const op = t[p++];
      const right = expr(precedence[op] + 1);
      left = { type: "binary", op, left, right };
      if (precedence[op] === 3 && precedence[t[p]] === 3)
        throw new Error("Use “and” between comparisons in this Python subset.");
    }
    return left;
  }
  const result = expr();
  if (p !== t.length) throw new Error(`Unexpected token “${t[p]}”.`);
  return result;
}
function parse(code: string): Statement[] {
  if (code.length > 16000)
    throw new Error("Keep code under 16,000 characters.");
  const lines = code
    .split("\n")
    .map((raw, i) => ({
      text: raw.split("#")[0].trim(),
      indent: raw.length - raw.trimStart().length,
      line: i + 1,
      raw,
    }))
    .filter((l) => l.text);
  if (lines.some((l) => l.raw.includes("\t")))
    throw new Error("Use spaces instead of tabs for indentation.");
  let p = 0;
  function block(indent: number, depth = 0): Statement[] {
    if (depth > 24) throw new Error("Too many nested blocks.");
    const result: Statement[] = [];
    while (p < lines.length && lines[p].indent === indent) {
      const l = lines[p++];
      const base = { line: l.line, text: l.text };
      const nested = () => {
        if (!lines[p] || lines[p].indent <= indent)
          throw new Error(`Line ${l.line}: expected an indented block.`);
        return block(lines[p].indent, depth + 1);
      };
      try {
        const ctrl = l.text.match(/^(while|if) (.+):$/);
        const loop = l.text.match(/^for ([A-Za-z_]\w*) in (.+):$/);
        if (ctrl) {
          const condition = parseExpr(ctrl[2]);
          const body = nested();
          let otherwise: Statement[] = [];
          if (
            ctrl[1] === "if" &&
            lines[p]?.indent === indent &&
            lines[p].text === "else:"
          ) {
            p++;
            otherwise = nested();
          }
          result.push({
            ...base,
            type: ctrl[1] as "if" | "while",
            condition,
            body,
            otherwise,
          });
        } else if (loop) {
          const iterable = parseExpr(loop[2]);
          result.push({
            ...base,
            type: "for",
            name: loop[1],
            iterable,
            body: nested(),
          });
        } else if (l.text === "break") result.push({ ...base, type: "break" });
        else {
          const assignment = l.text.match(
            /^([A-Za-z_]\w*(?:\[.+\])?)\s*(\+=|-=|\*=|=(?!=))\s*(.+)$/,
          );
          if (!assignment)
            throw new Error(
              "Supported: assignments, if/else, while, for/range, and break.",
            );
          const target = parseExpr(assignment[1]);
          if (target.type !== "name" && target.type !== "index")
            throw new Error("Invalid assignment.");
          result.push({
            ...base,
            type: "assign",
            target,
            op: assignment[2],
            value: parseExpr(assignment[3]),
          });
        }
      } catch (e) {
        throw new Error(`Line ${l.line}: ${(e as Error).message}`);
      }
    }
    if (p < lines.length && lines[p].indent > indent)
      throw new Error(`Line ${lines[p].line}: unexpected indentation.`);
    return result;
  }
  if (lines[0]?.indent)
    throw new Error("The first statement must not be indented.");
  return block(0);
}
const truth = (v: Value) => (Array.isArray(v) ? v.length > 0 : Boolean(v));
const number = (v: Value): number => {
  if (typeof v !== "number" && typeof v !== "boolean")
    throw new Error("Expected a number.");
  return Number(v);
};
const array = (v: Value): number[] => {
  if (!Array.isArray(v)) throw new Error("Expected a list.");
  return v;
};
function indexOf(list: number[], v: Value) {
  let i = number(v);
  if (!Number.isInteger(i)) throw new Error("List indices must be integers.");
  if (i < 0) i += list.length;
  if (i < 0 || i >= list.length)
    throw new Error(`Index ${i} is outside a list of length ${list.length}.`);
  return i;
}
export function runCode(code: string, inputs: Environment): RunResult {
  const env: Environment = Object.assign(
    Object.create(null),
    structuredClone(inputs),
  );
  const frames: Frame[] = [
    {
      line: 0,
      vars: structuredClone(env),
      comparisons: 0,
      message: "Input ready. Step forward to execute the first line.",
    },
  ];
  let comparisons = 0,
    steps = 0,
    currentLine = 0;
  const tick = () => {
    if (++steps > MAX_STEPS)
      throw new Error(
        "Execution limit reached (2,400 steps). Check for an infinite loop or use a smaller input.",
      );
  };
  let reads: Access[] = [];
  function record(line: number, message: string, detail?: Omit<TraceEvent, "reads">) {
    frames.push({ line, vars: structuredClone(env), comparisons, message,
      event: { kind: "loop", ...detail, reads: structuredClone(reads.slice(-64)) } });
    reads = [];
  }
  const arrayName = (a: number[], fallback: string) =>
    Object.keys(env).find(name => env[name] === a) ?? fallback;
  function evaluate(e: Expr): Value {
    switch (e.type) {
      case "literal":
        return e.value;
      case "name":
        if (!Object.hasOwn(env, e.name))
          throw new Error(`“${e.name}” is not defined.`);
        if (!Array.isArray(env[e.name])) reads.push({ name: e.name, value: env[e.name] });
        return env[e.name];
      case "list":
        if (e.items.length > 128)
          throw new Error("Lists are limited to 128 items.");
        return e.items.map((v) => number(evaluate(v)));
      case "index": {
        const a = array(evaluate(e.base));
        const index = indexOf(a, evaluate(e.index));
        reads.push({ name: arrayName(a, e.base.type === "name" ? e.base.name : "list"), index, value: a[index] });
        return a[index];
      }
      case "unary": {
        const v = evaluate(e.right);
        return e.op === "not"
          ? !truth(v)
          : e.op === "-"
            ? -number(v)
            : number(v);
      }
      case "call": {
        const a = e.args.map(evaluate);
        if (e.name === "len" && a.length === 1) return array(a[0]).length;
        if (e.name === "abs" && a.length === 1) return Math.abs(number(a[0]));
        if (["min", "max"].includes(e.name) && a.length > 0) {
          const values = a.length === 1 ? array(a[0]) : a.map(number);
          if (!values.length)
            throw new Error("min/max needs at least one value.");
          return e.name === "min" ? Math.min(...values) : Math.max(...values);
        }
        if (e.name === "range" && a.length >= 1 && a.length <= 3) {
          const start = a.length === 1 ? 0 : number(a[0]),
            end = number(a.length === 1 ? a[0] : a[1]),
            step = a.length === 3 ? number(a[2]) : 1;
          if (![start, end, step].every(Number.isInteger) || step === 0)
            throw new Error("range needs integers and a nonzero step.");
          const n = Math.max(0, Math.ceil((end - start) / step));
          if (n > 128) throw new Error("range is limited to 128 items.");
          return Array.from({ length: n }, (_, i) => start + i * step);
        }
        throw new Error(
          `Unsupported function or arguments: ${e.name}. Supported: len, range, min, max, abs.`,
        );
      }
      case "binary": {
        const l = evaluate(e.left);
        if (e.op === "and") return truth(l) ? evaluate(e.right) : l;
        if (e.op === "or") return truth(l) ? l : evaluate(e.right);
        const r = evaluate(e.right);
        if (["==", "!="].includes(e.op)) {
          comparisons++;
          const equal =
            Array.isArray(l) && Array.isArray(r)
              ? l.length === r.length && l.every((v, i) => v === r[i])
              : (typeof l === "number" || typeof l === "boolean") &&
                  (typeof r === "number" || typeof r === "boolean")
                ? Number(l) === Number(r)
                : l === r;
          return e.op === "==" ? equal : !equal;
        }
        const a = number(l),
          b = number(r);
        if (["<", ">", "<=", ">="].includes(e.op)) {
          comparisons++;
          return e.op === "<"
            ? a < b
            : e.op === ">"
              ? a > b
              : e.op === "<="
                ? a <= b
                : a >= b;
        }
        if ((e.op === "/" || e.op === "//" || e.op === "%") && b === 0)
          throw new Error("Division by zero.");
        const v =
          e.op === "+"
            ? a + b
            : e.op === "-"
              ? a - b
              : e.op === "*"
                ? a * b
                : e.op === "/"
                  ? a / b
                  : e.op === "//"
                    ? Math.floor(a / b)
                    : ((a % b) + b) % b;
        if (!Number.isFinite(v) || Math.abs(v) > 1e12)
          throw new Error(
            "Numeric limit exceeded. Keep values within ±1 trillion.",
          );
        return v;
      }
    }
  }
  function execute(statements: Statement[], inLoop = false): boolean {
    for (const s of statements) {
      currentLine = s.line;
      tick();
      if (s.type === "assign") {
        let v = evaluate(s.value);
        const source = s.op === "=" && s.value.type === "index" ? reads.at(-1)
          : s.op === "=" && s.value.type === "name" ? { name: s.value.name, value: structuredClone(v) }
          : undefined;
        let write: Access | undefined;
        if (s.op !== "=")
          v = evaluate({
            type: "binary",
            op: s.op[0],
            left: s.target,
            right: { type: "literal", value: v },
          });
        if (s.target.type === "name") {
          if (
            Object.keys(env).length > 64 &&
            !Object.hasOwn(env, s.target.name)
          )
            throw new Error("Too many variables.");
          env[s.target.name] = v;
          write = { name: s.target.name, value: structuredClone(v) };
        } else if (s.target.type === "index") {
          const a = array(evaluate(s.target.base));
          const index = indexOf(a, evaluate(s.target.index));
          a[index] = number(v);
          write = { name: arrayName(a, s.target.base.type === "name" ? s.target.base.name : "list"), index, value: v };
        }
        record(s.line, `Executed: ${s.text}`, { kind: "assign", write, source });
      } else if (s.type === "break") {
        if (!inLoop) throw new Error("break must be inside a loop.");
        record(s.line, "Leave this loop.");
        return true;
      } else if (s.type === "if") {
        const yes = truth(evaluate(s.condition));
        record(s.line, `Condition is ${yes ? "True" : "False"}.`, { kind: "condition", truth: yes });
        if (execute(yes ? s.body : s.otherwise, inLoop)) return true;
      } else if (s.type === "while") {
        while (true) {
          currentLine = s.line;
          tick();
          const yes = truth(evaluate(s.condition));
          record(s.line, `Loop condition is ${yes ? "True" : "False"}.`, { kind: "condition", truth: yes });
          if (!yes || execute(s.body, true)) break;
        }
      } else if (s.type === "for") {
        const values = [...array(evaluate(s.iterable))];
        for (const value of values) {
          currentLine = s.line;
          tick();
          env[s.name] = value;
          record(s.line, `${s.name} = ${value}; enter the loop.`);
          if (execute(s.body, true)) break;
        }
      }
    }
    return false;
  }
  try {
    execute(parse(code));
    record(0, "Execution complete. Inspect the result or try another input.", { kind: "complete" });
    return { frames, finished: true };
  } catch (e) {
    return {
      frames,
      finished: false,
      error: `${currentLine ? `Line ${currentLine}: ` : ""}${(e as Error).message}`,
    };
  }
}
