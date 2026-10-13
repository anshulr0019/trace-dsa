import type { Language } from "../curriculum/playground";
import type { Topic } from "./catalog";
const bodies: Record<Language, Record<Topic, string>> = {
  cpp: {
    ownership: `vector<int> original = nums;\nvector<int> copy = original;\nvector<int>& alias = original;\nalias.push_back(value);\njson out = {{"original",original},{"alias",alias},{"copy",copy}};`,
    sequence: `vector<int> values = nums;\nvalues.push_back(value);\njson out = {{"values",values},{"size",values.size()}};`,
    strings: `string out = text;\nreverse(out.begin(), out.end());`,
    utilities: `vector<int> out;\ncopy_if(nums.begin(), nums.end(), back_inserter(out), positive<int>);\ntransform(out.begin(), out.end(), out.begin(), [](int x){ return x*2; });`,
    sets: `set<int> unique(nums.begin(), nums.end());\nvector<int> out(unique.begin(), unique.end());`,
    maps: `unordered_map<int,int> count;\nfor (int x : nums) ++count[x];\njson out = json::object();\nfor (const auto& entry : count) out[to_string(entry.first)] = entry.second;`,
    queue: `deque<int> q(nums.begin(), nums.end());\nif (!q.empty()) { int front = q.front(); q.pop_front(); q.push_back(front); }\nvector<int> out(q.begin(), q.end());`,
    stack: `stack<int> s;\nfor (int x : nums) s.push(x);\nvector<int> out;\nwhile (!s.empty()) { out.push_back(s.top()); s.pop(); }`,
    heap: `priority_queue<int,vector<int>,greater<int>> q;\nfor (int x : nums) q.push(x);\nvector<int> out;\nwhile (!q.empty()) { out.push_back(q.top()); q.pop(); }`,
    sort: `vector<int> out = nums;\nsort(out.begin(), out.end());`,
    comparator: `vector<pair<int,int>> records;\nfor (int i=0; i<int(nums.size()); ++i) records.push_back({nums[i],i});\nsort(records.begin(), records.end(), [](auto a, auto b) {\n    return a.first != b.first ? a.first > b.first : a.second < b.second;\n});\njson out = json::array();\nfor (auto record : records) out.push_back({record.first,record.second});`,
    search: `vector<int> ordered = nums;\nsort(ordered.begin(), ordered.end());\nauto it = lower_bound(ordered.begin(), ordered.end(), target);\nint out = int(it - ordered.begin());`,
  },
  python: {
    ownership: `original = list(nums)\ncopy = original.copy()\nalias = original\nalias.append(value)\nout = {"original": original, "alias": alias, "copy": copy}`,
    sequence: `values = list(nums)\nvalues.append(value)\nout = {"values": values, "size": len(values)}`,
    strings: `out = text[::-1]`,
    utilities: `out = [2*x for x in nums if x > 0]`,
    sets: `out = sorted(set(nums))`,
    maps: `counts = Counter(nums)\nout = {str(key): count for key, count in counts.items()}`,
    queue: `q = deque(nums)\nif q:\n    q.append(q.popleft())\nout = list(q)`,
    stack: `stack = []\nfor x in nums:\n    stack.append(x)\nout = []\nwhile stack:\n    out.append(stack.pop())`,
    heap: `heap = list(nums)\nheapq.heapify(heap)\nout = []\nwhile heap:\n    out.append(heapq.heappop(heap))`,
    sort: `out = sorted(nums)`,
    comparator: `records = [(x, i) for i, x in enumerate(nums)]\nout = [list(record) for record in sorted(records, key=lambda r: (-r[0], r[1]))]`,
    search: `ordered = sorted(nums)\nout = bisect_left(ordered, target)`,
  },
  java: {
    ownership: `List<Integer> original = new ArrayList<>(nums);\nList<Integer> copy = new ArrayList<>(original);\nList<Integer> alias = original;\nalias.add(value);\nObject out = state("original",original,"alias",alias,"copy",copy);`,
    sequence: `List<Integer> values = new ArrayList<>(nums);\nvalues.add(value);\nObject out = state("values",values,"size",values.size());`,
    strings: `String out = new StringBuilder(text).reverse().toString();`,
    utilities: `List<Integer> out = new ArrayList<>();\nfor (int x : nums) if (x > 0) out.add(identity(x * 2));`,
    sets: `Set<Integer> unique = new TreeSet<>(nums);\nList<Integer> out = new ArrayList<>(unique);`,
    maps: `Map<String,Integer> out = new HashMap<>();\nfor (int x : nums) {\n    String key = String.valueOf(x);\n    out.put(key, out.getOrDefault(key, 0) + 1);\n}`,
    queue: `Deque<Integer> q = new ArrayDeque<>(nums);\nif (!q.isEmpty()) q.addLast(q.removeFirst());\nList<Integer> out = new ArrayList<>(q);`,
    stack: `Deque<Integer> stack = new ArrayDeque<>();\nfor (int x : nums) stack.push(x);\nList<Integer> out = new ArrayList<>();\nwhile (!stack.isEmpty()) out.add(stack.pop());`,
    heap: `PriorityQueue<Integer> q = new PriorityQueue<>();\nq.addAll(nums);\nList<Integer> out = new ArrayList<>();\nwhile (!q.isEmpty()) out.add(q.poll());`,
    sort: `List<Integer> out = new ArrayList<>(nums);\nCollections.sort(out);`,
    comparator: `List<int[]> out = new ArrayList<>();\nfor (int i=0; i<nums.size(); ++i) out.add(new int[]{nums.get(i),i});\nout.sort((a,b) -> a[0] != b[0] ? Integer.compare(b[0],a[0]) : Integer.compare(a[1],b[1]));`,
    search: `List<Integer> ordered = new ArrayList<>(nums);\nCollections.sort(ordered);\nint left=0, right=ordered.size();\nwhile (left < right) {\n    int mid = left + (right-left)/2;\n    if (ordered.get(mid) < target) left=mid+1;\n    else right=mid;\n}\nint out = left;`,
  },
  javascript: {
    ownership: `const original = [...nums];\nconst copy = [...original];\nconst alias = original;\nalias.push(value);\nconst out = {original, alias, copy};`,
    sequence: `const values = [...nums];\nvalues.push(value);\nconst out = {values, size: values.length};`,
    strings: `const out = text.split("").reverse().join("");`,
    utilities: `const out = nums.filter(x => x > 0).map(x => x * 2);`,
    sets: `const unique = new Set(nums);\nconst out = [...unique].sort((a,b) => a-b);`,
    maps: `const counts = new Map();\nfor (const x of nums) counts.set(x, (counts.get(x) ?? 0) + 1);\nconst out = Object.fromEntries(counts);`,
    queue: `const queue = [...nums];\nlet head = 0;\nif (queue.length) { const front = queue[head++]; queue.push(front); }\nconst out = queue.slice(head);`,
    stack: `const stack = [];\nfor (const x of nums) stack.push(x);\nconst out = [];\nwhile (stack.length) out.push(stack.pop());`,
    heap: `const heap = new MinHeap();\nfor (const x of nums) heap.push(x);\nconst out = [];\nwhile (heap.values.length) out.push(heap.pop());`,
    sort: `const out = [...nums].sort((a,b) => a-b);`,
    comparator: `const records = nums.map((value,index) => [value,index]);\nconst out = records.sort((a,b) => b[0]-a[0] || a[1]-b[1]);`,
    search: `const ordered = [...nums].sort((a,b) => a-b);\nlet left=0, right=ordered.length;\nwhile (left < right) {\n    const mid = Math.floor((left+right)/2);\n    if (ordered[mid] < target) left=mid+1;\n    else right=mid;\n}\nconst out = left;`,
  },
};
const heapUtility = `class MinHeap {
    constructor() { this.values = []; }
    push(value) {
        const a = this.values; a.push(value);
        let i = a.length - 1;
        while (i > 0) {
            const p = Math.floor((i-1)/2);
            if (a[p] <= a[i]) break;
            [a[p],a[i]] = [a[i],a[p]]; i = p;
        }
    }
    pop() {
        const a = this.values;
        if (!a.length) return undefined;
        const result = a[0], last = a.pop();
        if (a.length) {
            a[0] = last; let i = 0;
            while (true) {
                const l = i*2+1, r = l+1;
                let smallest = i;
                if (l < a.length && a[l] < a[smallest]) smallest = l;
                if (r < a.length && a[r] < a[smallest]) smallest = r;
                if (smallest === i) break;
                [a[i],a[smallest]] = [a[smallest],a[i]]; i = smallest;
            }
        }
        return result;
    }
}`;
const indent = (s: string) =>
  s
    .split("\n")
    .map((line) => "    " + line)
    .join("\n");
