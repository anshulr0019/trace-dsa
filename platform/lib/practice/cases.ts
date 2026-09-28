import type { Problem } from "../curriculum/catalog";

type Input = Record<string, unknown>;
// Three deliberately varied inputs per problem. Answers live in server/practice-answers.json.
const bank: Record<string, Input[]> = {
  "maximum-average-subarray": [
    { nums: [3, 8, -2, 7, 1], k: 2 },
    { nums: [-9, -3, -7, -4], k: 3 },
    { nums: [6, -8, 4, 9, -2, 7], k: 1 },
  ],
  "longest-unique-substring": [
    { s: "pwwkewa" },
    { s: "abccdefga" },
    { s: "dvdfxyz" },
  ],
  "character-replacement": [
    { s: "ABBCB", k: 1 },
    { s: "BAAABBC", k: 2 },
    { s: "ABABCCBA", k: 0 },
  ],
  "minimum-window": [
    { s: "cabefgecdaecf", t: "cae" },
    { s: "aaflslflsldkalskaaa", t: "aaa" },
    { s: "abdcab", t: "aabc" },
  ],
  "two-sum-sorted": [
    { nums: [-7, -2, 1, 5, 9], target: 3 },
    { nums: [1, 3, 6, 8, 12], target: 18 },
    { nums: [-8, -4, 0, 2, 11], target: 3 },
  ],
  "three-sum": [
    { nums: [-5, 1, 4, 0, -1, 1] },
    { nums: [-3, -3, 0, 3, 3] },
    { nums: [-7, -2, 4, 5, 6] },
  ],
  "container-water": [
    { height: [3, 8, 2, 5, 7] },
    { height: [9, 1, 1, 1, 9] },
    { height: [1, 2, 3, 4, 5, 6] },
  ],
  "trapping-rain": [
    { height: [5, 1, 3, 0, 4] },
    { height: [2, 0, 2, 0, 2] },
    { height: [6, 5, 4, 3, 2] },
  ],
  "middle-list": [
    { values: [8, 4, 9, 2, 7, 3], pos: -1 },
    { values: [2, 4, 6, 8, 10, 12, 14], pos: -1 },
    { values: [9, 7], pos: -1 },
  ],
  "linked-cycle": [
    { values: [8, 4, 9, 2], pos: 2 },
    { values: [6, 3, 8], pos: -1 },
    { values: [9], pos: 0 },
  ],
  "duplicate-number": [
    { nums: [4, 2, 3, 1, 4] },
    { nums: [2, 1, 3, 4, 5, 2] },
    { nums: [3, 1, 4, 2, 3, 5] },
  ],
  "cycle-entrance": [
    { values: [8, 4, 9, 2], pos: 2 },
    { values: [6, 3, 8], pos: -1 },
    { values: [9, 7, 5], pos: 0 },
  ],
  "next-greater": [
    { nums1: [3, 8, 2], nums2: [3, 1, 8, 2, 6] },
    { nums1: [7, 5], nums2: [7, 6, 5, 4] },
    { nums1: [1, 6], nums2: [1, 4, 2, 6, 9] },
  ],
  "daily-temperatures": [
    { temperatures: [61, 65, 62, 70, 68, 73] },
    { temperatures: [80, 80, 81, 79] },
    { temperatures: [90, 85, 80, 75] },
  ],
  "car-fleet": [
    { target: 15, position: [1, 4, 10], speed: [3, 2, 1] },
    { target: 20, position: [2, 7, 12], speed: [2, 3, 4] },
    { target: 18, position: [3, 6, 12], speed: [5, 4, 2] },
  ],
  "largest-rectangle": [
    { heights: [3, 1, 4, 4, 2] },
    { heights: [2, 3, 4, 5, 6] },
    { heights: [5, 0, 5, 5, 1] },
  ],
  "valid-parentheses": [{ s: "{[()]}([])" }, { s: "(([]{})]" }, { s: "[]{}(()" }],
  "reverse-polish": [
    { tokens: ["7", "2", "-", "3", "*"] },
    { tokens: ["9", "4", "-", "2", "/"] },
    { tokens: ["2", "9", "-", "3", "/"] },
  ],
  "min-stack": [
    {
      operations: [
        ["push", 4],
        ["push", 2],
        ["push", 2],
        ["pop"],
        ["getMin"],
        ["top"],
      ],
    },
    { operations: [["push", 8], ["push", -4], ["pop"], ["getMin"]] },
    {
      operations: [
        ["push", -7],
        ["push", 0],
        ["push", -9],
        ["getMin"],
        ["pop"],
        ["top"],
        ["getMin"],
      ],
    },
  ],
  "calculator-ii": [
    { s: "18/4+2*3" },
    { s: "7-10/3+2" },
    { s: " 12 + 6 / 4 * 3 " },
  ],
  "merge-intervals": [
    {
      intervals: [
        [2, 5],
        [4, 7],
        [9, 11],
      ],
    },
    {
      intervals: [
        [1, 9],
        [2, 3],
        [4, 8],
      ],
    },
    {
      intervals: [
        [1, 2],
        [2, 4],
        [6, 7],
      ],
    },
  ],
  "insert-interval": [
    {
      intervals: [
        [1, 2],
        [5, 7],
        [10, 12],
      ],
      newInterval: [3, 6],
    },
    {
      intervals: [
        [2, 4],
        [8, 10],
      ],
      newInterval: [1, 12],
    },
    {
      intervals: [
        [1, 3],
        [7, 9],
      ],
      newInterval: [4, 6],
    },
  ],
  "meeting-rooms": [
    {
      intervals: [
        [1, 5],
        [2, 6],
        [5, 8],
      ],
    },
    {
      intervals: [
        [1, 3],
        [3, 5],
        [5, 7],
      ],
    },
    {
      intervals: [
        [1, 9],
        [2, 8],
        [3, 7],
        [4, 6],
      ],
    },
  ],
  "burst-balloons-arrows": [
    {
      points: [
        [1, 5],
        [3, 7],
        [8, 10],
      ],
    },
    {
      points: [
        [1, 2],
        [2, 3],
        [3, 4],
      ],
    },
    {
      points: [
        [2, 9],
        [3, 8],
        [4, 7],
      ],
    },
  ],
  "reverse-list": [
    { values: [8, 3, 9, 1] },
    { values: [6, 6, 2, 6] },
    { values: [11, 4] },
  ],
  "reorder-list": [
    { values: [8, 3, 9, 1, 6, 4] },
    { values: [9, 2, 7, 4, 6] },
    { values: [7, 8, 9] },
  ],
  "copy-random-list": [
    { values: [4, 8, 2], random: [2, 0, 1] },
    { values: [9, 9], random: [1, 0] },
    { values: [6, 3, 7, 1], random: [null, 1, 0, 2] },
  ],
  "reverse-k-group": [
    { values: [8, 3, 9, 1, 6, 4, 2], k: 3 },
    { values: [9, 2, 7, 4], k: 4 },
    { values: [7, 8, 9, 10, 11], k: 2 },
  ],
  "binary-search-standard": [
    { nums: [-9, -3, 2, 6, 14], target: 6 },
    { nums: [1, 4, 7, 10], target: 5 },
    { nums: [-8, -2, 0, 5, 11, 19], target: -8 },
  ],
  "search-matrix": [
    {
      matrix: [
        [2, 4, 8],
        [11, 15, 19],
      ],
      target: 15,
    },
    {
      matrix: [
        [1, 5],
        [8, 12],
      ],
      target: 7,
    },
    { matrix: [[3, 6, 9, 12]], target: 12 },
  ],
  "koko-bananas": [
    { piles: [5, 9, 13], h: 7 },
    { piles: [7, 11, 15, 19], h: 4 },
    { piles: [2, 3, 4], h: 12 },
  ],
  "median-sorted-arrays": [
    { nums1: [2, 5, 9], nums2: [1, 7] },
    { nums1: [-8, -2], nums2: [3, 4, 10, 12] },
    { nums1: [], nums2: [3, 5, 7, 9] },
  ],
  "minimum-rotated": [
    { nums: [8, 11, 2, 4, 6] },
    { nums: [-6, -2, 3, 9] },
    { nums: [9, -7, -3, 1, 5] },
  ],
  "search-rotated": [
    { nums: [8, 11, 2, 4, 6], target: 4 },
    { nums: [5, 7, 9, -1, 1, 3], target: 6 },
    { nums: [9, -7, -3, 1, 5], target: 9 },
  ],
  "search-rotated-duplicates": [
    { nums: [3, 3, 6, 1, 2, 3], target: 1 },
    { nums: [4, 4, 4, 4, 4], target: 3 },
    { nums: [1, 1, 1, 2, 1, 1], target: 2 },
  ],
  "mountain-array": [
    { nums: [1, 4, 8, 12, 9, 4, 2], target: 4 },
    { nums: [2, 6, 10, 7, 3], target: 7 },
    { nums: [1, 3, 8, 5, 2], target: 4 },
  ],
  "level-order": [
    { tree: [8, 3, 10, 1, 6, null, 14] },
    { tree: [5, null, 7, null, 9] },
    { tree: [9, 4, 12, null, 6] },
  ],
  "right-side-view": [
    { tree: [8, 3, 10, 1, 6, null, 14] },
    { tree: [5, 7, null, 9] },
    { tree: [9, 4, 12, null, 6] },
  ],
  "next-right-pointers": [
    { tree: [8, 3, 10, 1, 6, 9, 14] },
    { tree: [5, 7, 9] },
    { tree: [11, 4, 16, 2, 6, 13, 18] },
  ],
  "word-ladder": [
    {
      beginWord: "cat",
      endWord: "dog",
      wordList: ["cot", "cog", "dog", "dat", "dot"],
    },
    {
      beginWord: "red",
      endWord: "tax",
      wordList: ["ted", "tex", "tax", "tad", "rex"],
    },
    {
      beginWord: "cold",
      endWord: "warm",
      wordList: ["cord", "card", "ward", "warm"],
    },
  ],
  "maximum-depth": [
    { tree: [8, 3, 10, 1, 6, null, 14] },
    { tree: [5, null, 7, null, 9, null, 11] },
    { tree: [9, 4, 12, null, 6] },
  ],
  "lowest-common-ancestor": [
    { tree: [8, 3, 10, 1, 6, null, 14], p: 1, q: 6 },
    { tree: [5, 2, 9, 1, 4, 7, 11], p: 2, q: 4 },
    { tree: [9, 4, 12, null, 6], p: 6, q: 12 },
  ],
  "tree-diameter": [
    { tree: [8, 3, 10, 1, 6, null, 14] },
    { tree: [5, null, 7, null, 9, null, 11] },
    { tree: [9, 4, 12, null, 6] },
  ],
  "maximum-path-sum": [
    { tree: [8, -3, 10, 1, 6, null, 14] },
    { tree: [-8, -3, -10, -1, -6] },
    { tree: [2, -4, 6, 8, 9, -3, 7] },
  ],
  "implement-trie": [
    {
      operations: [
        ["insert", "trace"],
        ["search", "tra"],
        ["startsWith", "tra"],
        ["insert", "tra"],
        ["search", "tra"],
      ],
    },
    {
      operations: [
        ["insert", "code"],
        ["insert", "coder"],
        ["search", "coders"],
        ["search", "code"],
      ],
    },
    {
      operations: [
        ["insert", "a"],
        ["insert", "ab"],
        ["search", "abc"],
        ["startsWith", "ab"],
      ],
    },
  ],
  "word-dictionary": [
    {
      operations: [
        ["addWord", "code"],
        ["search", "c..e"],
        ["search", "c.."],
      ],
    },
    {
      operations: [
        ["addWord", "tree"],
        ["addWord", "trie"],
        ["search", "tr.e"],
        ["search", "t...s"],
      ],
    },
    {
      operations: [
        ["addWord", "aa"],
        ["addWord", "ab"],
        ["search", ".."],
        ["search", ".c"],
      ],
    },
  ],
  "replace-words": [
    { dictionary: ["a", "ab", "cat"], sentence: "abacus cattle apple" },
    { dictionary: ["do", "dog", "run"], sentence: "dogs running downtown" },
    { dictionary: ["sun", "moon"], sentence: "sunlight moonstone star" },
  ],
  "word-search-ii": [
    {
      board: [
        ["c", "a"],
        ["t", "r"],
      ],
      words: ["cat", "car", "art", "cart"],
    },
    { board: [["a", "b", "a"]], words: ["aba", "ab", "aa", "abab"] },
    {
      board: [
        ["s", "e"],
        ["e", "d"],
      ],
      words: ["seed", "see", "deed"],
    },
  ],
  "missing-number": [
    { nums: [5, 0, 2, 1, 4] },
    { nums: [0, 1, 2, 3, 4, 5] },
    { nums: [1, 2, 3, 4, 5] },
  ],
  "disappeared-numbers": [
    { nums: [2, 2, 3, 4, 4, 6] },
    { nums: [1, 1, 1, 1, 1] },
    { nums: [6, 5, 4, 3, 2, 1] },
  ],
  "set-mismatch": [
    { nums: [1, 2, 3, 5, 5, 6] },
    { nums: [2, 2, 3, 4, 5] },
    { nums: [1, 2, 3, 4, 4] },
  ],
  "first-missing-positive": [
    { nums: [2, 5, -3, 1, 4] },
    { nums: [7, 8, 9, 11] },
    { nums: [1, 2, 3, 4, 5, 6] },
  ],
  "number-islands": [
    {
      grid: [
        [1, 0, 1, 1],
        [1, 0, 0, 1],
        [0, 1, 0, 0],
      ],
    },
    {
      grid: [
        [1, 0, 1],
        [0, 1, 0],
        [1, 0, 1],
      ],
    },
    {
      grid: [
        [1, 1, 1, 1],
        [0, 0, 0, 1],
      ],
    },
  ],
  "max-island-area": [
    {
      grid: [
        [1, 0, 1, 1],
        [1, 0, 0, 1],
        [0, 1, 0, 0],
      ],
    },
    {
      grid: [
        [1, 0, 1],
        [0, 1, 0],
        [1, 0, 1],
      ],
    },
    {
      grid: [
        [1, 1, 1, 1],
        [0, 0, 0, 1],
      ],
    },
  ],
  "rotting-oranges": [
    {
      grid: [
        [2, 1, 0],
        [1, 1, 1],
        [0, 1, 2],
      ],
    },
    {
      grid: [
        [2, 0, 1],
        [1, 0, 1],
      ],
    },
    { grid: [[1, 1, 1, 2]] },
  ],
  "pacific-atlantic": [
    {
      heights: [
        [3, 2, 4],
        [2, 1, 5],
        [6, 7, 8],
      ],
    },
    {
      heights: [
        [7, 7, 7],
        [7, 7, 7],
      ],
    },
    {
      heights: [
        [9, 8, 7, 6],
        [5, 4, 3, 2],
      ],
    },
  ],
  "course-schedule": [
    {
      numCourses: 5,
      prerequisites: [
        [1, 0],
        [2, 0],
        [3, 1],
        [4, 3],
      ],
    },
    {
      numCourses: 4,
      prerequisites: [
        [1, 0],
        [2, 1],
        [0, 2],
      ],
    },
    {
      numCourses: 6,
      prerequisites: [
        [2, 1],
        [5, 4],
      ],
    },
  ],
  "course-order": [
    {
      numCourses: 5,
      prerequisites: [
        [1, 0],
        [2, 0],
        [3, 1],
        [4, 3],
      ],
    },
    {
      numCourses: 4,
      prerequisites: [
        [1, 0],
        [2, 1],
        [0, 2],
      ],
    },
    {
      numCourses: 6,
      prerequisites: [
        [2, 1],
        [5, 4],
      ],
    },
  ],
  "build-matrix": [
    {
      k: 4,
      rowConditions: [
        [1, 3],
        [2, 4],
      ],
      colConditions: [
        [3, 2],
        [4, 1],
      ],
    },
    {
      k: 3,
      rowConditions: [
        [1, 2],
        [2, 1],
      ],
      colConditions: [],
    },
    {
      k: 4,
      rowConditions: [[4, 2]],
      colConditions: [
        [1, 3],
        [3, 2],
      ],
    },
  ],
  "alien-dictionary": [
    { words: ["za", "zb", "ca", "cb"] },
    { words: ["zab", "za"] },
    { words: ["baa", "abcd", "abca", "cab", "cad"] },
  ],
  "connected-components": [
    {
      n: 7,
      edges: [
        [0, 1],
        [1, 2],
        [3, 4],
        [5, 6],
      ],
    },
    {
      n: 6,
      edges: [
        [0, 1],
        [1, 2],
        [2, 0],
      ],
    },
    {
      n: 4,
      edges: [
        [0, 1],
        [1, 2],
        [2, 3],
      ],
    },
  ],
  "redundant-connection": [
    {
      edges: [
        [1, 2],
        [2, 3],
        [3, 4],
        [1, 4],
        [1, 5],
      ],
    },
    {
      edges: [
        [1, 2],
        [2, 3],
        [3, 4],
        [4, 2],
      ],
    },
    {
      edges: [
        [1, 3],
        [3, 2],
        [2, 4],
        [4, 1],
      ],
    },
  ],
  "accounts-merge": [
    {
      accounts: [
        ["Ada", "a@x", "b@x"],
        ["Ada", "c@x"],
        ["Ada", "b@x", "d@x"],
      ],
    },
    {
      accounts: [
        ["Sam", "a@x"],
        ["Sam", "b@x"],
      ],
    },
    {
      accounts: [
        ["Lee", "a@x", "b@x"],
        ["Lee", "c@x", "d@x"],
        ["Lee", "b@x", "c@x"],
      ],
    },
  ],
  "islands-ii": [
    {
      m: 2,
      n: 4,
      positions: [
        [0, 0],
        [0, 2],
        [0, 1],
        [1, 3],
      ],
    },
    {
      m: 3,
      n: 2,
      positions: [
        [0, 0],
        [0, 0],
        [2, 1],
        [1, 0],
        [2, 0],
      ],
    },
    {
      m: 2,
      n: 3,
      positions: [
        [0, 0],
        [1, 2],
        [1, 1],
        [0, 1],
      ],
    },
  ],
  "network-delay": [
    {
      n: 4,
      k: 1,
      times: [
        [1, 2, 4],
        [1, 3, 1],
        [3, 2, 1],
        [2, 4, 2],
      ],
    },
    {
      n: 5,
      k: 2,
      times: [
        [2, 1, 3],
        [2, 3, 2],
        [3, 4, 1],
      ],
    },
    {
      n: 3,
      k: 3,
      times: [
        [3, 2, 5],
        [2, 1, 2],
        [3, 1, 9],
      ],
    },
  ],
  "maximum-probability": [
    {
      n: 4,
      edges: [
        [0, 1],
        [1, 3],
        [0, 2],
        [2, 3],
      ],
      succProb: [0.8, 0.6, 0.9, 0.4],
      start: 0,
      end: 3,
    },
    {
      n: 4,
      edges: [
        [0, 1],
        [2, 3],
      ],
      succProb: [0.5, 0.7],
      start: 0,
      end: 3,
    },
    {
      n: 3,
      edges: [
        [0, 1],
        [1, 2],
        [0, 2],
      ],
      succProb: [0.9, 0.9, 0.8],
      start: 0,
      end: 2,
    },
  ],
  "cheapest-flights": [
    {
      n: 4,
      flights: [
        [0, 1, 50],
        [1, 2, 40],
        [2, 3, 30],
        [0, 3, 200],
      ],
      src: 0,
      dst: 3,
      k: 2,
    },
    {
      n: 4,
      flights: [
        [0, 1, 50],
        [1, 2, 40],
        [2, 3, 30],
        [0, 3, 200],
      ],
      src: 0,
      dst: 3,
      k: 1,
    },
    { n: 3, flights: [[0, 1, 70]], src: 0, dst: 2, k: 2 },
  ],
  "swim-water": [
    {
      grid: [
        [0, 6, 2],
        [1, 5, 3],
        [7, 4, 8],
      ],
    },
    {
      grid: [
        [3, 2],
        [0, 1],
      ],
    },
    {
      grid: [
        [0, 8, 7],
        [1, 2, 6],
        [5, 3, 4],
      ],
    },
  ],
  "kth-largest": [
    { nums: [8, 2, 7, 4, 9, 1], k: 3 },
    { nums: [5, 5, 5, 2, 1], k: 2 },
    { nums: [-8, -2, -7, -4], k: 4 },
  ],
  "top-k-frequent": [
    { nums: [4, 4, 4, 7, 7, 8, 9], k: 2 },
    { nums: [2, 2, 5, 5, 8, 8], k: 2 },
    { nums: [-1, -1, -1, 0, 0, 4], k: 1 },
  ],
  "task-scheduler": [
    { tasks: ["A", "A", "A", "A", "B", "B", "C"], n: 2 },
    { tasks: ["X", "X", "Y", "Y", "Z"], n: 0 },
    { tasks: ["A", "A", "B", "C", "D"], n: 3 },
  ],
  "median-stream": [
    { nums: [8, 2, 7, 4, 9] },
    { nums: [-5, -9, 0, 6] },
    { nums: [4, 4, 4, 4, 5, 6] },
  ],
  subsets: [{ nums: [3, 7, 9] }, { nums: [-2, 0, 4] }, { nums: [5, 6, 8, 10] }],
  "combination-sum": [
    { candidates: [3, 4, 8], target: 12 },
    { candidates: [4, 6], target: 11 },
    { candidates: [2, 5, 9], target: 10 },
  ],
  "phone-letters": [{ digits: "46" }, { digits: "78" }, { digits: "292" }],
  "n-queens": [{ n: 5 }, { n: 6 }, { n: 7 }],
  "climbing-stairs": [{ n: 8 }, { n: 11 }, { n: 16 }],
  "house-robber": [
    { nums: [8, 2, 4, 9, 3, 7] },
    { nums: [5, 5, 5, 5, 5] },
    { nums: [1, 9, 1, 1, 9, 1] },
  ],
  "palindromic-substrings": [{ s: "abacaba" }, { s: "abbac" }, { s: "aabaa" }],
  "decode-ways": [{ s: "12120" }, { s: "301" }, { s: "11106" }],
  "unique-paths": [
    { m: 4, n: 5 },
    { m: 2, n: 9 },
    { m: 6, n: 6 },
  ],
  "longest-common-subsequence": [
    { text1: "axbycz", text2: "abc" },
    { text1: "banana", text2: "ananas" },
    { text1: "aabbaa", text2: "abab" },
  ],
  "edit-distance": [
    { word1: "trace", word2: "track" },
    { word1: "traces", word2: "tracks" },
    { word1: "abcdef", word2: "azced" },
  ],
  "burst-balloons-dp": [
    { nums: [2, 4, 3] },
    { nums: [1, 5, 1, 5] },
    { nums: [0, 3, 0, 7] },
  ],
  "coin-change": [
    { coins: [2, 3, 7], amount: 17 },
    { coins: [4, 6], amount: 13 },
    { coins: [1, 7, 10], amount: 14 },
  ],
  "target-sum": [
    { nums: [1, 2, 3, 4], target: 2 },
    { nums: [0, 0, 1, 2], target: 3 },
    { nums: [2, 2, 2, 2], target: 0 },
  ],
  "stock-cooldown": [
    { prices: [2, 5, 1, 4, 7] },
    { prices: [7, 6, 5, 4, 3] },
    { prices: [1, 4, 2, 7, 1, 8] },
  ],
  "regex-matching": [
    { s: "abbbc", p: "ab*c" },
    { s: "mississippi", p: "mis*is*p*." },
    { s: "", p: "b*c*d*" },
  ],
  "jump-game": [
    { nums: [3, 0, 0, 2, 0, 1] },
    { nums: [1, 2, 0, 0, 4] },
    { nums: [2, 0, 3, 0, 0, 1] },
  ],
  "jump-game-ii": [
    { nums: [3, 0, 0, 2, 0, 1] },
    { nums: [1, 2, 0, 0, 4] },
    { nums: [2, 0, 3, 0, 0, 1] },
  ],
  "gas-station": [
    { gas: [3, 1, 5, 2], cost: [2, 3, 2, 3] },
    { gas: [1, 1, 1, 1], cost: [2, 2, 2, 2] },
    { gas: [4, 1, 2, 5], cost: [3, 2, 4, 1] },
  ],
  candy: [
    { ratings: [2, 4, 3, 2, 1] },
    { ratings: [1, 3, 3, 2, 1] },
    { ratings: [6, 5, 4, 3, 2, 1] },
  ],
  "single-number": [
    { nums: [7, 3, 7, 4, 3] },
    { nums: [-5, 2, 2, 9, 9] },
    { nums: [0, 6, 0, 8, 8] },
  ],
  "counting-bits": [{ n: 13 }, { n: 19 }, { n: 31 }],
  "reverse-bits": [{ n: 13 }, { n: 2147483651 }, { n: 305419896 }],
  "sum-two-integers": [
    { a: -17, b: 9 },
    { a: 2147483647, b: 1 },
    { a: -8, b: -13 },
  ],
  strstr: [
    { haystack: "abababac", needle: "abac" },
    { haystack: "abracadabra", needle: "cad" },
    { haystack: "zzabczz", needle: "abcd" },
  ],
  "repeated-dna": [
    { s: "TGCATGCATGTGCATGCATG" },
    { s: "CCCCCCCCCCCCC" },
    { s: "ACGTACGTACGTACGTACGTAC" },
  ],
  "happy-prefix": [
    { s: "abcababcab" },
    { s: "aaaaabaaaaa" },
    { s: "abcdabce" },
  ],
  "shortest-palindrome": [{ s: "abbacd" }, { s: "racecarxyz" }, { s: "abcab" }],
};

