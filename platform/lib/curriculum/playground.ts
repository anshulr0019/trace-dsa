import type {Problem} from "./catalog";
import {cppSolutions} from "./cpp-solutions";
import {javascriptSolutions} from "./javascript-solutions";
import formattedSources from "./formatted-sources.json";
import {javaSolutions} from "./java-solutions";
export type Language="python"|"cpp"|"java"|"javascript";
const cpp:Record<string,string>={
...cppSolutions,
"maximum-average-subarray":`#include "trace.hpp"
json solve(json data) {
    vector<int> nums = data["nums"];
    int k = data["k"];
    if (k < 1 || k > nums.size()) throw runtime_error("k must be 1..nums.size()");
    double total = accumulate(nums.begin(), nums.begin()+k, 0.0);
    double best = total;
    for (int right = k; right < nums.size(); ++right) {
        int left = right - k + 1;
        total += nums[right] - nums[right-k];
        best = max(best, total);
        TRACE({{"nums",nums},{"left",left},{"right",right},{"total",total},{"best",best}});
    }
    return best / k;
}`,
"binary-search-standard":`#include "trace.hpp"
json solve(json data) {
    vector<int> nums = data["nums"];
    int target = data["target"], left = 0, right = int(nums.size()) - 1;
    while (left <= right) {
        int mid = left + (right-left)/2;
        TRACE({{"nums",nums},{"left",left},{"right",right},{"mid",mid}});
        if (nums[mid] == target) return mid;
        if (nums[mid] < target) left = mid+1;
        else right = mid-1;
    }
    return -1;
}`,
"two-sum-sorted":`#include "trace.hpp"
json solve(json data) {
    vector<int> nums = data["nums"];
    int target = data["target"], left = 0, right = int(nums.size()) - 1;
    while (left < right) {
        int total = nums[left] + nums[right];
        TRACE({{"nums",nums},{"left",left},{"right",right},{"total",total}});
        if (total == target) return json::array({left+1,right+1});
        if (total < target) ++left; else --right;
    }
    return json::array();
}`,
};
const js:Record<string,string>={
...javascriptSolutions,
"maximum-average-subarray":`function solve(data) {
    const {nums, k} = data;
    if (k < 1 || k > nums.length) throw Error("k must be 1..nums.length");
    let total = nums.slice(0, k).reduce((a, b) => a + b, 0);
    let best = total;
    for (let right = k; right < nums.length; right++) {
        const left = right - k + 1;
        total += nums[right] - nums[right-k];
        best = Math.max(best, total);
        trace({nums, left, right, total, best});
    }
    return best / k;
}`,
"binary-search-standard":`function solve(data) {
    const {nums, target} = data;
    let left = 0, right = nums.length - 1;
    while (left <= right) {
        const mid = Math.floor((left + right)/2);
        trace({nums, left, right, mid});
        if (nums[mid] === target) return mid;
        if (nums[mid] < target) left = mid+1;
        else right = mid-1;
    }
    return -1;
}`,
"two-sum-sorted":`function solve(data) {
    const {nums, target} = data;
    let left = 0, right = nums.length - 1;
    while (left < right) {
        const total = nums[left] + nums[right];
        trace({nums, left, right, total});
        if (total === target) return [left+1, right+1];
        if (total < target) left++; else right--;
    }
    return [];
}`,
};
export const rawSources={cpp,javascript:js};
const formatted=formattedSources as Record<"cpp"|"javascript",Record<string,string>>;
export function hasReference(id:string,language:Language){return language==="java"?!!javaSolutions[id]:language==="python"||!!(language==="cpp"?cpp:js)[id];}
export function playgroundSource(p:Problem,language:Language){
 if(language==="java")return javaSolutions[p.id]??legacyStarter(p,language);
 if(language!=="python"&&formatted[language][p.id])return formatted[language][p.id];
 if(language==="cpp")return cpp[p.id]??legacyStarter(p,language);
 return js[p.id]??legacyStarter(p,language);
}
export function restoreDraft(p:Problem,language:Language,draft:unknown,fallback:string){
 if(typeof draft!=="string")return fallback;
 return language!=="python"&&draft===legacyStarter(p,language)?fallback:draft;
}
export function legacyStarter(p:Problem,language:Language){
 if(language==="java")return `import java.util.*;

// ${p.title}
// Input keys: ${Object.keys(p.input).join(", ")}
public class Solution extends Trace {
    public Object solve(Map<String, Object> data) {
        trace("data", data);
        // Return your answer. Add trace("nums", nums, "i", i) to capture state.
        return null;
    }
}`;
 if(language==="cpp")return `#include "trace.hpp"
// ${p.title}
// Input keys: ${Object.keys(p.input).join(", ")}
// Write your solution in solve(). The runner supplies main().
json solve(json data) {
    TRACE({{"data",data}});
    // Example: vector<int> nums = data["nums"];
    // Add TRACE({{"nums",nums},{"i",i}}); at each step.
    throw runtime_error("Implement your solution, then Run.");
}`;
 return `// ${p.title}
// Input keys: ${Object.keys(p.input).join(", ")}
function solve(data) {
    trace({data}, 4);
    // Write your solution here. Return a JSON-compatible result.
    // Add trace({variableName}, lineNumber) to visualize state.
    throw Error("Implement your solution, then Run.");
}`;
}
