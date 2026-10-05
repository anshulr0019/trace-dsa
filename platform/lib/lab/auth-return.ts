const views = ["notebook", "teacher", "curriculum", "classroom", "owner"];
export function signInReturn(origin: string, path: string) {
  const url = new URL(path, origin);
  url.searchParams.delete("next");
  url.searchParams.delete("code");
  const value = btoa(url.pathname + url.search)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `${origin}/?view=notebook&next=${value}`;
}
export function safeReturnPath(search: string, origin: string) {
  const value = new URLSearchParams(search).get("next");
  if (!value || value.length > 2400) return null;
  try {
    const path = atob(value.replace(/-/g, "+").replace(/_/g, "/"));
    if (!path.startsWith("/?")) return null;
    const url = new URL(path, origin);
    if (
      url.origin !== origin ||
      !views.includes(url.searchParams.get("view") ?? "")
    )
      return null;
    url.searchParams.delete("next");
    url.searchParams.delete("code");
    return url.pathname + url.search;
  } catch {
    return null;
  }
}
