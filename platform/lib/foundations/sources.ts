import { lessonCode, type Lesson } from "../lessons";
import type { Language } from "../curriculum/playground";
export const foundationLanguages: {
  id: Language;
  label: string;
  extension: string;
}[] = [
  { id: "python", label: "Python 3", extension: "py" },
  { id: "cpp", label: "C++17", extension: "cpp" },
  { id: "java", label: "Java", extension: "java" },
  { id: "javascript", label: "JavaScript", extension: "js" },
];
export function isFoundationLanguage(v: unknown): v is Language {
  return foundationLanguages.some((l) => l.id === v);
}
const jsBodies: Record<string, string> = {
  "binary-search": `let left = 0, right = nums.length - 1, mid = -1, result = -1;
const snapshot = () => trace({nums, target, left, right, mid, result});
snapshot();
while (left <= right) {
    mid = Math.floor((left + right) / 2);
    snapshot();
    if (nums[mid] === target) { result = mid; snapshot(); break; }
    if (nums[mid] < target) left = mid + 1;
    else right = mid - 1;
    snapshot();
}
return result;`,
  "two-sum": `let left = 0, right = nums.length - 1, total = 0, result = null;
const snapshot = () => trace({nums, target, left, right, total, result});
snapshot();
while (left < right) {
    total = nums[left] + nums[right];
    snapshot();
    if (total === target) { result = [left, right]; snapshot(); break; }
    if (total < target) left += 1;
    else right -= 1;
    snapshot();
}
return result;`,
  "sliding-window": `let total = 0, best = 0, left = 0, right = -1, i = -1;
const snapshot = () => trace({nums, k, total, best, left, right, i});
for (i = 0; i < k; i++) { total += nums[i]; snapshot(); }
best = total;
snapshot();
for (right = k; right < nums.length; right++) {
    total += nums[right]; snapshot();
    total -= nums[left]; snapshot();
    left += 1;
    best = Math.max(best, total);
    snapshot();
}
trace({nums, k, total, best, left, right, result: best});
return best;`,
  "bubble-sort": `let end = nums.length - 1, j = -1, temp = 0;
const snapshot = () => trace({nums, end, j, temp});
snapshot();
for (; end > 0; end--) {
    for (j = 0; j < end; j++) {
        snapshot();
        if (nums[j] > nums[j + 1]) {
            temp = nums[j]; snapshot();
            nums[j] = nums[j + 1]; snapshot();
            nums[j + 1] = temp; snapshot();
        }
    }
    snapshot();
}
trace({nums, end, j, result: nums});
return nums;`,
  "insertion-sort": `let i = -1, j = -1, key = 0;
const snapshot = () => trace({nums, i, j, key});
snapshot();
for (i = 1; i < nums.length; i++) {
    key = nums[i]; j = i - 1; snapshot();
    while (j >= 0 && nums[j] > key) {
        nums[j + 1] = nums[j]; snapshot();
        j -= 1; snapshot();
    }
    nums[j + 1] = key; snapshot();
}
trace({nums, i, j, key, result: nums});
return nums;`,
  "prefix-sum": `const prefix = Array(nums.length + 1).fill(0);
let i = -1;
trace({nums, prefix, i});
for (i = 0; i < nums.length; i++) {
    prefix[i + 1] = prefix[i] + nums[i];
    trace({nums, prefix, i});
}
trace({nums, prefix, i, result: prefix});
return prefix;`,
};
const cppBodies: Record<string, string> = {
  "binary-search": `int left = 0, right = int(nums.size()) - 1, mid = -1, result = -1;
auto snapshot = [&]() { TRACE({{"nums", nums}, {"target", target}, {"left", left}, {"right", right}, {"mid", mid}, {"result", result}}); };
snapshot();
while (left <= right) {
    mid = left + (right - left) / 2;
    snapshot();
    if (nums[mid] == target) { result = mid; snapshot(); break; }
    if (nums[mid] < target) left = mid + 1;
    else right = mid - 1;
    snapshot();
}
return result;`,
  "two-sum": `int left = 0, right = int(nums.size()) - 1, total = 0;
json result = nullptr;
auto snapshot = [&]() { TRACE({{"nums", nums}, {"target", target}, {"left", left}, {"right", right}, {"total", total}, {"result", result}}); };
snapshot();
while (left < right) {
    total = nums[left] + nums[right]; snapshot();
    if (total == target) { result = {left, right}; snapshot(); break; }
    if (total < target) left++;
    else right--;
    snapshot();
}
return result;`,
  "sliding-window": `int total = 0, best = 0, left = 0, right = -1, i = -1;
auto snapshot = [&]() { TRACE({{"nums", nums}, {"k", k}, {"total", total}, {"best", best}, {"left", left}, {"right", right}, {"i", i}}); };
for (i = 0; i < k; i++) { total += nums[i]; snapshot(); }
best = total; snapshot();
for (right = k; right < int(nums.size()); right++) {
    total += nums[right]; snapshot();
    total -= nums[left]; snapshot();
    left++; best = max(best, total); snapshot();
}
TRACE({{"nums", nums}, {"k", k}, {"total", total}, {"best", best}, {"left", left}, {"right", right}, {"result", best}});
return best;`,
  "bubble-sort": `int end = int(nums.size()) - 1, j = -1, temp = 0;
auto snapshot = [&]() { TRACE({{"nums", nums}, {"end", end}, {"j", j}, {"temp", temp}}); };
snapshot();
for (; end > 0; end--) {
    for (j = 0; j < end; j++) {
        snapshot();
        if (nums[j] > nums[j + 1]) {
            temp = nums[j]; snapshot();
            nums[j] = nums[j + 1]; snapshot();
            nums[j + 1] = temp; snapshot();
        }
    }
    snapshot();
}
TRACE({{"nums", nums}, {"end", end}, {"j", j}, {"result", nums}});
return nums;`,
  "insertion-sort": `int i = -1, j = -1, key = 0;
auto snapshot = [&]() { TRACE({{"nums", nums}, {"i", i}, {"j", j}, {"key", key}}); };
snapshot();
for (i = 1; i < int(nums.size()); i++) {
    key = nums[i]; j = i - 1; snapshot();
    while (j >= 0 && nums[j] > key) {
        nums[j + 1] = nums[j]; snapshot();
        j--; snapshot();
    }
    nums[j + 1] = key; snapshot();
}
TRACE({{"nums", nums}, {"i", i}, {"j", j}, {"key", key}, {"result", nums}});
return nums;`,
  "prefix-sum": `vector<int> prefix(nums.size() + 1, 0);
TRACE({{"nums", nums}, {"prefix", prefix}});
for (int i = 0; i < int(nums.size()); i++) {
    prefix[i + 1] = prefix[i] + nums[i];
    TRACE({{"nums", nums}, {"prefix", prefix}, {"i", i}});
}
TRACE({{"nums", nums}, {"prefix", prefix}, {"result", prefix}});
return prefix;`,
};
// Each checkpoint captures the real Java locals immediately after the shown operation.
const javaBodies: Record<string, string> = {
  "binary-search": `int left = 0, right = nums.length - 1, mid = -1, result = -1;
trace("nums", nums, "target", target, "left", left, "right", right, "mid", mid, "result", result);
while (left <= right) {
    mid = left + (right - left) / 2;
    trace("nums", nums, "target", target, "left", left, "right", right, "mid", mid, "result", result);
    if (nums[mid] == target) {
        result = mid;
        trace("nums", nums, "target", target, "left", left, "right", right, "mid", mid, "result", result);
        break;
    }
    if (nums[mid] < target) left = mid + 1;
    else right = mid - 1;
    trace("nums", nums, "target", target, "left", left, "right", right, "mid", mid, "result", result);
}
return result;`,
  "two-sum": `int left = 0, right = nums.length - 1, total = 0;
Object result = null;
while (left < right) {
    total = nums[left] + nums[right];
    trace("nums", nums, "target", target, "left", left, "right", right, "total", total, "result", result);
    if (total == target) {
        result = new int[]{left, right};
        trace("nums", nums, "target", target, "left", left, "right", right, "total", total, "result", result);
        break;
    }
    if (total < target) left++;
    else right--;
    trace("nums", nums, "target", target, "left", left, "right", right, "total", total, "result", result);
}
return result;`,
  "sliding-window": `int total = 0, best = 0, left = 0, right = -1;
for (int i = 0; i < k; i++) {
    total += nums[i];
    trace("nums", nums, "k", k, "i", i, "total", total, "left", left);
}
best = total;
trace("nums", nums, "k", k, "total", total, "best", best, "left", left);
for (right = k; right < nums.length; right++) {
    total += nums[right];
    trace("nums", nums, "k", k, "total", total, "best", best, "left", left, "right", right);
    total -= nums[left];
    trace("nums", nums, "k", k, "total", total, "best", best, "left", left, "right", right);
    left++; best = Math.max(best, total);
    trace("nums", nums, "k", k, "total", total, "best", best, "left", left, "right", right);
}
trace("nums", nums, "k", k, "total", total, "best", best, "left", left, "right", right, "result", best);
return best;`,
  "bubble-sort": `int end = nums.length - 1, j = -1, temp = 0;
for (; end > 0; end--) {
    for (j = 0; j < end; j++) {
        trace("nums", nums, "end", end, "j", j, "temp", temp);
        if (nums[j] > nums[j + 1]) {
            temp = nums[j];
            trace("nums", nums, "end", end, "j", j, "temp", temp);
            nums[j] = nums[j + 1];
            trace("nums", nums, "end", end, "j", j, "temp", temp);
            nums[j + 1] = temp;
            trace("nums", nums, "end", end, "j", j, "temp", temp);
        }
    }
}
trace("nums", nums, "end", end, "j", j, "result", nums);
return nums;`,
  "insertion-sort": `int i = -1, j = -1, key = 0;
for (i = 1; i < nums.length; i++) {
    key = nums[i]; j = i - 1;
    trace("nums", nums, "i", i, "j", j, "key", key);
    while (j >= 0 && nums[j] > key) {
        nums[j + 1] = nums[j];
        trace("nums", nums, "i", i, "j", j, "key", key);
        j--;
        trace("nums", nums, "i", i, "j", j, "key", key);
    }
    nums[j + 1] = key;
    trace("nums", nums, "i", i, "j", j, "key", key);
}
trace("nums", nums, "i", i, "j", j, "key", key, "result", nums);
return nums;`,
  "prefix-sum": `int[] prefix = new int[nums.length + 1];
trace("nums", nums, "prefix", prefix);
for (int i = 0; i < nums.length; i++) {
    prefix[i + 1] = prefix[i] + nums[i];
    trace("nums", nums, "prefix", prefix, "i", i);
}
trace("nums", nums, "prefix", prefix, "result", prefix);
return prefix;`,
};
export function foundationSource(
  lesson: Lesson,
  n: number,
  language: Language,
): string {
  if (language === "python") return lessonCode(lesson, n);
  const parameter =
    lesson.parameter === "none"
      ? ""
      : language === "javascript"
        ? `const ${lesson.parameter} = data.${lesson.parameter};`
        : language === "cpp"
          ? `int ${lesson.parameter} = data["${lesson.parameter}"];`
          : `int ${lesson.parameter} = num(data, "${lesson.parameter}");`;
  if (language === "javascript")
    return `// Trace supplies trace(state); indices start at zero.\nfunction solve(data) {\n    const nums = [...data.nums];\n    ${parameter}\n${jsBodies[
      lesson.id
    ]
      .split("\n")
      .map((s) => "    " + s)
      .join("\n")}\n}\n`;
  if (language === "cpp")
    return `#include "trace.hpp"
// Trace supplies json, TRACE(state), and the standard library.\njson solve(json data) {\n    vector<int> nums = data["nums"];\n    ${parameter}\n${cppBodies[
      lesson.id
    ]
      .split("\n")
      .map((s) => "    " + s)
      .join("\n")}\n}\n`;
  return `import java.util.*;\n\npublic class Solution extends Trace {\n    public Object solve(Map<String, Object> data) {\n        int[] nums = ints(data, "nums");\n        ${parameter}\n${javaBodies[
    lesson.id
  ]
    .split("\n")
    .map((s) => "        " + s)
    .join("\n")}\n    }\n}\n`;
}