export const levels = [
  {
    id: "guided",
    label: "01 · Predict",
    description: "Reason through a fresh input before running code.",
  },
  {
    id: "independent",
    label: "02 · Solve",
    description: "Write your solution and check it against eight cases.",
  },
  {
    id: "challenge",
    label: "03 · Challenge",
    description: "Solve without hints, then explain why it works.",
  },
] as const;
export type PracticeLevel = (typeof levels)[number]["id"];
export function practiceCases(p: Problem) {
  return (bank[p.id] ?? []).map((input, i) => ({
    id: `${p.id}:${i}`,
    label: ["Apply the idea", "Change the conditions", "Test your reasoning"][
      i
    ],
    input,
  }));
}
export function starterCode(p: Problem, language: string) {
  const fields = Object.keys(p.input).join(", ");
  if (language === "python")
    return `# Input fields: ${fields}\n# ${p.goal}\ndef solve(data):\n    # Write your solution here.\n    return None\n`;
  if (language === "cpp")
    return `#include "trace.hpp"\n// Input fields: ${fields}\n// ${p.goal}\njson solve(json data) {\n    // Write your solution here.\n    return nullptr;\n}\n`;
  return `// Input fields: ${fields}\n// ${p.goal}\nfunction solve(data) {\n    // Write your solution here.\n    return null;\n}\n`;
}
