import type { Language } from "../curriculum/playground";
export type Topic =
  | "ownership"
  | "sequence"
  | "strings"
  | "utilities"
  | "sets"
  | "maps"
  | "queue"
  | "stack"
  | "heap"
  | "sort"
  | "comparator"
  | "search";
export type LibraryInput = {
  nums: number[];
  value: number;
  target: number;
  text: string;
};
export type LibraryLesson = {
  id: string;
  language: Language;
  topic: Topic;
  title: string;
  module: string;
  summary: string;
  explanation: string;
  use: string;
  pitfalls: string[];
  costs: string;
  syntax: string[];
  source: string;
  docs: string;
  problem: string;
  task: string;
  prediction: string;
  hint: string;
  prerequisites: string[];
};
export const languageTracks = [
  {
    id: "cpp" as const,
    name: "C++",
    version: "C++17",
    label: "Standard Template Library",
    summary: "References, containers, iterators, and algorithms.",
  },
  {
    id: "python" as const,
    name: "Python",
    version: "Python 3",
    label: "Built-ins & standard library",
    summary: "Mutability, collections, heaps, and expressive iteration.",
  },
  {
    id: "java" as const,
    name: "Java",
    version: "Java 8",
    label: "Collections Framework",
    summary: "References, generics, collections, and comparison contracts.",
  },
  {
    id: "javascript" as const,
    name: "JavaScript",
    version: "ES2022",
    label: "Built-ins & DSA utilities",
    summary: "Arrays, Map, Set, comparisons, and utilities you build yourself.",
  },
];
export const defaultLibraryInput: LibraryInput = {
  nums: [4, 1, 4, 2],
  value: 3,
  target: 4,
  text: "trace",
};
const topicOrder: Topic[] = [
  "ownership",
  "sequence",
  "strings",
  "utilities",
  "sets",
  "maps",
  "queue",
  "stack",
  "heap",
  "sort",
  "comparator",
  "search",
];
const info: Record<
  Topic,
  {
    summary: string;
    use: string;
    task: string;
    costs: string;
    problem: string;
    hint: string;
  }
