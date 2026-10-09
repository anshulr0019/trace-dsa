import { sqlSetup } from "./sql-project";
self.onmessage = async ({ data }) => {
  try {
    if (typeof data.query !== "string" || data.query.length > 6000)
      throw Error("Use a query of at most 6,000 characters.");
    const indexURL = new URL("/browser-runtime/", self.location.origin).href;
    const { loadPyodide } = (await import(
      indexURL + "pyodide.mjs"
    )) as typeof import("pyodide");
    const py = await loadPyodide({
      indexURL,
      packageBaseUrl: "https://cdn.jsdelivr.net/pyodide/v0.29.3/full/",
    });
    await py.loadPackage("sqlite3");
    self.postMessage({ type: "ready" });
    py.globals.set("trace_sql_setup", sqlSetup);
    py.globals.set("trace_sql_query", data.query);
    const raw = py.runPython(`import sqlite3, json
conn = sqlite3.connect(':memory:')
conn.executescript(trace_sql_setup)
steps = 0
def limit_query():
    global steps
    steps += 1
    return 1 if steps > 20000 else 0
conn.set_progress_handler(limit_query, 1000)
try:
    cursor = conn.execute(trace_sql_query)
    columns = [d[0] for d in cursor.description] if cursor.description else []
    rows = cursor.fetchmany(101) if columns else []
    result = json.dumps({'columns':columns,'rows':rows[:100],'truncated':len(rows)>100,'changed':cursor.rowcount})
finally:
    conn.close()
result`);
    self.postMessage({ type: "result", result: JSON.parse(raw) });
  } catch (e) {
    self.postMessage({ type: "error", error: String(e) });
  }
};
