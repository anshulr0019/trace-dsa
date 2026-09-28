export type Stage = "Concept" | "Direct" | "Disguised" | "Edge-case trap";
export type Scene = "array" | "string" | "linked" | "stack" | "interval" | "tree" | "trie" | "grid" | "graph" | "heap" | "backtrack" | "dp" | "bits";
export interface Problem {
  id: string; title: string; group: number; tier: number; stage: Stage; scene: Scene;
  input: Record<string, unknown>; expected: unknown; goal: string; caveat: string;
  existing?: string;
}
export const tiers = ["Linear data structures", "Trees, tries & searching", "Graphs & heaps", "Optimization & advanced logic"];
export const patterns = [
  "Sliding Window", "Two Pointers (Collision)", "Fast & Slow Pointers", "Monotonic Stack", "Stack & String Parsing", "Merge Intervals", "Linked List Reversal",
  "Binary Search: Search Spaces", "Binary Search: Rotated Arrays", "Tree BFS", "Tree DFS", "Trie", "Cyclic Sort",
  "Matrix Traversal", "Topological Sort", "Disjoint Set", "Shortest Path", "Priority Queue / Top K",
  "Backtracking", "1D Dynamic Programming", "2D Dynamic Programming", "Advanced DP", "Greedy Decisions", "Bit Manipulation", "String Pattern Matching",
];
const stages: Stage[] = ["Concept", "Direct", "Disguised", "Edge-case trap"];
type Entry = [string, string, Scene, Record<string, unknown>, unknown, string, string?];
const entries: Entry[][] = [
  [
    ["maximum-average-subarray", "Maximum Average Subarray I", "array", {nums:[1,12,-5,-6,50,3],k:4},12.75,"Find the largest average of any contiguous window of exactly k values.","Initialize from a real window; all values may be negative."],
    ["longest-unique-substring", "Longest Substring Without Repeating Characters", "string", {s:"abcabcbb"},3,"Find the length of the longest substring with no repeated characters."],
    ["character-replacement", "Longest Repeating Character Replacement", "string", {s:"AABABBA",k:1},4,"Find the longest substring that can become one repeated character with at most k replacements."],
    ["minimum-window", "Minimum Window Substring", "string", {s:"ADOBECODEBANC",t:"ABC"},"BANC","Find the shortest substring containing every required character, including multiplicities.","Repeated required characters count separately; an empty target yields an empty window."],
  ],
  [
    ["two-sum-sorted", "Two Sum II (Sorted Array)", "array", {nums:[2,7,11,15],target:9},[1,2],"Find two different indices in a sorted array whose values add to the target. Return one-based indices."],
    ["three-sum", "3Sum", "array", {nums:[-1,0,1,2,-1,-4]},[[-1,-1,2],[-1,0,1]],"Return every distinct triplet whose values sum to zero.","Skip duplicate anchors and pointer values after finding a triplet."],
    ["container-water", "Container With Most Water", "array", {height:[1,8,6,2,5,4,8,3,7]},49,"Choose two vertical lines that contain the greatest area of water."],
    ["trapping-rain", "Trapping Rain Water", "array", {height:[0,1,0,2,1,0,1,3,2,1,2,1]},6,"Compute water trapped above all bars.","Water at a position depends on the lower of the maxima on both sides."],
  ],
  [
    ["middle-list", "Middle of the Linked List", "linked", {values:[1,2,3,4,5],pos:-1},[3,4,5],"Return the suffix starting at the middle node; choose the second middle for an even length."],
    ["linked-cycle", "Linked List Cycle", "linked", {values:[3,2,0,-4],pos:1},true,"Determine whether the linked list contains a cycle. pos connects the tail to a zero-based node, or -1."],
    ["duplicate-number", "Find the Duplicate Number", "linked", {nums:[1,3,4,2,2]},2,"Find the repeated number by interpreting nums[index] as a next pointer.","The n+1 values must lie in 1…n."],
    ["cycle-entrance", "Linked List Cycle II", "linked", {values:[3,2,0,-4],pos:1},1,"Return the zero-based entrance index of a linked-list cycle, or -1.","After the meeting, reset one pointer to the head and advance both one step."],
  ],
  [
    ["next-greater", "Next Greater Element I", "stack", {nums1:[4,1,2],nums2:[1,3,4,2]},[-1,3,-1],"For each nums1 value, find the first greater value to its right in nums2."],
    ["daily-temperatures", "Daily Temperatures", "stack", {temperatures:[73,74,75,71,69,72,76,73]},[1,1,4,2,1,1,0,0],"Return how many days each temperature waits for a warmer day."],
    ["car-fleet", "Car Fleet", "stack", {target:12,position:[10,8,0,5,3],speed:[2,4,1,1,3]},3,"Count fleets reaching a target; cars cannot pass each other."],
    ["largest-rectangle", "Largest Rectangle in Histogram", "stack", {heights:[2,1,5,6,2,3]},10,"Find the largest rectangle under contiguous histogram bars.","A final zero-height sentinel flushes increasing bars left on the stack."],
  ],
  [
    ["valid-parentheses", "Valid Parentheses", "stack", {s:"([]){}"},true,"Check whether brackets are correctly matched and nested."],
    ["reverse-polish", "Evaluate Reverse Polish Notation", "stack", {tokens:["2","1","+","3","*"]},9,"Evaluate postfix arithmetic. Division truncates toward zero."],
    ["min-stack", "Min Stack", "stack", {operations:[["push",-2],["push",0],["push",-3],["getMin"],["pop"],["top"],["getMin"]]},[null,null,null,-3,null,0,-2],"Support push, pop, top, and getMin, each in constant time."],
    ["calculator-ii", "Basic Calculator II", "stack", {s:" 3+5 / 2 "},5,"Evaluate nonnegative integers and +, -, *, / using operator precedence.","Division truncates toward zero, including negative intermediate terms."],
  ],
  [
    ["merge-intervals", "Merge Intervals", "interval", {intervals:[[1,3],[2,6],[8,10],[15,18]]},[[1,6],[8,10],[15,18]],"Merge overlapping closed intervals after ordering by start."],
    ["insert-interval", "Insert Interval", "interval", {intervals:[[1,3],[6,9]],newInterval:[2,5]},[[1,5],[6,9]],"Insert a closed interval into an ordered, disjoint interval list and merge overlaps."],
    ["meeting-rooms", "Meeting Rooms II", "interval", {intervals:[[0,30],[5,10],[15,20]]},2,"Find the minimum simultaneous rooms needed for half-open meeting intervals.","A room ending at time t can be reused by a meeting starting at t."],
    ["burst-balloons-arrows", "Minimum Number of Arrows to Burst Balloons", "interval", {points:[[10,16],[2,8],[1,6],[7,12]]},2,"Find the minimum points needed to intersect every closed balloon interval."],
  ],
  [
    ["reverse-list", "Reverse Linked List", "linked", {values:[1,2,3,4,5]},[5,4,3,2,1],"Reverse the next links of a singly linked list."],
    ["reorder-list", "Reorder List", "linked", {values:[1,2,3,4,5]},[1,5,2,4,3],"Reorder nodes first, last, second, second-last, and so on."],
    ["copy-random-list", "Copy List with Random Pointer", "linked", {values:[7,13,11,10,1],random:[null,0,4,2,0]},[[7,null],[13,0],[11,4],[10,2],[1,0]],"Deep-copy nodes and random links; random entries are node indices or null.","This is a pointer-copying problem; interleaving copies is an O(1)-auxiliary-space alternative to a map."],
    ["reverse-k-group", "Reverse Nodes in k-Group", "linked", {values:[1,2,3,4,5],k:2},[2,1,4,3,5],"Reverse each complete group of k nodes; leave an incomplete suffix intact."],
  ],
  [
    ["binary-search-standard", "Standard Binary Search", "array", {nums:[-1,0,3,5,9,12],target:9},4,"Find a target index in ascending order, or return -1."],
    ["search-matrix", "Search a 2D Matrix", "grid", {matrix:[[1,3,5,7],[10,11,16,20],[23,30,34,60]],target:3},true,"Binary-search a matrix whose rows form one increasing sequence."],
    ["koko-bananas", "Koko Eating Bananas", "array", {piles:[3,6,7,11],h:8},4,"Find the minimum integer eating speed that finishes all piles within h hours."],
    ["median-sorted-arrays", "Median of Two Sorted Arrays", "array", {nums1:[1,3],nums2:[2]},2,"Partition two sorted arrays so all left values are at most all right values.","Binary-search the shorter array, using infinity at empty partition boundaries."],
  ],
  [
    ["minimum-rotated", "Find Minimum in Rotated Sorted Array", "array", {nums:[3,4,5,1,2]},1,"Find the minimum of a rotated ascending array with unique values."],
    ["search-rotated", "Search in Rotated Sorted Array", "array", {nums:[4,5,6,7,0,1,2],target:0},4,"Find the target index in a rotated ascending array with unique values."],
    ["search-rotated-duplicates", "Search in Rotated Sorted Array II", "array", {nums:[2,5,6,0,0,1,2],target:0},true,"Determine whether a target exists when rotated input can have duplicates.","Equal endpoints can hide the sorted side, forcing linear work in the worst case."],
    ["mountain-array", "Find in Mountain Array", "array", {nums:[1,2,3,4,5,3,1],target:3},2,"Find the first target index by searching both sides of a strict mountain.","The lesson uses a local array; the original problem restricts access through a MountainArray API."],
  ],
  [
    ["level-order", "Binary Tree Level Order Traversal", "tree", {tree:[3,9,20,null,null,15,7]},[[3],[9,20],[15,7]],"Visit tree nodes level by level using a queue. Input is compact level-order with null children."],
    ["right-side-view", "Binary Tree Right Side View", "tree", {tree:[1,2,3,null,5,null,4]},[1,3,4],"Return the last visible value at each depth."],
    ["next-right-pointers", "Populating Next Right Pointers in Each Node", "tree", {tree:[1,2,3,4,5,6,7]},[[1,null],[2,3],[3,null],[4,5],[5,6],[6,7],[7,null]],"Connect each node to its next neighbor on the same level; output value/neighbor pairs."],
    ["word-ladder", "Word Ladder", "graph", {beginWord:"hit",endWord:"cog",wordList:["hot","dot","dog","lot","log","cog"]},5,"Find the length of the shortest one-letter-at-a-time transformation sequence.","This is BFS on a graph of words; each move has equal cost."],
  ],
  [
    ["maximum-depth", "Maximum Depth of Binary Tree", "tree", {tree:[3,9,20,null,null,15,7]},3,"Compute one plus the larger child depth, with empty subtrees at depth zero."],
    ["lowest-common-ancestor", "Lowest Common Ancestor of a Binary Tree", "tree", {tree:[3,5,1,6,2,0,8,null,null,7,4],p:5,q:1},3,"Find the deepest ancestor containing both target nodes; this lesson uses unique values."],
    ["tree-diameter", "Diameter of Binary Tree", "tree", {tree:[1,2,3,4,5]},3,"Find the maximum number of edges on a path through any two nodes."],
    ["maximum-path-sum", "Binary Tree Maximum Path Sum", "tree", {tree:[-10,9,20,null,null,15,7]},42,"Find the largest sum of a nonempty path that may turn at one node.","Only one child gain can propagate upward; negative gains should be discarded."],
  ],
  [
    ["implement-trie", "Implement Trie (Prefix Tree)", "trie", {operations:[["insert","apple"],["search","apple"],["search","app"],["startsWith","app"],["insert","app"],["search","app"]]},[null,true,false,true,null,true],"Store shared prefixes; terminal markers distinguish words from prefixes."],
    ["word-dictionary", "Design Add and Search Words Data Structure", "trie", {operations:[["addWord","bad"],["addWord","dad"],["addWord","mad"],["search","pad"],["search","bad"],["search",".ad"],["search","b.."]]},[null,null,null,false,true,true,true],"Support word insertion and search where dot matches exactly one letter."],
    ["replace-words", "Replace Words", "trie", {dictionary:["cat","bat","rat"],sentence:"the cattle was rattled by the battery"},"the cat was rat by the bat","Replace words with their shortest dictionary roots."],
    ["word-search-ii", "Word Search II", "grid", {board:[["o","a","a","n"],["e","t","a","e"],["i","h","k","r"],["i","f","l","v"]],words:["oath","pea","eat","rain"]},["eat","oath"],"Use a trie to prune DFS paths while finding dictionary words in a board.","A cell may be used once per word path; restore it during backtracking."],
  ],
  [
    ["missing-number", "Missing Number", "array", {nums:[3,0,1]},2,"Place values in their matching indices to find the missing value from 0…n."],
    ["disappeared-numbers", "Find All Numbers Disappeared in an Array", "array", {nums:[4,3,2,7,8,2,3,1]},[5,6],"Place values from 1…n into index value−1 and find unfilled positions."],
    ["set-mismatch", "Set Mismatch", "array", {nums:[1,2,2,4]},[2,3],"Find the repeated and missing numbers in an almost-permutation of 1…n."],
    ["first-missing-positive", "First Missing Positive", "array", {nums:[3,4,-1,1]},2,"Find the smallest absent positive integer using the array as index storage.","Ignore nonpositive values and values greater than n; avoid swapping equal values forever."],
  ],
  [
    ["number-islands", "Number of Islands", "grid", {grid:[[1,1,0],[1,0,0],[0,0,1]]},2,"Count four-directionally connected groups of land cells."],
    ["max-island-area", "Max Area of Island", "grid", {grid:[[0,1,0],[1,1,0],[0,0,1]]},3,"Find the largest four-directionally connected land component."],
    ["rotting-oranges", "Rotting Oranges", "grid", {grid:[[2,1,1],[1,1,0],[0,1,1]]},4,"Spread rot from all rotten oranges at once and measure time to reach every fresh orange."],
    ["pacific-atlantic", "Pacific Atlantic Water Flow", "grid", {heights:[[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]},[[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]],"Find cells that can drain to both oceans by searching uphill from each boundary."],
  ],
  [
    ["course-schedule", "Course Schedule", "graph", {numCourses:2,prerequisites:[[1,0]]},true,"Determine whether all directed prerequisites can be satisfied."],
    ["course-order", "Course Schedule II", "graph", {numCourses:4,prerequisites:[[1,0],[2,0],[3,1],[3,2]]},[0,1,2,3],"Return a valid topological ordering, or an empty list for a cycle."],
    ["build-matrix", "Build a Matrix With Conditions", "grid", {k:3,rowConditions:[[1,2],[3,2]],colConditions:[[2,1],[3,2]]},[[0,0,1],[3,0,0],[0,2,0]],"Compute independent topological row and column orders, then place values 1…k."],
    ["alien-dictionary", "Alien Dictionary", "graph", {words:["wrt","wrf","er","ett","rftt"]},"wertf","Infer letter order from the first differing letters of neighboring sorted words.","A longer word preceding its exact prefix makes the ordering invalid."],
  ],
  [
    ["connected-components", "Number of Connected Components", "graph", {n:5,edges:[[0,1],[1,2],[3,4]]},2,"Count components in an undirected graph using union-find."],
    ["redundant-connection", "Redundant Connection", "graph", {edges:[[1,2],[1,3],[2,3]]},[2,3],"Return the edge that would join vertices already in the same component."],
    ["accounts-merge", "Accounts Merge", "graph", {accounts:[["John","a@mail.com","b@mail.com"],["John","b@mail.com","c@mail.com"],["Mary","m@mail.com"]]},[["John","a@mail.com","b@mail.com","c@mail.com"],["Mary","m@mail.com"]],"Join accounts sharing an email; matching names alone do not imply identity."],
    ["islands-ii", "Number of Islands II", "grid", {m:3,n:3,positions:[[0,0],[0,1],[1,2],[2,1],[1,1]]},[1,1,2,3,1],"Report island count after each land insertion.","Repeated insertion into existing land must not create an extra component."],
  ],
  [
    ["network-delay", "Network Delay Time", "graph", {times:[[2,1,1],[2,3,1],[3,4,1]],n:4,k:2},2,"Find the time for a signal to reach every vertex through nonnegative weighted edges."],
    ["maximum-probability", "Path with Maximum Probability", "graph", {n:3,edges:[[0,1],[1,2],[0,2]],succProb:[0.5,0.5,0.2],start:0,end:2},0.25,"Maximize the product of edge success probabilities on an undirected path."],
    ["cheapest-flights", "Cheapest Flights Within K Stops", "graph", {n:4,flights:[[0,1,100],[1,2,100],[2,0,100],[1,3,600],[2,3,200]],src:0,dst:3,k:1},700,"Find the cheapest route using at most k+1 edges.","Each Bellman–Ford round must read the previous round, preventing too many stops."],
    ["swim-water", "Swim in Rising Water", "grid", {grid:[[0,2],[1,3]]},3,"Minimize the maximum elevation encountered on a path to the opposite corner."],
  ],
  [
    ["kth-largest", "Kth Largest Element in an Array", "heap", {nums:[3,2,1,5,6,4],k:2},5,"Maintain a min-heap of the k largest values seen."],
    ["top-k-frequent", "Top K Frequent Elements", "heap", {nums:[1,1,1,2,2,3],k:2},[1,2],"Count values and select the k highest frequencies."],
    ["task-scheduler", "Task Scheduler", "heap", {tasks:["A","A","A","B","B","B"],n:2},8,"Schedule tasks with at least n intervals between identical task types."],
    ["median-stream", "Find Median from Data Stream", "heap", {nums:[1,2,3]},[1,1.5,2],"Maintain balanced lower and upper heaps; report the median after each insertion."],
  ],
  [
    ["subsets", "Subsets", "backtrack", {nums:[1,2]},[[],[1],[1,2],[2]],"Enumerate all subsets by deciding which next element to include."],
    ["combination-sum", "Combination Sum", "backtrack", {candidates:[2,3,6,7],target:7},[[2,2,3],[7]],"Find unique combinations of positive candidates that sum to the target; reuse is allowed."],
    ["phone-letters", "Letter Combinations of a Phone Number", "backtrack", {digits:"23"},["ad","ae","af","bd","be","bf","cd","ce","cf"],"Choose one keypad letter per digit and enumerate complete paths."],
    ["n-queens", "N-Queens", "backtrack", {n:4},[[".Q..","...Q","Q...","..Q."],["..Q.","Q...","...Q",".Q.."]],"Place one queen per row without sharing columns or diagonals."],
  ],
  [
    ["climbing-stairs", "Climbing Stairs", "dp", {n:5},8,"Count ways to climb n steps taking one or two at a time."],
    ["house-robber", "House Robber", "dp", {nums:[2,7,9,3,1]},12,"Maximize the sum of nonadjacent house values."],
    ["palindromic-substrings", "Palindromic Substrings", "dp", {s:"aaa"},6,"Count all palindromic substrings; each index range counts separately."],
    ["decode-ways", "Decode Ways", "dp", {s:"226"},3,"Count valid decodings with 1→A through 26→Z.","Zero cannot decode alone; only 10 and 20 use it as a second digit."],
  ],
  [
    ["unique-paths", "Unique Paths", "dp", {m:3,n:7},28,"Count grid paths using only right and down moves."],
    ["longest-common-subsequence", "Longest Common Subsequence", "dp", {text1:"abcde",text2:"ace"},3,"Find the longest subsequence shared by two strings without requiring contiguous positions."],
    ["edit-distance", "Edit Distance", "dp", {word1:"horse",word2:"ros"},3,"Minimize insertions, deletions, and replacements transforming one word into another."],
    ["burst-balloons-dp", "Burst Balloons", "dp", {nums:[3,1,5,8]},167,"Maximize coins by choosing the last balloon to burst inside each interval.","Fixed interval boundaries make the last-burst recurrence independent."],
  ],
  [
    ["coin-change", "Coin Change", "dp", {coins:[1,2,5],amount:11},3,"Find the fewest coins forming an amount, or -1 when impossible."],
    ["target-sum", "Target Sum", "dp", {nums:[1,1,1,1,1],target:3},5,"Count assignments of plus or minus signs reaching the target."],
    ["stock-cooldown", "Best Time to Buy and Sell Stock with Cooldown", "dp", {prices:[1,2,3,0,2]},3,"Maximize profit while waiting one day after selling before buying again."],
    ["regex-matching", "Regular Expression Matching", "dp", {s:"aab",p:"c*a*b"},true,"Match the entire string with dot and star, where star repeats its preceding element.","Zero repetitions and an empty input string need explicit base cases."],
  ],
  [
    ["jump-game", "Jump Game", "array", {nums:[2,3,1,1,4]},true,"Track the farthest reachable index to decide whether the last index is reachable."],
    ["jump-game-ii", "Jump Game II", "array", {nums:[2,3,1,1,4]},2,"Find the minimum jumps to the last index; this lesson returns -1 when unreachable."],
    ["gas-station", "Gas Station", "array", {gas:[1,2,3,4,5],cost:[3,4,5,1,2]},3,"Find a starting station permitting a complete circuit, or -1."],
    ["candy", "Candy", "array", {ratings:[1,0,2]},5,"Give everyone one candy and ensure higher-rated neighbors receive more."],
  ],
  [
    ["single-number", "Single Number", "bits", {nums:[4,1,2,1,2]},4,"Use XOR cancellation to find the value appearing once while others appear twice."],
    ["counting-bits", "Counting Bits", "bits", {n:5},[0,1,1,2,1,2],"Compute the number of set bits for all integers from zero through n."],
    ["reverse-bits", "Reverse Bits", "bits", {n:43261596},964176192,"Reverse all 32 bits of an unsigned integer."],
    ["sum-two-integers", "Sum of Two Integers", "bits", {a:1,b:2},3,"Compute a signed 32-bit sum using XOR and carry propagation.","Mask intermediate values to 32 bits so negative numbers terminate."],
  ],
  [
    ["strstr", "Implement strStr()", "string", {haystack:"sadbutsad",needle:"sad"},0,"Find the first substring occurrence using a KMP prefix table, or -1."],
    ["repeated-dna", "Repeated DNA Sequences", "string", {s:"AAAAACCCCCAAAAACCCCCCAAAAAGGGTTT"},["AAAAACCCCC","CCCCCAAAAA"],"Find repeated length-ten DNA substrings using a two-bit rolling encoding."],
    ["happy-prefix", "Longest Happy Prefix", "string", {s:"level"},"l","Find the longest proper prefix that is also a suffix using the KMP failure table."],
    ["shortest-palindrome", "Shortest Palindrome", "string", {s:"aacecaaa"},"aaacecaaa","Prepend the fewest characters to make the string a palindrome.","Use a unique separator between the original and reversed strings when building the prefix table."],
  ],
];
export const problems: Problem[] = entries.flatMap((items, group) => items.map((entry, index) => ({
  id: entry[0], title: entry[1], scene: entry[2], input: entry[3], expected: entry[4], goal: entry[5], caveat: entry[6] ?? "Try a boundary input, then inspect the state before and after each decision.",
  group: group + 1, tier: group < 7 ? 1 : group < 13 ? 2 : group < 18 ? 3 : 4, stage: stages[index],
  ...(entry[0] === "two-sum-sorted" ? {existing:"two-sum"} : entry[0] === "binary-search-standard" ? {existing:"binary-search"} : {}),
})));
export const problemById = Object.fromEntries(problems.map(p => [p.id, p]));
