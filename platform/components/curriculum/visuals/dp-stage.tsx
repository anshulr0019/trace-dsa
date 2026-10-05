"use client";
import { useState } from "react";
import { motion } from "motion/react";
import type { Problem } from "@/lib/curriculum/catalog";
import type { PlaybackFrame } from "@/lib/curriculum/execution";
import {
  at,
  list,
  record,
  matrix,
  text,
  dpFocus,
  dpIndex,
  dpInputs,
  dpDependencies,
  changed,
  integer,
  type State,
} from "@/lib/curriculum/visual-state";
import { MatrixCanvas, type GridMark } from "./grid-stage";
import {
  StageLabel,
  Legend,
  Readout,
  Stats,
  Track,
  Details,
  useStageMotion,
} from "./shared";
export function referenceEquation(p: Problem, v: State, input: State) {
  const f = dpFocus(p, v),
    i = dpIndex(p, v);
  if (f) {
    const [r, c] = f;
    if (r < 0 || c < 0) return "";
    const a = String(input.word1 ?? input.text1 ?? input.s ?? ""),
      b = String(input.word2 ?? input.text2 ?? input.p ?? "");
    if (p.id === "edit-distance" && r > 0 && c > 0)
      return a[r - 1] === b[c - 1]
        ? `Same character “${a[r - 1]}”: copy dp[${r - 1}][${c - 1}]`
        : `1 + min(delete: dp[${r - 1}][${c}], insert: dp[${r}][${c - 1}], replace: dp[${r - 1}][${c - 1}])`;
    if (p.id === "longest-common-subsequence" && r > 0 && c > 0)
      return a[r - 1] === b[c - 1]
        ? `Match “${a[r - 1]}”: 1 + dp[${r - 1}][${c - 1}]`
        : `Different letters: max(dp[${r - 1}][${c}], dp[${r}][${c - 1}])`;
    if (p.id === "unique-paths" && r > 0 && c > 0)
      return `From above + from the left: dp[${r - 1}][${c}] + dp[${r}][${c - 1}]`;
    if (p.id === "palindromic-substrings")
      return `“${a.slice(r, c + 1)}”: matching ends${c - r < 2 ? " make this a palindrome" : ` and a palindromic interior dp[${r + 1}][${c - 1}]`}`;
    if (p.id === "burst-balloons-dp" && integer(v.k))
      return `Try balloon ${v.k} last: dp[${r}][${v.k}] + nums[${r}] × nums[${v.k}] × nums[${c}] + dp[${v.k}][${c}]`;
    if (p.id === "regex-matching" && r > 0 && c > 0)
      return b[c - 1] === "*"
        ? `Skip ${b.slice(Math.max(0, c - 2), c)}: dp[${r}][${c - 2}], or reuse its match: dp[${r - 1}][${c}]`
        : `If “${a[r - 1]}” matches “${b[c - 1]}”, copy dp[${r - 1}][${c - 1}]`;
  }
  if (i !== undefined) {
    if (p.id === "climbing-stairs" && i >= 2)
      return `Ways via a 1-step move + a 2-step move: dp[${i - 1}] + dp[${i - 2}]`;
    if (p.id === "house-robber" && i >= 2)
      return `Skip this house: dp[${i - 1}], or take it: dp[${i - 2}] + ${text(list(input.nums)[i - 2])}`;
    if (p.id === "decode-ways" && i >= 1)
      return `Valid last digit “${String(input.s).slice(i - 1, i)}” uses dp[${i - 1}]. ${i >= 2 ? `Valid pair “${String(input.s).slice(i - 2, i)}” uses dp[${i - 2}].` : ""}`;
    if (p.id === "coin-change")
      return `Amount ${i}: try 1 + dp[${i} − coin] for each usable coin; keep the minimum.`;
  }
  return "";
}
export function DPStage({
  problem: p,
  input,
  frame,
  previous,
  speed,
}: {
  problem: Problem;
  input: State;
  frame?: PlaybackFrame;
  previous?: PlaybackFrame;
  speed?: number;
}) {
  const v = frame?.vars ?? {},
    old = previous?.vars ?? {},
    transition = useStageMotion(speed),
    [selected, setSelected] = useState<number | null>(null);
  const axes = dpInputs(p, input),
    focus = dpFocus(p, v),
    index = dpIndex(p, v);
  let dp = v.dp;
  const twoD = axes.row.length > 0 || p.id === "unique-paths";
  if (p.id === "target-sum")
    return (
      <div className="viz-dp-stage">
        <StageLabel
          title="Reachable totals → number of ways"
          detail={`Target ${text(input.target)}`}
        />
        <div className="viz-sign-branches">
          <span>Previous totals</span>
          <b>+ {text(v.value ?? "value")}</b>
          <b>− {text(v.value ?? "value")}</b>
          <span>Merge equal totals by adding their counts</span>
        </div>
        <div className="viz-total-cards">
          {Object.entries(record(dp))
            .slice(0, 50)
            .map(([total, count]) => (
              <motion.div
                layout
                key={total}
                className={`${Number(total) === input.target ? "active" : ""} ${changed(at(old.dp, total), count) ? "updated" : ""}`}
              >
                <small>Total</small>
                <b>{total}</b>
                <span>{text(count)} ways</span>
              </motion.div>
            ))}
          {dp === undefined && (
            <p>
              Play to record reachable totals. The initial total is 0 with one
              empty choice.
            </p>
          )}
        </div>
        <Details vars={v} exclude={["dp"]} />
      </div>
    );
  if (p.id === "stock-cooldown")
    return (
      <div className="viz-dp-stage">
        <StageLabel title="Three states after each day" />
        <div className="viz-stock-states">
          {[
            ["hold", "Holding", "Keep / buy"],
            ["sold", "Sold today", "Sell a held share"],
            ["rest", "Resting", "Wait / finish cooldown"],
          ].map(([key, label, action]) => (
            <motion.div
              layout
              key={key}
              className={changed(v[key], old[key]) ? "updated" : ""}
            >
              <small>{action}</small>
              <h3>{label}</h3>
              <b>{text(v[key])}</b>
            </motion.div>
          ))}
        </div>
        <p className="viz-helper">
          Rest → buy → Hold → sell → Sold → cooldown → Rest
        </p>
        {v.dp !== undefined && (
          <Track title="Recorded days · [hold, sold, rest]" values={v.dp} />
        )}
        <Details vars={v} exclude={["dp", "hold", "sold", "rest"]} />
      </div>
    );
  if (twoD) {
    const rows =
        p.id === "unique-paths"
          ? Math.min(64, Number(input.m) || 0)
          : axes.row.length,
      cols =
        p.id === "unique-paths"
          ? Math.min(64, Number(input.n) || 0)
          : axes.col.length;
    const values =
        dp === undefined
          ? Array.from({ length: rows }, () => Array(cols).fill("·"))
          : matrix(dp),
      marks: Record<string, GridMark> = {};
    let dependencies = dpDependencies(p, v, focus);
    if (
      focus &&
      ["edit-distance", "longest-common-subsequence"].includes(p.id)
    ) {
      const [r, c] = focus;
      const a = String(input.word1 ?? input.text1 ?? ""),
        b = String(input.word2 ?? input.text2 ?? "");
      if (r > 0 && c > 0 && a[r - 1] === b[c - 1])
        dependencies = [[r - 1, c - 1]];
      else if (p.id === "longest-common-subsequence")
        dependencies = dependencies.filter(([x, y]) => x === r || y === c);
    }
    dependencies.forEach(
      ([r, c]) =>
        (marks[`${r},${c}`] = {
          tone: "dependency",
          label: "Reference recurrence dependency",
        }),
    );
    return (
      <div className="viz-dp-stage">
        <StageLabel
          title={axes.label}
          detail={
            dp === undefined
              ? "Table preview · · means not recorded"
              : "Recorded DP table"
          }
        />
        <MatrixCanvas
          values={values}
          name="dp"
          focus={focus}
          marks={marks}
          rowLabels={axes.row}
          colLabels={axes.col}
          previous={matrix(old.dp)}
          speed={speed}
        />
        <Legend
          items={[
            ["active", "Current indices"],
            ["dependency", "Reference dependency"],
            ["updated", "Recorded change"],
          ]}
        />
        {focus && dependencies.length > 0 && (
          <div className="viz-dependencies">
            {dependencies.map(([r, c]) => (
              <span key={`${r},${c}`}>
                [{r},{c}] <b>{text(at(at(dp, r), c))}</b> →
              </span>
            ))}
            <span className="mint">
              [{focus[0]},{focus[1]}]{" "}
              <b>{text(at(at(dp, focus[0]), focus[1]))}</b>
            </span>
          </div>
        )}
        <Formula equation={referenceEquation(p, v, input)} />
        <Stats
          vars={v}
          keys={[
            ["count", "Palindromes"],
            ["width", "Interval width"],
          ]}
        />
        <Details vars={v} exclude={["dp"]} />
      </div>
    );
  }
  const values = list(dp),
    nums = list(input.nums),
    s = String(input.s ?? "");
  const count =
    p.id === "house-robber"
      ? nums.length + 2
      : p.id === "coin-change"
        ? Number(input.amount) + 1
        : p.id === "decode-ways"
          ? s.length + 1
          : Number(input.n) + 1;
  const total = values.length || Math.max(0, count),
    offset = Math.max(0, Math.min(Math.max(0, total - 80), (index ?? 0) - 40)),
    shown = values.length
      ? values.slice(offset, offset + 80)
      : Array.from({ length: Math.min(80, total) }, () => "·");
  const refs = new Set<number>();
  if (index !== undefined) {
    if (["climbing-stairs", "house-robber", "decode-ways"].includes(p.id)) {
      refs.add(index - 1);
      refs.add(index - 2);
    }
    if (p.id === "coin-change")
      list(input.coins).forEach((c) => {
        if (Number(c) > 0 && index >= Number(c)) refs.add(index - Number(c));
      });
  }
  return (
    <div className="viz-dp-stage">
      <StageLabel
        title={
          p.id === "coin-change"
            ? "Minimum coins for each amount"
            : p.id === "house-robber"
              ? "Best total for each prefix of houses"
              : p.id === "decode-ways"
                ? "Decodings for each string prefix"
                : "Ways to reach each step"
        }
        detail={
          values.length
            ? "Recorded DP values"
            : "Preview · · means not recorded"
        }
      />
      <div
        className="viz-dp-strip"
        tabIndex={0}
        aria-label="Dynamic programming states"
      >
        {shown.map((value, local) => {
          const i = offset + local;
          return (
            <motion.button
              layout
              type="button"
              key={i}
              transition={transition}
              className={`viz-dp-card ${i === index ? "active" : ""} ${refs.has(i) ? "dependency" : ""} ${old.dp !== undefined && changed(at(old.dp, i), value) ? "updated" : ""}`}
              onClick={() => setSelected(i)}
              aria-label={`dp[${i}] = ${text(value)}`}
            >
              <small>
                {p.id === "coin-change"
                  ? "Amount"
                  : p.id === "climbing-stairs"
                    ? "Step"
                    : p.id === "house-robber"
                      ? i < 2
                        ? "Base"
                        : "Houses"
                      : "Prefix"}{" "}
                {p.id === "house-robber" && i >= 2 ? i - 1 : i}
              </small>
              <motion.b
                key={text(value)}
                initial={{ opacity: 0.4, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {text(value)}
              </motion.b>
              {p.id === "house-robber" && i >= 2 && (
                <span>
                  House {i - 2}: {text(nums[i - 2])}
                </span>
              )}
              {p.id === "decode-ways" && i > 0 && (
                <span>“{s.slice(0, i)}”</span>
              )}
            </motion.button>
          );
        })}
      </div>
      {total > 80 && (
        <p className="viz-helper">
          Showing states {offset}–{offset + shown.length - 1} of {total}; the
          window follows the current index.
        </p>
      )}
      <Legend
        items={[
          ["active", "Current index"],
          ["dependency", "Reference dependency"],
          ["updated", "Recorded change"],
        ]}
      />
      {selected !== null && (
        <Readout>
          <span>dp[{selected}]</span>
          <b>{text(values[selected] ?? "·")}</b>
          <button
            aria-label="Close DP inspector"
            onClick={() => setSelected(null)}
          >
            ×
          </button>
        </Readout>
      )}
      <Formula equation={referenceEquation(p, v, input)} />
      <Details vars={v} exclude={["dp"]} />
    </div>
  );
}
function Formula({ equation }: { equation: string }) {
  return equation ? (
    <div className="viz-formula">
      <small>Reference recurrence · compare with your code</small>
      <p>{equation}</p>
    </div>
  ) : null;
}
