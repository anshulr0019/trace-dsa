import type { Scene } from "@/lib/curriculum/catalog";

/** Small diagrams share the same visual vocabulary as the lesson stages. */
export function PatternArt({
  kind = "array",
  variant = 0,
}: {
  kind?: Scene | "systems";
  variant?: number;
}) {
  const network = ["tree", "trie", "graph", "linked", "systems"].includes(kind);
  const grid = ["grid", "dp", "backtrack"].includes(kind);
  return (
    <svg
      className={`pattern-art pattern-art-${kind}`}
      viewBox="0 0 240 100"
      fill="none"
      aria-hidden="true"
    >
      {network ? (
        <>
          {["M120 23L52 73", "M120 23L188 73", "M52 73L188 73"]
            .slice(0, kind === "tree" || kind === "trie" ? 2 : 3)
            .map((d) => (
              <path className="art-connection" key={d} d={d} />
            ))}
          {[
            [120, 23],
            [52, 73],
            [188, 73],
          ].map(([x, y], i) => (
            <g key={i}>
              <circle
                className={i === variant % 3 ? "art-active" : "art-node"}
                cx={x}
                cy={y}
                r={12}
              />
              <circle className="art-core" cx={x} cy={y} r={3} />
            </g>
          ))}
          <circle className="art-signal" cx="86" cy="48" r="3" />
        </>
      ) : grid ? (
        <>
          {Array.from({ length: 15 }, (_, i) => (
            <rect
              className={
                [0, 1, 6, 11, 12, 13, 14].includes(i)
                  ? "art-active"
                  : "art-node"
              }
              x={57 + (i % 5) * 26}
              y={13 + Math.floor(i / 5) * 26}
              width="21"
              height="21"
              rx="4"
              key={i}
            />
          ))}
          <path className="art-route" d="M67 23H93V75H171" />
        </>
      ) : (
        <>
          <rect
            className="art-region"
            x={variant % 2 ? 91 : 55}
            y="31"
            width="97"
            height="40"
            rx="7"
          />
          {Array.from({ length: 6 }, (_, i) => (
            <g key={i}>
              <rect
                className={
                  i === (variant % 2 ? 3 : 2) ? "art-active" : "art-node"
                }
                x={20 + i * 35}
                y="38"
                width="27"
                height="27"
                rx="5"
              />
              <text x={33.5 + i * 35} y="56" textAnchor="middle">
                {kind === "bits" ? i % 2 : [2, 4, 7, 9, 14, 21][i]}
              </text>
            </g>
          ))}
          <path
            className="art-route"
            d={`M${variant % 2 ? 138 : 103} 14V28m-4-4 4 4 4-4`}
          />
          <path className="art-connection" d="M33 82H208" />
          <circle
            className="art-signal"
            cx={variant % 2 ? 138 : 103}
            cy="82"
            r="3"
          />
        </>
      )}
    </svg>
  );
}
