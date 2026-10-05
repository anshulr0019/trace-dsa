import type { Language } from "../curriculum/playground";
import { readLocal, saveLocal } from "./storage";
export const checkKinds = [
  "execution",
  "animation",
  "alignment",
  "explanation",
  "mobile",
] as const;
export type CheckKind = (typeof checkKinds)[number];
export type QualityCheck = {
  key: string;
  problemId: string;
  language: Language;
  kind: CheckKind;
  status: "pending" | "passed" | "failed" | "blocked";
  checkedAt: string | null;
  source: "manual" | "reference-suite";
  note: string;
  passed?: number;
  total?: number;
};
export const qualityKey = (id: string, language: string, kind: string) =>
  `${id}:${language}:${kind}`;
export function qualityChecks() {
  const value = readLocal<Record<string, QualityCheck>>(
    "trace:quality:checks",
    {},
  );
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}
export function saveQuality(check: QualityCheck) {
  saveLocal("trace:quality:checks", { ...qualityChecks(), [check.key]: check });
  window.dispatchEvent(new Event("trace:quality"));
}

export function mergeQualityChecks(remote: Record<string, QualityCheck>) {
  const merged = { ...qualityChecks(), ...remote };
  saveLocal("trace:quality:checks", merged);
  return merged;
}
