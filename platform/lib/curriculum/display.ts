export function display(v: unknown): string {
  return typeof v === "string" ? v : (JSON.stringify(v) ?? "—");
}
