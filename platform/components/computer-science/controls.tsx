"use client";
import { deepSpecs } from "@/lib/computer-science/deeper-catalog";
import type { Module } from "@/lib/computer-science/catalog";
import type { Settings } from "@/lib/computer-science/models";
export function LabControls({
  module: m,
  value: s,
  onChange,
}: {
  module: Module;
  value: Settings;
  onChange: (s: Settings) => void;
}) {
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    onChange({ ...s, [key]: value });
  const select = (
    key: keyof Settings,
    label: string,
    options: [string, string][],
  ) => (
    <label>
      {label}
      <select
        value={String(s[key])}
        onChange={(e) =>
          set(
            key,
            (typeof s[key] === "number"
              ? Number(e.target.value)
              : e.target.value) as never,
          )
        }
      >
        {options.map(([value, label]) => (
          <option value={value} key={value}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
  const num = (
    key: keyof Settings,
    label: string,
    min: number,
    max: number,
    step = 1,
  ) => (
    <label>
      {label}
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={Number(s[key])}
        onChange={(e) => set(key, Number(e.target.value) as never)}
      />
    </label>
  );
  const toggle = (key: keyof Settings, label: string) => (
    <label className="cs-toggle">
      <input
        type="checkbox"
        checked={Boolean(s[key])}
        onChange={(e) => set(key, e.target.checked as never)}
      />
      {label}
    </label>
  );
  const spec = deepSpecs[m.id];
  return (
    <div className="cs-controls">
      {spec && (
        <>
          {num("quantity", spec.input, spec.min, spec.max)}
          {select("variant", "Policy / behavior", spec.variants)}
        </>
      )}
      {m.kind === "sql" && (
        <>
          {select("join", "Join type", [
            ["INNER", "INNER JOIN"],
            ["LEFT", "LEFT JOIN"],
          ])}
          {num("minimum", "Minimum order amount (0 = no WHERE)", 0, 250, 10)}
        </>
      )}
      {m.kind === "index" && num("target", "Find key", 0, 30)}
      {m.kind === "transaction" && (
        <>
          {num("amount", "Transfer from A to B", 1, 100)}
          {toggle("fail", "Inject failure after debit")}
        </>
      )}
      {m.kind === "normalization" && (
        <>
          <label>
            New CS101 instructor
            <input
              maxLength={40}
              value={s.instructor}
              onChange={(e) => set("instructor", e.target.value)}
            />
          </label>
          {toggle("normalized", "Use normalized course and enrollment tables")}
        </>
      )}
      {m.kind === "scheduler" && (
        <>
          <label>
            CPU bursts (comma separated)
            <input
              value={s.bursts}
              maxLength={60}
              onChange={(e) => set("bursts", e.target.value)}
            />
          </label>
          {select("policy", "Scheduling policy", [
            ["FCFS", "First come, first served"],
            ["SJF", "Shortest job first"],
            ["RR", "Round robin"],
          ])}
          {s.policy === "RR" && num("quantum", "Time quantum", 1, 6)}
        </>
      )}
      {m.kind === "memory" && (
        <>
          <label>
            Page references
            <input
              value={s.pages}
              maxLength={80}
              onChange={(e) => set("pages", e.target.value)}
            />
          </label>
          {select("pagePolicy", "Replacement policy", [
            ["FIFO", "First in, first out"],
            ["LRU", "Least recently used"],
          ])}
          {num("slots", "Memory frames", 1, 5)}
        </>
      )}
      {m.kind === "deadlock" &&
        toggle("safe", "Use the same lock order (A then B)")}
      {m.kind === "semaphore" &&
        toggle("safe", "Protect increments with a binary semaphore")}
      {m.id === "dns-lookup" && toggle("warm", "Use a valid warm DNS cache")}
      {m.id === "https-journey" &&
        toggle("reuse", "Reuse an established TLS connection")}
      {m.id === "tcp-retries" &&
        select("drop", "Lose one segment", [
          ["0", "No loss"],
          ["1", "Segment 1"],
          ["2", "Segment 2"],
          ["3", "Segment 3"],
          ["4", "Segment 4"],
        ])}
      {m.kind === "strategy" && (
        <>
          {num("price", "Unit price", 1, 1000)}
          {num("quantity", "Quantity", 1, 10)}
          {select("discount", "Pricing strategy", [
            ["regular", "Regular price"],
            ["percent", "10% off"],
            ["flat", "50 off, minimum total 0"],
          ])}
        </>
      )}
      {m.kind === "observer" && (
        <>
          {num("price", "Published value", 1, 1000)}
          <fieldset>
            <legend>Subscribers</legend>
            {["chart", "alert", "audit"].map((id) => (
              <label className="cs-toggle" key={id}>
                <input
                  type="checkbox"
                  checked={s.subscribers.includes(id)}
                  onChange={(e) =>
                    set(
                      "subscribers",
                      e.target.checked
                        ? [...s.subscribers, id]
                        : s.subscribers.filter((v) => v !== id),
                    )
                  }
                />
                {id}
              </label>
            ))}
          </fieldset>
        </>
      )}
      {m.kind === "factory" &&
        select("channel", "Notification channel", [
          ["email", "Email"],
          ["sms", "SMS"],
          ["push", "Push notification"],
        ])}
    </div>
  );
}