export function librarySource(
  language: Language,
  topic: Topic,
  starter = false,
): string {
  const body = starter
    ? {
        cpp: "json out = nullptr; // Implement the exercise here.",
        python: "out = None  # Implement the exercise here.",
        java: "Object out = null; // Implement the exercise here.",
        javascript: "const out = null; // Implement the exercise here.",
      }[language]
    : bodies[language][topic];
  if (language === "cpp")
    return `#include "trace.hpp"\n#include <deque>\n#include <iterator>\n${topic === "utilities" ? "template<class T> bool positive(T x) { return x > 0; }\n" : ""}json solve(json data) {\n    vector<int> nums = data["nums"];\n    int value = data["value"], target = data["target"];\n    string text = data["text"];\n    TRACE({{"nums",nums},{"text",text}});\n${indent(body)}\n    TRACE({{"nums",nums},{"result",out}});\n    return out;\n}`;
  if (language === "python")
    return `from collections import Counter, defaultdict, deque\nimport heapq\nfrom bisect import bisect_left, bisect_right\nfrom itertools import accumulate\n\ndef solve(data):\n    nums = list(data["nums"])\n    value, target, text = data["value"], data["target"], data["text"]\n${indent(body)}\n    return out\n`;
  if (language === "java")
    return `import java.util.*;\npublic class Solution extends Trace {\n    static <T> T identity(T value) { return value; }\n    public Object solve(Map<String,Object> data) {\n        List<Integer> nums = new ArrayList<>();\n        for (int x : ints(data,"nums")) nums.add(x);\n        int value = num(data,"value"), target = num(data,"target");\n        String text = str(data,"text");\n        trace("nums",nums,"text",text);\n${indent(indent(body))}\n        trace("nums",nums,"result",out);\n        return out;\n    }\n}`;
  return `${topic === "heap" ? heapUtility + "\n\n" : ""}function solve(data) {\n    const { nums, value, target, text } = data;\n    trace({nums, text});\n${indent(body)}\n    trace({nums, result:out});\n    return out;\n}`;
}