> = {
  ownership: {
    summary: "Follow an alias and a separate copy when a collection changes.",
    use: "When a function may change a collection that another part of your program still needs.",
    task: "Copy nums, create an alias of the original collection, append value through the alias, and return {original, alias, copy}. The copy must retain the old values.",
    costs: "Copy: O(n) time and extra space. Creating the alias: O(1).",
    problem: "missing-number",
    hint: "An alias points to the same collection. Make the separate copy before appending.",
  },
  sequence: {
    summary: "Append a value and inspect the collection length.",
    use: "Store indexed values whose count can grow during a solution.",
    task: "Return {values, size}, where values contains nums followed by value and size is its new length. Leave the input collection unchanged.",
    costs:
      "Our copy takes O(n) time/space. Dynamic-array append is usually amortized O(1); occasional growth copies existing elements.",
    problem: "maximum-average-subarray",
    hint: "Copy the input, append once, then measure the new collection.",
  },
  strings: {
    summary: "Reverse a short ASCII string and inspect the result.",
    use: "Understand indexing and string construction before substring and pointer problems.",
    task: "Return text reversed. Empty text must return an empty string. These cross-language examples use ASCII characters.",
    costs: "O(m) time and space for a string of length m.",
    problem: "minimum-window",
    hint: "Visit characters from the end, or reverse a mutable character buffer.",
  },
  utilities: {
    summary: "Filter positive values and transform each one.",
    use: "Express a small transformation without mixing filtering and unrelated state changes.",
    task: "Return twice each strictly positive number from nums, preserving input order. Exclude zero and negative values.",
    costs: "O(n) time and O(n) output space.",
    problem: "two-sum-sorted",
    hint: "First test x > 0; only then append x * 2.",
  },
  sets: {
    summary: "Keep unique values, then order the result explicitly.",
    use: "Track membership or remove duplicates before processing distinct values.",
    task: "Return the distinct integers in nums in ascending order. Do not rely on hash-set iteration order.",
    costs:
      "Hash insertion is expected O(1) per value; worst cases depend on hashing. Ordering k unique values adds O(k log k) in the implementations that sort. C++ std::set inserts in O(log k).",
    problem: "duplicate-number",
    hint: "Build a set for uniqueness. Convert it to an ordered result where the language requires it.",
  },
  maps: {
    summary: "Count occurrences with a key-to-count collection.",
    use: "Frequency tables, lookup caches, and grouping.",
    task: "Return an object mapping the string form of each integer in nums to its occurrence count. Empty nums returns {}.",
    costs:
      "Expected O(n) total with hash maps and O(k) space for k keys; pathological collisions can change lookup cost.",
    problem: "top-k-frequent",
    hint: "For each value, read a missing count as zero and add one.",
  },
  queue: {
    summary: "Remove the oldest value and put it at the back.",
    use: "Breadth-first search, buffering, and tasks processed in arrival order.",
    task: "Return nums rotated left by one position using FIFO operations. Empty nums returns [].",
    costs:
      "O(n) to build and return the queue. Deque end operations are O(1) or amortized O(1) in the libraries taught; JavaScript Array.shift may move O(n) elements.",
    problem: "level-order",
    hint: "If the queue is nonempty, remove its front and append that value at its back.",
  },
  stack: {
    summary: "Push values, then pop the most recent one first.",
    use: "Nested parsing, undo operations, and explicit depth-first search.",
    task: "Push every number in input order, then return the complete pop order. Empty nums returns [].",
    costs:
      "O(n) total time and extra space. End push/pop typically take amortized O(1).",
    problem: "valid-parentheses",
    hint: "A stack reverses arrival order. Pop until it is empty.",
  },
  heap: {
    summary: "Repeatedly remove the smallest available value.",
    use: "Priority scheduling, top-K problems, and merging ordered streams.",
    task: "Build a min-priority queue from nums and return the values in repeated extract-min order. Keep duplicates. Empty nums returns [].",
    costs:
      "O(n log n) for repeated insertions and removals; heap construction can be O(n) when heapify is available. O(n) extra space.",
    problem: "kth-largest",
    hint: "The result of each pop must be the smallest remaining item, not necessarily the next item in the underlying storage.",
  },
  sort: {
    summary:
      "Sort numeric values without accidentally sorting their text forms.",
    use: "Ordered processing, two pointers, and preparing binary search.",
    task: "Return nums in ascending numeric order without modifying the input collection. Keep duplicates.",
    costs:
      "The provided standard sort APIs have language-specific guarantees. C++ std::sort guarantees O(n log n) comparisons; JavaScript specifies no universal time/space bound. Copying input adds O(n) space.",
    problem: "merge-intervals",
    hint: "Work on a copy. JavaScript needs a numeric comparison function.",
  },
  comparator: {
    summary: "Sort value/index records with an explicit tie-breaking rule.",
    use: "Ranking records when one field alone does not define the required order.",
    task: "Return [value, originalIndex] pairs, ordered by value descending and then originalIndex ascending. Keep every input item.",
    costs:
      "O(n) to build records, followed by the language’s sorting cost; O(n) output space.",
    problem: "car-fleet",
    hint: "Compare values first. If equal, compare the original indices ascending.",
  },
  search: {
    summary:
      "Find the first sorted position that is not smaller than a target.",
    use: "Insertion positions, range queries, and binary search with duplicate values.",
    task: "Sort a copy of nums, then return the first index whose value is >= target. If none exists, return nums.length. Empty nums returns 0.",
    costs:
      "Sorting first adds its own cost. Binary search on the sorted random-access sequence takes O(log n) comparisons.",
    problem: "binary-search-standard",
    hint: "Use a half-open [left, right) range. Equality moves the right boundary left.",
  },
};
const titles: Record<Language, Record<Topic, string>> = {
  cpp: {
    ownership: "References, const & copies",
    sequence: "vector: size, append & growth",
    strings: "string: characters & reversal",
    utilities: "Templates, iterators & algorithms",
    sets: "set & unordered_set",
    maps: "map & unordered_map",
    queue: "deque & queue",
    stack: "stack: last in, first out",
    heap: "priority_queue & min-heaps",
    sort: "sort, reverse & accumulate",
    comparator: "pair & custom comparators",
    search: "lower_bound & upper_bound",
  },
  python: {
    ownership: "Names, mutability & shallow copies",
    sequence: "list & tuple",
    strings: "str: slices & immutable text",
    utilities: "Comprehensions & itertools",
    sets: "set: membership & uniqueness",
    maps: "dict, Counter & defaultdict",
    queue: "collections.deque",
    stack: "list as a stack",
    heap: "heapq: heapify, push & pop",
    sort: "sorted, sort & key functions",
    comparator: "Tuples & compound sort keys",
    search: "bisect_left & bisect_right",
  },
  java: {
    ownership: "References, equals & copies",
    sequence: "ArrayList, arrays & generics",
    strings: "String & StringBuilder",
    utilities: "Iteration & generic methods",
    sets: "HashSet & TreeSet",
    maps: "HashMap & getOrDefault",
    queue: "ArrayDeque as a queue",
    stack: "ArrayDeque as a stack",
    heap: "PriorityQueue",
    sort: "Collections.sort & Arrays.sort",
    comparator: "Comparable & Comparator",
    search: "Binary search & insertion points",
  },
  javascript: {
    ownership: "References, const & shallow copies",
    sequence: "Array: push, slice & spread",
    strings: "Strings: indexing & construction",
    utilities: "map, filter & destructuring",
    sets: "Set: membership & uniqueness",
    maps: "Map: keys & frequency tables",
    queue: "FIFO queues & head indices",
    stack: "Array: push & pop",
    heap: "Build a min-heap utility",
    sort: "Numeric sort & mutation",
    comparator: "Comparison functions & tie-breaks",
    search: "Build lowerBound",
  },
};
const notes: Record<Language, Record<Topic, [string, string[], string[]]>> = {
  cpp: {
    ownership: [
      "T& aliases an existing value; a copied vector owns its own elements. const restricts mutation through that access path, not through every possible alias.",
      [
        "Appending may invalidate iterators and references if a vector reallocates.",
        "A const reference is not a deep freeze.",
      ],
      [
        "vector<int> copy = original;",
        "vector<int>& alias = original;",
        "const vector<int>& view = original;",
      ],
    ],
    sequence: [
      "vector stores contiguous elements. size counts live elements; capacity counts available storage before another allocation. reserve changes capacity, not size.",
      [
        "reserve(n) does not make operator[](n-1) valid.",
        "Check empty() before front(), back(), or pop_back().",
      ],
      [
        "v.push_back(value);",
        "v.size(); v.capacity();",
        "v.reserve(n); v.erase(v.begin() + i);",
      ],
    ],
    strings: [
      "std::string is mutable. Its iterators let std::reverse reverse a character range in place. These examples use ASCII; byte reversal is not Unicode grapheme reversal.",
      [
        "Check bounds before indexing.",
        "Do not interpret byte length as the number of visible Unicode characters.",
      ],
      [
        'string s = data["text"];',
        "reverse(s.begin(), s.end());",
        "s.substr(start, count);",
      ],
    ],
    utilities: [
      "Containers expose iterators to generic algorithms. begin is included; end is excluded. A template can accept different element types; this example uses a generic predicate with copy_if and then transform.",
      [
        "Never dereference end().",
        "std::sort requires random-access iterators; list has its own sort member.",
      ],
      [
        "template<class T> bool positive(T x) { return x > 0; }",
        "copy_if(v.begin(), v.end(), back_inserter(out), positive<int>);",
        "transform(out.begin(), out.end(), out.begin(), [](int x){ return 2*x; });",
      ],
    ],
    sets: [
      "std::set maintains sorted unique values. unordered_set provides hash-based membership without sorted iteration. Pick the structure based on the operations you need.",
      [
        "unordered_set iteration is not sorted.",
        "Repeated insertion does not add a second copy.",
      ],
      [
        "set<int> s(v.begin(), v.end());",
        "s.insert(x); s.count(x);",
        "unordered_set<int> seen;",
      ],
    ],
    maps: [
      "map orders keys; unordered_map hashes keys. operator[] inserts a missing key, which is useful for counters but can mutate the map during a lookup.",
      [
        "Use find for a lookup that must not insert.",
        "unordered_map does not give sorted traversal.",
      ],
      [
        "unordered_map<int,int> count;",
        "++count[x];",
        "auto it = count.find(x);",
      ],
    ],
    queue: [
      "deque supports both ends. queue is a FIFO adapter exposing front, back, push, and pop; pop returns no value.",
      ["Read front before pop.", "Do not read or pop an empty queue."],
      [
        "deque<int> q(v.begin(), v.end());",
        "q.push_back(q.front()); q.pop_front();",
        "queue<int> q; q.push(x); q.front(); q.pop();",
      ],
    ],
    stack: [
      "stack is an adapter: top observes the newest element and pop removes it. It does not expose general iterator traversal.",
      ["pop returns void.", "Check empty before top and pop."],
      ["stack<int> s; s.push(x);", "int x = s.top(); s.pop();"],
    ],
    heap: [
      "priority_queue is a max-heap by default. greater<int> changes it to a min-heap. Heap storage is not a fully sorted sequence.",
      [
        "The default top is the largest value.",
        "Copy top before pop; do not retain references to removed elements.",
      ],
      [
        "priority_queue<int, vector<int>, greater<int>> q;",
        "q.push(x); q.top(); q.pop();",
      ],
    ],
    sort: [
      "sort orders a random-access iterator range. reverse changes a range in place. accumulate folds values from an initial accumulator whose type matters.",
      [
        "Use 0LL when an integer sum needs long long.",
        "A comparator must obey strict weak ordering.",
      ],
      [
        "sort(v.begin(), v.end());",
        "reverse(v.begin(), v.end());",
        "accumulate(v.begin(), v.end(), 0LL);",
      ],
    ],
    comparator: [
      "pair combines two related values. Define a strict comparator for descending value and ascending index; the explicit tie-break works even with an unstable sorting algorithm.",
      [
        "Use < or >, not <=, for equal records.",
        "Do not subtract large integers in a comparator if it may overflow.",
      ],
      [
        "vector<pair<int,int>> records;",
        "sort(r.begin(), r.end(), [](auto a, auto b){ return a.first != b.first ? a.first > b.first : a.second < b.second; });",
      ],
    ],
    search: [
      "lower_bound finds the first value >= target in a sorted range. upper_bound finds the first value > target. Their difference counts occurrences in a sorted vector.",
      [
        "The range must satisfy the required ordering.",
        "end means no qualifying value; do not dereference it.",
      ],
      [
        "auto it = lower_bound(v.begin(), v.end(), target);",
        "int index = int(it - v.begin());",
        "upper_bound(v.begin(), v.end(), target);",
      ],
    ],
  },
  python: {
    ownership: [
      "Assignment binds another name to the same object. list.copy makes a shallow copy: nested objects would still be shared.",
      [
        "A shallow copy does not recursively copy nested lists.",
        "Mutating a list through either name affects both aliases.",
      ],
      ["alias = original", "copy = original.copy()"],
    ],
    sequence: [
      "A list is a mutable sequence. A tuple is an immutable sequence of references; objects stored inside a tuple can still be mutable.",
      ["append returns None.", "Use an index only when it is in range."],
      ['values = list(data["nums"])', "values.append(value)", "point = (x, y)"],
    ],
    strings: [
      "str is immutable. Slices construct new strings; text[::-1] reverses code points. These examples are restricted to ASCII, where that is also character reversal.",
      [
        "Strings cannot be changed with text[i] = value.",
        "Complex Unicode text can contain multi-code-point characters.",
      ],
      ["text[::-1]", "text[start:end]"],
    ],
    utilities: [
      "Comprehensions can combine a filter and a transformation. itertools provides lazy iteration tools; materialize an iterator only when you need all its results.",
      [
        "A comprehension still allocates its output list.",
        "Some iterators are consumed once; do not assume a second traversal has the same values.",
      ],
      [
        "[2*x for x in nums if x > 0]",
        "from itertools import accumulate",
        "list(accumulate(nums))",
      ],
    ],
    sets: [
      "set stores unique hashable values. It supports membership checks without requiring a linear scan; sorted(set(nums)) orders the result separately.",
      [
        "Lists cannot be set elements because they are unhashable.",
        "Do not rely on set iteration order.",
      ],
      ["seen = set(nums)", "x in seen", "seen.add(x)"],
    ],
    maps: [
      "dict maps keys to values. Counter counts occurrences; defaultdict supplies a factory for missing entries. Reading a missing defaultdict key can insert an entry.",
      [
        "dict.get does not insert; defaultdict indexing may.",
        "Keys must be hashable.",
      ],
      ["count[x] = count.get(x, 0) + 1", "Counter(nums)", "defaultdict(int)"],
    ],
    queue: [
      "deque supports fast append and pop operations at both ends, making it useful for BFS. list.pop(0) shifts the remaining elements.",
      ["Use popleft for FIFO behavior.", "Check for emptiness before popping."],
      [
        "from collections import deque",
        "q = deque(nums)",
        "q.append(q.popleft())",
      ],
    ],
    stack: [
      "list.append pushes at the end; list.pop removes the end. This gives LIFO order without a separate stack class.",
      [
        "pop(0) behaves like queue removal, not stack removal.",
        "An empty pop raises IndexError.",
      ],
      ["stack.append(x)", "x = stack.pop()"],
    ],
    heap: [
      "heapq operates on a list representing a min-heap. heapify changes the list in place; heappop removes its smallest item.",
      [
        "The backing list is not sorted.",
        "The portable examples use the min-heap API available across Python 3 versions.",
      ],
      [
        "heapq.heapify(values)",
        "heapq.heappush(values, x)",
        "heapq.heappop(values)",
      ],
    ],
    sort: [
      "sorted returns a new list. list.sort mutates its list and returns None. A key function computes values used to order items.",
      [
        "Do not assign result = nums.sort().",
        "Custom record ordering should define ties explicitly.",
      ],
      [
        "ordered = sorted(nums)",
        "nums.sort()",
        "sorted(records, key=lambda r: r[0])",
      ],
    ],
    comparator: [
      "Tuples compare lexicographically. A key of (-value, index) expresses descending value and ascending index; sort returns the records in that order.",
      [
        "A negative primary key reverses just that numeric field.",
        "Keys must contain mutually comparable types.",
      ],
      [
        "records = [(value, i) for i, value in enumerate(nums)]",
        "sorted(records, key=lambda r: (-r[0], r[1]))",
      ],
    ],
    search: [
      "bisect_left returns the first insertion index before equal values. bisect_right returns the index after equal values. Inserting into a list still shifts elements.",
      [
        "bisect requires a sorted sequence.",
        "O(log n) search does not make list insertion O(log n).",
      ],
      [
        "from bisect import bisect_left, bisect_right",
        "bisect_left(values, target)",
        "bisect_right(values, target)",
      ],
    ],
  },
  java: {
    ownership: [
      "Reference assignment shares an object. new ArrayList<>(original) copies its element references. equals checks value equality as defined by the class; == checks reference identity for objects.",
      ["A list copy is shallow.", "Use equals for String content comparison."],
      [
        "List<Integer> alias = original;",
        "List<Integer> copy = new ArrayList<>(original);",
        "a.equals(b)",
      ],
    ],
    sequence: [
      "ArrayList<Integer> is a resizable list. Generics use reference types, so int values are boxed as Integer. Arrays have fixed length; ArrayList has a changing size.",
      [
        "Arrays.asList has a fixed-size list view.",
        "list.remove(1) removes index 1; remove(Integer.valueOf(1)) removes a matching value.",
      ],
      [
        "List<Integer> values = new ArrayList<>();",
        "values.add(x); values.get(i);",
        "values.size();",
      ],
    ],
    strings: [
      "String is immutable. StringBuilder lets you construct and reverse text without repeatedly making String objects. These exercises use ASCII.",
      [
        "Use equals for String content.",
        "substring(start, end) takes an exclusive end index, not a count.",
      ],
      [
        "new StringBuilder(text).reverse().toString()",
        "text.substring(start, end)",
      ],
    ],
    utilities: [
      "Enhanced for loops visit values directly. A generic method can work across reference types; this example uses a typed List<Integer> to filter and transform numbers.",
      [
        "Removing from a collection while iterating can cause ConcurrentModificationException.",
        "A generic T does not support arithmetic without an appropriate numeric contract.",
      ],
      [
        "for (int x : nums) { ... }",
        "static <T> T identity(T value) { return value; }",
      ],
    ],
    sets: [
      "HashSet provides hash-based uniqueness. TreeSet orders its unique elements. equals and hashCode must agree for reliable hash-based membership.",
      [
        "HashSet iteration is not sorted.",
        "A mutable object key can become difficult to find after changing equality-related fields.",
      ],
      [
        "Set<Integer> seen = new HashSet<>();",
        "seen.add(x); seen.contains(x);",
        "new TreeSet<>(seen)",
      ],
    ],
    maps: [
      "HashMap associates keys with values. getOrDefault simplifies counters without treating a missing value as an error.",
      [
        "get can return null; unboxing it may throw.",
        "Custom keys need consistent equals and hashCode.",
      ],
      ["count.put(x, count.getOrDefault(x, 0) + 1);", "count.containsKey(x);"],
    ],
    queue: [
      "ArrayDeque implements Deque and supports FIFO operations with addLast and removeFirst. It does not accept null elements.",
      [
        "pollFirst returns null for an empty deque; removeFirst throws.",
        "Choose names that make which end you are using explicit.",
      ],
      [
        "Deque<Integer> q = new ArrayDeque<>();",
        "q.addLast(x); q.removeFirst();",
      ],
    ],
    stack: [
      "ArrayDeque supports LIFO with push and pop at the front. It is usually a better stack choice than the legacy Stack class.",
      [
        "Do not mix stack push/pop with queue addLast/removeFirst accidentally.",
        "Check isEmpty before pop.",
      ],
      ["Deque<Integer> s = new ArrayDeque<>();", "s.push(x); s.pop();"],
    ],
    heap: [
      "PriorityQueue exposes the least element under its comparator. poll removes that element; iteration does not give sorted order.",
      [
        "Natural-order integer queues are min-heaps.",
        "poll on an empty queue returns null.",
      ],
      [
        "PriorityQueue<Integer> q = new PriorityQueue<>();",
        "q.add(x); q.peek(); q.poll();",
      ],
    ],
    sort: [
      "Collections.sort orders a mutable List. Arrays.sort orders an array. For objects, Comparator describes an external ordering; Comparable describes the class’s natural ordering.",
      [
        "Sorting mutates the supplied collection.",
        "Do not assume every List implementation supports mutation.",
      ],
      ["Collections.sort(values);", "Arrays.sort(array);"],
    ],
    comparator: [
      "Comparator can order records without changing their class. Use Integer.compare instead of subtraction to avoid overflow for unrestricted integer values.",
      [
        "A comparator must be consistent and transitive.",
        "Comparable defines natural order; Comparator defines a chosen order.",
      ],
      [
        "Comparator<int[]> order = (a,b) -> a[0] != b[0] ? Integer.compare(b[0],a[0]) : Integer.compare(a[1],b[1]);",
      ],
    ],
    search: [
      "Collections.binarySearch returns an arbitrary matching index when duplicates exist. A missing target gives -(insertionPoint)-1. To find the first equal position, implement lower-bound search.",
      [
        "Do not treat a negative return as an ordinary index.",
        "Our first-match exercise needs a lower-bound loop, not a direct binarySearch call.",
      ],
      [
        "Collections.binarySearch(values, target);",
        "int insertion = -missingResult - 1;",
      ],
    ],
  },
  javascript: {
    ownership: [
      "Objects and arrays are shared through references. const prevents rebinding the variable; it does not freeze an array. Spread makes a shallow copy.",
      [
        "Nested objects remain shared after spreading.",
        "const values = [] still permits values.push(x).",
      ],
      ["const alias = original;", "const copy = [...original];"],
    ],
    sequence: [
      "Array is mutable and can grow. push returns the new length; slice and spread create shallow copies. This track uses dense numeric arrays.",
      [
        "Do not confuse slice, which copies, with splice, which mutates.",
        "Sparse array holes behave differently across iteration methods.",
      ],
      ["const values = [...data.nums];", "values.push(value); values.length;"],
    ],
    strings: [
      "Strings are immutable. Splitting into an array permits reversal, then join constructs the result. The exercise uses ASCII; arbitrary Unicode needs more careful character segmentation.",
      [
        'split("") splits UTF-16 code units.',
        "String indexing does not let you assign a replacement character.",
      ],
      ['text.split("").reverse().join("")', "text.slice(start, end)"],
    ],
    utilities: [
      "filter keeps matching values and map transforms them. Destructuring extracts input fields while leaving their names explicit.",
      [
        "map and filter allocate new arrays.",
        "A callback with a block body needs an explicit return.",
      ],
      ["const { nums } = data;", "nums.filter(x => x > 0).map(x => x * 2)"],
    ],
    sets: [
      "Set stores unique values using SameValueZero equality. Object entries are compared by reference, not by matching their fields.",
      [
        "Two separate {x:1} objects remain two set entries.",
        "Sort explicitly when the output must be numeric and ordered.",
      ],
      ["const seen = new Set(nums);", "seen.add(x); seen.has(x);"],
    ],
    maps: [
      "Map supports keys of different types and avoids ordinary object prototype-name concerns. Get a missing key as undefined, then supply a starting count.",
      [
        'Map keys 1 and "1" differ.',
        "JSON.stringify(new Map()) does not serialize its entries by itself.",
      ],
      ["count.set(x, (count.get(x) ?? 0) + 1);", "Object.fromEntries(count)"],
    ],
    queue: [
      "JavaScript has no built-in deque. A simple queue can keep a head index instead of repeatedly calling shift; compact the consumed prefix periodically in long-lived queues.",
      [
        "Array.shift may move many remaining values.",
        "A head-index queue retains consumed storage until compacted.",
      ],
      ["let head = 0;", "const next = queue[head++];", "queue.push(next);"],
    ],
    stack: [
      "Array.push and Array.pop provide LIFO operations. pop returns undefined on an empty array.",
      [
        "Check length when undefined could also be a stored value.",
        "shift removes the front, not the stack top.",
      ],
      ["stack.push(x);", "const x = stack.pop();"],
    ],
    heap: [
      "JavaScript has no standard PriorityQueue. This lesson builds a binary min-heap with sift-up and sift-down; each parent stays no larger than its children.",
      [
        "The backing array is not sorted.",
        "Replacing the root requires restoring the heap invariant.",
      ],
      [
        "heap.push(x); // custom utility below",
        "heap.pop(); // custom utility below",
      ],
    ],
    sort: [
      "Array.sort changes the array. Without a comparator, it compares string forms. Numeric ascending order uses (a,b) => a-b. The specification does not mandate one algorithm or a complexity bound.",
      [
        "Default sort places 10 before 2.",
        "Copy first when the caller still needs original order.",
      ],
      ["const ordered = [...nums].sort((a,b) => a-b);"],
    ],
    comparator: [
      "A sort callback returns a negative value, zero, or a positive value. Compare descending values, then ascending indices to specify deterministic ties.",
      [
        "A boolean callback does not define the required three-way comparison.",
        "Do not use a comparator whose result changes inconsistently.",
      ],
      ["records.sort((a,b) => b[0]-a[0] || a[1]-b[1]);"],
    ],
    search: [
      "JavaScript has no standard lower_bound. Implement a half-open binary search with right initialized to length. Equality moves the right boundary so the first equal position is retained.",
      [
        "indexOf is a linear search, not binary search.",
        "Sort with numeric comparison before applying the ordered search.",
      ],
      ["while (left < right) { const mid = Math.floor((left+right)/2); ... }"],
    ],
  },
};
import { librarySource } from "./sources";
const docs: Record<Language, string> = {
  cpp: "https://learn.microsoft.com/en-us/cpp/standard-library/",
  python: "https://docs.python.org/3/library/",
  java: "https://docs.oracle.com/javase/8/docs/api/java/util/package-summary.html",
  javascript:
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects",
};
export const libraryLessons: LibraryLesson[] = languageTracks.flatMap((track) =>
  topicOrder.map((topic, index) => {
    const details = notes[track.id][topic],
      meta = info[topic];
    return {
      id: `${track.id}-${topic}`,
      language: track.id,
      topic,
      title: titles[track.id][topic],
      module:
        index < 4
          ? "Language foundations"
          : index < 9
            ? "Collections"
            : "Ordering & search",
      ...meta,
      explanation: details[0],
      pitfalls: details[1],
      syntax: details[2],
      source: librarySource(track.id, topic),
      docs: docs[track.id],
      prediction:
        "Predict the complete returned JSON value for the selected input.",
      prerequisites:
        index === 0 ? [] : [`${track.id}-${topicOrder[index - 1]}`],
    };
  }),
);
export const libraryLessonById = Object.fromEntries(
  libraryLessons.map((l) => [l.id, l]),
);
export function libraryURL(
  language: Language,
  topic?: Topic,
  reference = false,
) {
  return `/?view=languages&language=${language}${topic ? `&unit=${language}-${topic}` : ""}${reference ? "&mode=reference" : ""}`;
}
