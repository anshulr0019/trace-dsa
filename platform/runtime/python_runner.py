import sys, json, io, contextlib, math, traceback
from collections import deque

if sys.platform != "emscripten":
    import resource
    resource.setrlimit(resource.RLIMIT_CPU, (4, 4))
    resource.setrlimit(resource.RLIMIT_FSIZE, (1048576, 1048576))
    resource.setrlimit(resource.RLIMIT_NOFILE, (32, 32))
    resource.setrlimit(resource.RLIMIT_CORE, (0, 0))
payload = json.loads(__trace_payload) if "__trace_payload" in globals() else json.load(sys.stdin)
frames, steps, truncated = [], 0, False

def clean(value, depth=0, seen=None):
    if value is None or isinstance(value, (str, bool, int)):
        return value if not isinstance(value, str) else value[:2000]
    if isinstance(value, float): return value if math.isfinite(value) else str(value)
    if depth > 6: return "…"
    if seen is None: seen = set()
    if id(value) in seen: return "↩ shared reference"
    seen = seen | {id(value)}
    if isinstance(value, dict):
        return {str(k):clean(v,depth+1,seen) for k,v in list(value.items())[:100]}
    if isinstance(value, (list, tuple, set, deque)):
        items = sorted(value, key=repr) if isinstance(value, set) else value
        return [clean(v,depth+1,seen) for v in list(items)[:120]]
    return "<" + type(value).__name__ + ">"

def trace(frame, event, arg):
    global steps, truncated
    if frame.f_code.co_filename != "solution.py": return trace
    if event not in ("line", "return"): return trace
    steps += 1
    if steps > 30000: raise RuntimeError("Execution exceeded 30,000 traced steps; try a smaller input.")
    if len(frames) >= 1200:
        truncated = True
        return trace
    chain, current = [], frame
    while current and len(chain) < 30:
        if current.f_code.co_filename == "solution.py": chain.append(current)
        current = current.f_back
    state = {}
    for ancestor in reversed(chain):
        state.update({k:clean(v) for k,v in ancestor.f_locals.items() if not k.startswith("__") and not callable(v) and type(v).__name__ != "module"})
    frames.append({"line":frame.f_lineno,"event":event,"function":frame.f_code.co_name,"vars":state,"stack":[{"name":f.f_code.co_name,"line":f.f_lineno} for f in reversed(chain)]})
    if sys.platform != "emscripten":
        with open("frames.jsonl", "a") as saved:
            saved.write(json.dumps(frames[-1]) + "\n")
    return trace

class LimitedOutput(io.StringIO):
    def write(self, text):
        if self.tell() + len(text) > 16000:
            raise RuntimeError("Standard output exceeded 16,000 characters.")
        return super().write(text)

output = LimitedOutput()
result, error, error_line = None, None, 0
try:
    code = compile(payload["code"], "solution.py", "exec")
    namespace = {"__name__":"__lesson__"}
    with contextlib.redirect_stdout(output):
        sys.settrace(trace)
        exec(code, namespace)
        if not callable(namespace.get("solve")): raise ValueError("Define solve(data) and return your answer.")
        result = namespace["solve"](payload["input"])
except BaseException as exc:
    sys.settrace(None)
    error = "".join(traceback.format_exception_only(type(exc), exc)).strip()
    error_line = getattr(exc, "lineno", 0) or 0
    tb = exc.__traceback__
    while tb:
        if tb.tb_frame.f_code.co_filename == "solution.py": error_line = tb.tb_lineno
        tb = tb.tb_next
finally:
    sys.settrace(None)
try:
    # Snapshot previews are bounded; the returned answer must never be silently truncated.
    encoded_result = json.dumps(result, allow_nan=False)
    if len(encoded_result) > 1000000: raise ValueError("Returned answer exceeds 1 MB; use a smaller input.")
except (TypeError, ValueError, OverflowError) as exc:
    result, error = None, str(exc)
encoded_run = json.dumps({"result":result,"frames":frames,"stdout":output.getvalue(),"error":error,"errorLine":error_line,"truncated":truncated}, allow_nan=False)
if "__trace_payload" not in globals():
    print(encoded_run)
