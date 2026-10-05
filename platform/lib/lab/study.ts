import type { Language } from "../curriculum/playground";
import { readLocal, saveLocal } from "./storage";
export type Experiment = {
  id: string;
  problemId: string;
  title: string;
  description: string;
  language: Language;
  code: string;
  input: Record<string, unknown>;
  createdAt: string;
};
export type CodeVersion = Experiment;
export type Mistake = {
  id: string;
  problemId: string;
  language: Language;
  code: string;
  input: Record<string, unknown>;
  expected: unknown;
  actual: unknown;
  error: string | null;
  note: string;
  createdAt: string;
};
export const experimentsKey = "trace:study:experiments";
export const versionsKey = (id: string) => `trace:study:versions:${id}`;
export const mistakesKey = (id: string) => `trace:study:mistakes:${id}`;
export function experiments() {
  const v = readLocal<Experiment[]>(experimentsKey, []);
  return Array.isArray(v) ? v : [];
}
export function versions(id: string) {
  const v = readLocal<CodeVersion[]>(versionsKey(id), []);
  return Array.isArray(v) ? v : [];
}
export function mistakes(id: string) {
  const v = readLocal<Mistake[]>(mistakesKey(id), []);
  return Array.isArray(v) ? v : [];
}
export function saveExperiment(value: Omit<Experiment, "id" | "createdAt">) {
  const e = {
    ...value,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  saveLocal(experimentsKey, [e, ...experiments()].slice(0, 40));
  return e;
}
export function saveVersion(value: Omit<CodeVersion, "id" | "createdAt">) {
  const e = {
    ...value,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  saveLocal(
    versionsKey(value.problemId),
    [e, ...versions(value.problemId)].slice(0, 12),
  );
  return e;
}
export function saveMistake(value: Omit<Mistake, "id" | "createdAt">) {
  const e = {
    ...value,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  saveLocal(
    mistakesKey(value.problemId),
    [e, ...mistakes(value.problemId)].slice(0, 12),
  );
  return e;
}
export function reviewDate(id: string) {
  return (
    readLocal<{ date: string }>(`trace:study:review:${id}`, { date: "" })
      .date ?? ""
  );
}
export function scheduleReview(id: string, date: string) {
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date))
    throw Error("Choose a revision date.");
  saveLocal(`trace:study:review:${id}`, { date });
}
