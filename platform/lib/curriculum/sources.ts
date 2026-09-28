import { pythonLinear } from "./python-linear";
import { pythonSearch } from "./python-search";
import { pythonGraph } from "./python-graph";
import { pythonAdvanced } from "./python-advanced";
export const pythonSources = {...pythonLinear, ...pythonSearch, ...pythonGraph, ...pythonAdvanced};
export const pythonPrelude = `from collections import Counter, defaultdict, deque
import heapq
from trace_support import tree, linked

`;
