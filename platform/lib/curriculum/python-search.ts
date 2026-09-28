export const pythonSearch: Record<string,string> = {
"binary-search-standard": `def solve(data):
    nums, target = data["nums"], data["target"]
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target: return mid
        if nums[mid] < target: left = mid + 1
        else: right = mid - 1
    return -1`,
"search-matrix": `def solve(data):
    matrix, target = data["matrix"], data["target"]
    if not matrix or not matrix[0]: return False
    rows, cols = len(matrix), len(matrix[0])
    left, right = 0, rows * cols - 1
    while left <= right:
        mid = (left + right) // 2
        row, col = divmod(mid, cols)
        if matrix[row][col] == target: return True
        if matrix[row][col] < target: left = mid + 1
        else: right = mid - 1
    return False`,
"koko-bananas": `def solve(data):
    nums, hours = data["piles"], data["h"]
    left, right = 1, max(nums)
    while left < right:
        mid = (left + right) // 2
        needed = sum((pile + mid - 1) // mid for pile in nums)
        if needed <= hours: right = mid
        else: left = mid + 1
    return left`,
"median-sorted-arrays": `def solve(data):
    a, b = data["nums1"], data["nums2"]
    if len(a) > len(b): a, b = b, a
    if not a and not b: raise ValueError("At least one array must be nonempty")
    left, right = 0, len(a)
    half = (len(a) + len(b) + 1) // 2
    while left <= right:
        i = (left + right) // 2
        j = half - i
        al = a[i - 1] if i else float('-inf')
        ar = a[i] if i < len(a) else float('inf')
        bl = b[j - 1] if j else float('-inf')
        br = b[j] if j < len(b) else float('inf')
        if al <= br and bl <= ar:
            if (len(a) + len(b)) % 2: return max(al, bl)
            return (max(al, bl) + min(ar, br)) / 2
        if al > br: right = i - 1
        else: left = i + 1`,
"minimum-rotated": `def solve(data):
    nums = data["nums"]
    left, right = 0, len(nums) - 1
    while left < right:
        mid = (left + right) // 2
        if nums[mid] > nums[right]: left = mid + 1
        else: right = mid
    return nums[left]`,
"search-rotated": `def solve(data):
    nums, target = data["nums"], data["target"]
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target: return mid
        if nums[left] <= nums[mid]:
            if nums[left] <= target < nums[mid]: right = mid - 1
            else: left = mid + 1
        else:
            if nums[mid] < target <= nums[right]: left = mid + 1
            else: right = mid - 1
    return -1`,
"search-rotated-duplicates": `def solve(data):
    nums, target = data["nums"], data["target"]
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target: return True
        if nums[left] == nums[mid] == nums[right]:
            left += 1
            right -= 1
        elif nums[left] <= nums[mid]:
            if nums[left] <= target < nums[mid]: right = mid - 1
            else: left = mid + 1
        else:
            if nums[mid] < target <= nums[right]: left = mid + 1
            else: right = mid - 1
    return False`,
"mountain-array": `def solve(data):
    nums, target = data["nums"], data["target"]
    left, right = 0, len(nums) - 1
    while left < right:
        mid = (left + right) // 2
        if nums[mid] < nums[mid + 1]: left = mid + 1
        else: right = mid
    peak = left
    for start, end, ascending in [(0, peak, True), (peak + 1, len(nums) - 1, False)]:
        left, right = start, end
        while left <= right:
            mid = (left + right) // 2
            if nums[mid] == target: return mid
            if (nums[mid] < target) == ascending: left = mid + 1
            else: right = mid - 1
    return -1`,
"level-order": `def solve(data):
    nodes, left_child, right_child = tree(data["tree"])
    queue = deque([0] if nodes else [])
    result = []
    while queue:
        level = []
        for _ in range(len(queue)):
            current = queue.popleft()
            level.append(nodes[current])
            for child in [left_child[current], right_child[current]]:
                if child != -1: queue.append(child)
        result.append(level)
    return result`,
"right-side-view": `def solve(data):
    nodes, left_child, right_child = tree(data["tree"])
    queue = deque([0] if nodes else [])
    result = []
    while queue:
        for _ in range(len(queue)):
            current = queue.popleft()
            for child in [left_child[current], right_child[current]]:
                if child != -1: queue.append(child)
        result.append(nodes[current])
    return result`,
"next-right-pointers": `def solve(data):
    nodes, left_child, right_child = tree(data["tree"])
    queue = deque([0] if nodes else [])
    links, result = [-1] * len(nodes), []
    while queue:
        previous = -1
        for _ in range(len(queue)):
            current = queue.popleft()
            if previous != -1: links[previous] = current
            previous = current
            for child in [left_child[current], right_child[current]]:
                if child != -1: queue.append(child)
    return [[nodes[i], nodes[links[i]] if links[i] != -1 else None] for i in range(len(nodes))]`,
"word-ladder": `def solve(data):
    begin, end = data["beginWord"], data["endWord"]
    words = set(data["wordList"])
    if end not in words: return 0
    queue, visited = deque([(begin, 1)]), {begin}
    edges = []
    while queue:
        current, distance = queue.popleft()
        if current == end: return distance
        for word in sorted(words):
            if word not in visited and sum(a != b for a, b in zip(current, word)) == 1:
                visited.add(word)
                edges.append([current, word])
                queue.append((word, distance + 1))
    return 0`,
"maximum-depth": `def solve(data):
    nodes, left_child, right_child = tree(data["tree"])
    def depth(current):
        if current == -1: return 0
        a = depth(left_child[current])
        b = depth(right_child[current])
        return 1 + max(a, b)
    return depth(0 if nodes else -1)`,
"lowest-common-ancestor": `def solve(data):
    nodes, left_child, right_child = tree(data["tree"])
    p, q = data["p"], data["q"]
    if p not in nodes or q not in nodes: return None
    def visit(current):
        if current == -1: return -1
        if nodes[current] in (p, q): return current
        a = visit(left_child[current])
        b = visit(right_child[current])
        if a != -1 and b != -1: return current
        return a if a != -1 else b
    ancestor = visit(0 if nodes else -1)
    return nodes[ancestor] if ancestor != -1 else None`,
"tree-diameter": `def solve(data):
    nodes, left_child, right_child = tree(data["tree"])
    best = 0
    def depth(current):
        nonlocal best
        if current == -1: return 0
        a = depth(left_child[current])
        b = depth(right_child[current])
        best = max(best, a + b)
        return 1 + max(a, b)
    depth(0 if nodes else -1)
    return best`,
"maximum-path-sum": `def solve(data):
    nodes, left_child, right_child = tree(data["tree"])
    if not nodes: return 0
    best = float('-inf')
    def gain(current):
        nonlocal best
        if current == -1: return 0
        a = max(0, gain(left_child[current]))
        b = max(0, gain(right_child[current]))
        best = max(best, nodes[current] + a + b)
        return nodes[current] + max(a, b)
    gain(0)
    return best`,
"implement-trie": `def solve(data):
    trie, result = {}, []
    for operation, word in data["operations"]:
        node = trie
        if operation == "insert":
            for char in word: node = node.setdefault(char, {})
            node["$"] = True
            result.append(None)
        else:
            for char in word:
                if char not in node:
                    node = None
                    break
                node = node[char]
            result.append(node is not None and (operation == "startsWith" or "$" in node))
    return result`,
"word-dictionary": `def solve(data):
    trie, result = {}, []
    def search(node, word, i):
        if i == len(word): return "$" in node
        char = word[i]
        if char == ".":
            return any(search(child, word, i + 1) for key, child in node.items() if key != "$")
        return char in node and search(node[char], word, i + 1)
    for operation, word in data["operations"]:
        if operation == "addWord":
            node = trie
            for char in word: node = node.setdefault(char, {})
            node["$"] = True
            result.append(None)
        else: result.append(search(trie, word, 0))
    return result`,
"replace-words": `def solve(data):
    trie = {}
    for root in data["dictionary"]:
        node = trie
        for char in root: node = node.setdefault(char, {})
        node["$"] = True
    result = []
    for word in data["sentence"].split():
        node, prefix = trie, ""
        for char in word:
            if "$" in node or char not in node: break
            prefix += char
            node = node[char]
        result.append(prefix if "$" in node else word)
    return " ".join(result)`,
"word-search-ii": `def solve(data):
    grid, trie, found = data["board"], {}, set()
    for word in data["words"]:
        node = trie
        for char in word: node = node.setdefault(char, {})
        node["$"] = word
    rows, cols = len(grid), len(grid[0]) if grid else 0
    path = []
    def visit(row, col, node):
        if not (0 <= row < rows and 0 <= col < cols): return
        char = grid[row][col]
        if char not in node: return
        node = node[char]
        if "$" in node: found.add(node["$"])
        grid[row][col] = "#"
        path.append([row, col])
        for dr, dc in [(1,0),(-1,0),(0,1),(0,-1)]: visit(row + dr, col + dc, node)
        path.pop()
        grid[row][col] = char
    for row in range(rows):
        for col in range(cols): visit(row, col, trie)
    return sorted(found)`,
"missing-number": `def solve(data):
    nums = data["nums"][:]
    for i in range(len(nums)):
        while 0 <= nums[i] < len(nums) and nums[i] != i:
            j = nums[i]
            if nums[j] == nums[i]: break
            nums[i], nums[j] = nums[j], nums[i]
    for i, value in enumerate(nums):
        if i != value: return i
    return len(nums)`,
"disappeared-numbers": `def solve(data):
    nums = data["nums"][:]
    for i in range(len(nums)):
        while nums[i] != nums[nums[i] - 1]:
            j = nums[i] - 1
            nums[i], nums[j] = nums[j], nums[i]
    return [i + 1 for i, value in enumerate(nums) if value != i + 1]`,
"set-mismatch": `def solve(data):
    nums = data["nums"][:]
    for i in range(len(nums)):
        while nums[i] != nums[nums[i] - 1]:
            j = nums[i] - 1
            nums[i], nums[j] = nums[j], nums[i]
    for i, value in enumerate(nums):
        if value != i + 1: return [value, i + 1]
    return []`,
"first-missing-positive": `def solve(data):
    nums = data["nums"][:]
    for i in range(len(nums)):
        while 1 <= nums[i] <= len(nums) and nums[i] != nums[nums[i] - 1]:
            j = nums[i] - 1
            nums[i], nums[j] = nums[j], nums[i]
    for i, value in enumerate(nums):
        if value != i + 1: return i + 1
    return len(nums) + 1`,
};
