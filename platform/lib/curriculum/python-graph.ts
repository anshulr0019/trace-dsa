export const pythonGraph: Record<string,string> = {
"number-islands": `def solve(data):
    grid = [row[:] for row in data["grid"]]
    rows, cols = len(grid), len(grid[0]) if grid else 0
    islands, visited = 0, set()
    for row in range(rows):
        for col in range(cols):
            if str(grid[row][col]) != "1" or (row, col) in visited: continue
            islands += 1
            stack = [(row, col)]
            visited.add((row, col))
            while stack:
                r, c = stack.pop()
                for dr, dc in [(1,0),(-1,0),(0,1),(0,-1)]:
                    nr, nc = r + dr, c + dc
                    if 0 <= nr < rows and 0 <= nc < cols and str(grid[nr][nc]) == "1" and (nr,nc) not in visited:
                        visited.add((nr,nc))
                        stack.append((nr,nc))
    return islands`,
"max-island-area": `def solve(data):
    grid = data["grid"]
    rows, cols = len(grid), len(grid[0]) if grid else 0
    best, visited = 0, set()
    for row in range(rows):
        for col in range(cols):
            if grid[row][col] != 1 or (row,col) in visited: continue
            area, stack = 0, [(row,col)]
            visited.add((row,col))
            while stack:
                r, c = stack.pop()
                area += 1
                for dr, dc in [(1,0),(-1,0),(0,1),(0,-1)]:
                    nr, nc = r+dr, c+dc
                    if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1 and (nr,nc) not in visited:
                        visited.add((nr,nc))
                        stack.append((nr,nc))
            best = max(best, area)
    return best`,
"rotting-oranges": `def solve(data):
    grid = [row[:] for row in data["grid"]]
    rows, cols = len(grid), len(grid[0]) if grid else 0
    queue, fresh = deque(), 0
    for row in range(rows):
        for col in range(cols):
            if grid[row][col] == 2: queue.append((row,col,0))
            elif grid[row][col] == 1: fresh += 1
    minutes = 0
    while queue:
        row, col, minutes = queue.popleft()
        for dr, dc in [(1,0),(-1,0),(0,1),(0,-1)]:
            r, c = row+dr, col+dc
            if 0 <= r < rows and 0 <= c < cols and grid[r][c] == 1:
                grid[r][c] = 2
                fresh -= 1
                queue.append((r,c,minutes+1))
    return minutes if fresh == 0 else -1`,
"pacific-atlantic": `def solve(data):
    grid = data["heights"]
    if not grid or not grid[0]: return []
    rows, cols = len(grid), len(grid[0])
    def flood(starts):
        visited, queue = set(starts), deque(starts)
        while queue:
            row, col = queue.popleft()
            for dr, dc in [(1,0),(-1,0),(0,1),(0,-1)]:
                r, c = row+dr, col+dc
                if 0 <= r < rows and 0 <= c < cols and (r,c) not in visited and grid[r][c] >= grid[row][col]:
                    visited.add((r,c))
                    queue.append((r,c))
        return visited
    pacific = flood([(0,c) for c in range(cols)] + [(r,0) for r in range(rows)])
    atlantic = flood([(rows-1,c) for c in range(cols)] + [(r,cols-1) for r in range(rows)])
    return [list(cell) for cell in sorted(pacific & atlantic)]`,
"course-schedule": `def solve(data):
    n = data["numCourses"]
    edges = [[b,a] for a,b in data["prerequisites"]]
    graph, indegree = [[] for _ in range(n)], [0]*n
    for a,b in edges:
        graph[a].append(b)
        indegree[b] += 1
    queue, order = deque(i for i in range(n) if not indegree[i]), []
    while queue:
        current = queue.popleft()
        order.append(current)
        for neighbor in graph[current]:
            indegree[neighbor] -= 1
            if indegree[neighbor] == 0: queue.append(neighbor)
    return len(order) == n`,
"course-order": `def solve(data):
    n = data["numCourses"]
    edges = [[b,a] for a,b in data["prerequisites"]]
    graph, indegree = [[] for _ in range(n)], [0]*n
    for a,b in edges:
        graph[a].append(b)
        indegree[b] += 1
    queue, order = deque(i for i in range(n) if not indegree[i]), []
    while queue:
        current = queue.popleft()
        order.append(current)
        for neighbor in graph[current]:
            indegree[neighbor] -= 1
            if indegree[neighbor] == 0: queue.append(neighbor)
    return order if len(order) == n else []`,
"build-matrix": `def solve(data):
    k = data["k"]
    def order(edges):
        graph, indegree = [[] for _ in range(k+1)], [0]*(k+1)
        for a,b in edges:
            graph[a].append(b)
            indegree[b] += 1
        queue, result = deque(i for i in range(1,k+1) if not indegree[i]), []
        while queue:
            current = queue.popleft()
            result.append(current)
            for neighbor in graph[current]:
                indegree[neighbor] -= 1
                if indegree[neighbor] == 0: queue.append(neighbor)
        return result if len(result) == k else []
    rows, cols = order(data["rowConditions"]), order(data["colConditions"])
    if not rows or not cols: return []
    position = {value:i for i,value in enumerate(cols)}
    grid = [[0]*k for _ in range(k)]
    for row, value in enumerate(rows):
        col = position[value]
        grid[row][col] = value
    return grid`,
"alien-dictionary": `def solve(data):
    words = data["words"]
    graph = {char:set() for word in words for char in word}
    indegree = {char:0 for char in graph}
    edges = []
    for a,b in zip(words,words[1:]):
        if len(a) > len(b) and a.startswith(b): return ""
        for x,y in zip(a,b):
            if x != y:
                if y not in graph[x]:
                    graph[x].add(y)
                    edges.append([x,y])
                    indegree[y] += 1
                break
    queue, result = deque(sorted(char for char in graph if not indegree[char])), []
    while queue:
        current = queue.popleft()
        result.append(current)
        for neighbor in sorted(graph[current]):
            indegree[neighbor] -= 1
            if indegree[neighbor] == 0: queue.append(neighbor)
    return "".join(result) if len(result) == len(graph) else ""`,
"connected-components": `def solve(data):
    n, edges = data["n"], data["edges"]
    parent, size = list(range(n)), [1]*n
    def find(x):
        while x != parent[x]:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    components = n
    for a,b in edges:
        ra, rb = find(a), find(b)
        if ra == rb: continue
        if size[ra] < size[rb]: ra, rb = rb, ra
        parent[rb] = ra
        size[ra] += size[rb]
        components -= 1
    return components`,
"redundant-connection": `def solve(data):
    edges = data["edges"]
    parent = list(range(max((max(e) for e in edges),default=0)+1))
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    for a,b in edges:
        ra, rb = find(a), find(b)
        if ra == rb: return [a,b]
        parent[rb] = ra
    return []`,
"accounts-merge": `def solve(data):
    accounts = data["accounts"]
    parent, owners, edges = list(range(len(accounts))), {}, []
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    for i, account in enumerate(accounts):
        for email in account[1:]:
            if email in owners:
                parent[find(i)] = find(owners[email])
                edges.append([i,owners[email]])
            owners[email] = i
    groups = defaultdict(list)
    for email, owner in owners.items(): groups[find(owner)].append(email)
    return sorted([[accounts[root][0]] + sorted(emails) for root,emails in groups.items()])`,
"islands-ii": `def solve(data):
    rows, cols = data["m"], data["n"]
    grid, parent, count, result = [[0]*cols for _ in range(rows)], {}, 0, []
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    for row,col in data["positions"]:
        cell = row*cols+col
        if cell in parent:
            result.append(count)
            continue
        parent[cell] = cell
        grid[row][col] = 1
        count += 1
        for dr,dc in [(1,0),(-1,0),(0,1),(0,-1)]:
            r,c = row+dr,col+dc
            neighbor = r*cols+c
            if 0 <= r < rows and 0 <= c < cols and neighbor in parent:
                a,b = find(cell),find(neighbor)
                if a != b:
                    parent[b] = a
                    count -= 1
        result.append(count)
    return result`,
"network-delay": `def solve(data):
    edges, n, start = data["times"], data["n"], data["k"]
    graph = defaultdict(list)
    for a,b,w in edges: graph[a].append((b,w))
    distance = {start:0}
    heap, visited = [(0,start)], set()
    while heap:
        cost,current = heapq.heappop(heap)
        if current in visited: continue
        visited.add(current)
        for neighbor,weight in graph[current]:
            candidate = cost+weight
            if candidate < distance.get(neighbor,float('inf')):
                distance[neighbor] = candidate
                heapq.heappush(heap,(candidate,neighbor))
    return max(distance.values()) if len(visited) == n else -1`,
"maximum-probability": `def solve(data):
    edges = data["edges"]
    graph = defaultdict(list)
    for (a,b),p in zip(edges,data["succProb"]):
        graph[a].append((b,p))
        graph[b].append((a,p))
    distance = [0.0]*data["n"]
    distance[data["start"]] = 1.0
    heap = [(-1.0,data["start"])]
    while heap:
        negative,current = heapq.heappop(heap)
        probability = -negative
        if current == data["end"]: return probability
        if probability < distance[current]: continue
        for neighbor,p in graph[current]:
            candidate = probability*p
            if candidate > distance[neighbor]:
                distance[neighbor] = candidate
                heapq.heappush(heap,(-candidate,neighbor))
    return 0.0`,
"cheapest-flights": `def solve(data):
    edges = data["flights"]
    distance = [float('inf')]*data["n"]
    distance[data["src"]] = 0
    for stops in range(data["k"]+1):
        previous = distance[:]
        for a,b,price in edges:
            distance[b] = min(distance[b],previous[a]+price)
    answer = distance[data["dst"]]
    return -1 if answer == float('inf') else answer`,
"swim-water": `def solve(data):
    grid = data["grid"]
    n = len(grid)
    heap, visited = [(grid[0][0],0,0)], set()
    while heap:
        cost,row,col = heapq.heappop(heap)
        if (row,col) in visited: continue
        visited.add((row,col))
        if row == n-1 and col == n-1: return cost
        for dr,dc in [(1,0),(-1,0),(0,1),(0,-1)]:
            r,c = row+dr,col+dc
            if 0 <= r < n and 0 <= c < n and (r,c) not in visited:
                heapq.heappush(heap,(max(cost,grid[r][c]),r,c))`,
"kth-largest": `def solve(data):
    nums, k = data["nums"], data["k"]
    heap = []
    for i,value in enumerate(nums):
        heapq.heappush(heap,value)
        if len(heap) > k: heapq.heappop(heap)
    return heap[0]`,
"top-k-frequent": `def solve(data):
    nums, k = data["nums"], data["k"]
    counts, heap = Counter(nums), []
    for value,frequency in counts.items():
        heapq.heappush(heap,(frequency,value))
        if len(heap) > k: heapq.heappop(heap)
    return [value for frequency,value in sorted(heap,reverse=True)]`,
"task-scheduler": `def solve(data):
    counts = Counter(data["tasks"])
    heap = [-count for count in counts.values()]
    heapq.heapify(heap)
    queue, time = deque(), 0
    while heap or queue:
        time += 1
        if heap:
            remaining = heapq.heappop(heap)+1
            if remaining: queue.append((time+data["n"],remaining))
        if queue and queue[0][0] == time:
            ready,remaining = queue.popleft()
            heapq.heappush(heap,remaining)
    return time`,
"median-stream": `def solve(data):
    nums = data["nums"]
    lower, upper, result = [], [], []
    for i,value in enumerate(nums):
        heapq.heappush(lower,-value)
        heapq.heappush(upper,-heapq.heappop(lower))
        if len(upper) > len(lower): heapq.heappush(lower,-heapq.heappop(upper))
        median = -lower[0] if len(lower) > len(upper) else (-lower[0]+upper[0])/2
        result.append(median)
    return result`,
};
