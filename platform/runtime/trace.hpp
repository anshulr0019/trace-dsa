#pragma once
#include "json.hpp"
#include <iostream>
#include <sstream>
#include <vector>
#include <string>
#include <algorithm>
#include <queue>
#include <stack>
#include <map>
#include <set>
#include <unordered_map>
#include <unordered_set>
#include <numeric>
#include <climits>
#include <functional>
#include <fstream>
using namespace std;
using json = nlohmann::json;
inline json trace_frames = json::array();
inline bool trace_truncated = false;
inline int trace_steps = 0;
inline json trace_calls=json::array();
struct __trace_call{explicit __trace_call(const char* name){trace_calls.push_back({{"name",name},{"line",0}});}~__trace_call(){if(!trace_calls.empty())trace_calls.erase(trace_calls.size()-1);}};
inline void checkpoint(const json& vars, int line, const char* event="checkpoint", const char* function="solve", const json& stack=json::array()) {
    if (++trace_steps > 30000) throw runtime_error("Execution stopped after 30,000 steps; inspect the loop condition.");
    if (trace_frames.size() >= 1200) { trace_truncated = true; return; }
    trace_frames.push_back({{"line",line},{"event",event},{"function",function},{"stack",stack},{"vars",vars}});
    ofstream("frames.jsonl", ios::app) << trace_frames.back().dump() << '\n';
}
template<class T> void __trace_put(json& out,const char* name,const T& value){
    if constexpr(is_pointer_v<T> || is_function_v<T>) out[name]="<pointer or function: inspect with an explicit checkpoint>";
    else if constexpr(is_constructible_v<json,T>) {try{out[name]=value;}catch(...){out[name]="<value unavailable>";}}
    else out[name]="<custom type: add a serializable checkpoint>";
}
template<class F> void __trace_auto(int line,const char* function,F capture){json state=json::object();capture(state);if(!trace_calls.empty())trace_calls.back()["line"]=line;checkpoint(state,line,"line",function,trace_calls);}
#define TRACE(...) checkpoint(json(__VA_ARGS__), __LINE__)
