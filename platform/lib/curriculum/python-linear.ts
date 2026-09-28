export const pythonLinear: Record<string, string> = {
"maximum-average-subarray": `def solve(data):
    nums, k = data["nums"], data["k"]
    total = sum(nums[:k])
    best = total
    left = 0
    for right in range(k, len(nums)):
        total += nums[right] - nums[left]
        left += 1
        best = max(best, total)
    return best / k`,
"longest-unique-substring": `def solve(data):
    s = data["s"]
    last = {}
    left = best = 0
    for right, char in enumerate(s):
        left = max(left, last.get(char, -1) + 1)
        last[char] = right
        best = max(best, right - left + 1)
    return best`,
"character-replacement": `def solve(data):
    s, k = data["s"], data["k"]
    counts = Counter()
    left = best = most = 0
    for right, char in enumerate(s):
        counts[char] += 1
        most = max(most, counts[char])
        while right - left + 1 - most > k:
            counts[s[left]] -= 1
            left += 1
        best = max(best, right - left + 1)
    return best`,
"minimum-window": `def solve(data):
    s, t = data["s"], data["t"]
    if not t:
        return ""
    need = Counter(t)
    missing, left = len(t), 0
    start, length = 0, len(s) + 1
    for right, char in enumerate(s):
        if need[char] > 0:
            missing -= 1
        need[char] -= 1
        while missing == 0:
            if right - left + 1 < length:
                start, length = left, right - left + 1
            need[s[left]] += 1
            if need[s[left]] > 0:
                missing += 1
            left += 1
    return "" if length > len(s) else s[start:start + length]`,
"two-sum-sorted": `def solve(data):
    nums, target = data["nums"], data["target"]
    left, right = 0, len(nums) - 1
    while left < right:
        total = nums[left] + nums[right]
        if total == target:
            return [left + 1, right + 1]
        if total < target:
            left += 1
        else:
            right -= 1
    return []`,
"three-sum": `def solve(data):
    nums = sorted(data["nums"])
    result = []
    for i in range(len(nums) - 2):
        if i and nums[i] == nums[i - 1]:
            continue
        left, right = i + 1, len(nums) - 1
        while left < right:
            total = nums[i] + nums[left] + nums[right]
            if total < 0:
                left += 1
            elif total > 0:
                right -= 1
            else:
                result.append([nums[i], nums[left], nums[right]])
                left += 1
                right -= 1
                while left < right and nums[left] == nums[left - 1]:
                    left += 1
                while left < right and nums[right] == nums[right + 1]:
                    right -= 1
    return result`,
"container-water": `def solve(data):
    nums = data["height"]
    left, right, best = 0, len(nums) - 1, 0
    while left < right:
        area = min(nums[left], nums[right]) * (right - left)
        best = max(best, area)
        if nums[left] < nums[right]:
            left += 1
        else:
            right -= 1
    return best`,
"trapping-rain": `def solve(data):
    nums = data["height"]
    left, right = 0, len(nums) - 1
    left_max = right_max = total = 0
    water = [0] * len(nums)
    while left <= right:
        if left_max <= right_max:
            left_max = max(left_max, nums[left])
            water[left] = left_max - nums[left]
            total += water[left]
            left += 1
        else:
            right_max = max(right_max, nums[right])
            water[right] = right_max - nums[right]
            total += water[right]
            right -= 1
    return total`,
"middle-list": `def solve(data):
    nodes, links = linked(data["values"])
    slow = fast = 0 if nodes else -1
    while fast != -1 and links[fast] != -1:
        slow = links[slow]
        fast = links[links[fast]]
    result = []
    while slow != -1:
        result.append(nodes[slow])
        slow = links[slow]
    return result`,
"linked-cycle": `def solve(data):
    nodes, links = linked(data["values"], data.get("pos", -1))
    slow = fast = 0 if nodes else -1
    while fast != -1 and links[fast] != -1:
        slow = links[slow]
        fast = links[links[fast]]
        if slow == fast:
            return True
    return False`,
"duplicate-number": `def solve(data):
    nums = data["nums"]
    nodes = list(range(len(nums)))
    links = nums
    slow = fast = 0
    while True:
        slow = nums[slow]
        fast = nums[nums[fast]]
        if slow == fast:
            break
    slow = 0
    while slow != fast:
        slow = nums[slow]
        fast = nums[fast]
    return slow`,
"cycle-entrance": `def solve(data):
    nodes, links = linked(data["values"], data.get("pos", -1))
    slow = fast = 0 if nodes else -1
    while fast != -1 and links[fast] != -1:
        slow = links[slow]
        fast = links[links[fast]]
        if slow == fast:
            slow = 0
            while slow != fast:
                slow = links[slow]
                fast = links[fast]
            return slow
    return -1`,
"next-greater": `def solve(data):
    nums, stack, greater = data["nums2"], [], {}
    for i, value in enumerate(nums):
        while stack and nums[stack[-1]] < value:
            j = stack.pop()
            greater[nums[j]] = value
        stack.append(i)
    return [greater.get(value, -1) for value in data["nums1"]]`,
"daily-temperatures": `def solve(data):
    nums = data["temperatures"]
    stack, result = [], [0] * len(nums)
    for i, value in enumerate(nums):
        while stack and nums[stack[-1]] < value:
            j = stack.pop()
            result[j] = i - j
        stack.append(i)
    return result`,
"car-fleet": `def solve(data):
    cars = sorted(zip(data["position"], data["speed"]), reverse=True)
    stack = []
    for position, speed in cars:
        arrival = (data["target"] - position) / speed
        if not stack or arrival > stack[-1]:
            stack.append(arrival)
    return len(stack)`,
"largest-rectangle": `def solve(data):
    nums = data["heights"] + [0]
    stack, best = [], 0
    for i, height in enumerate(nums):
        start = i
        while stack and stack[-1][1] > height:
            start, old_height = stack.pop()
            area = old_height * (i - start)
            best = max(best, area)
        stack.append((start, height))
    return best`,
"valid-parentheses": `def solve(data):
    s, stack = data["s"], []
    pairs = {')':'(', ']':'[', '}':'{'}
    for i, char in enumerate(s):
        if char in pairs.values():
            stack.append(char)
        elif not stack or stack.pop() != pairs.get(char):
            return False
    return not stack`,
"reverse-polish": `def solve(data):
    stack = []
    for i, token in enumerate(data["tokens"]):
        if token not in {"+", "-", "*", "/"}:
            stack.append(int(token))
            continue
        b, a = stack.pop(), stack.pop()
        if token == "+": value = a + b
        elif token == "-": value = a - b
        elif token == "*": value = a * b
        else: value = (abs(a) // abs(b)) * (1 if a * b >= 0 else -1)
        stack.append(value)
    return stack[-1]`,
"min-stack": `def solve(data):
    stack, minima, result = [], [], []
    for operation in data["operations"]:
        name = operation[0]
        value = None
        if name == "push":
            stack.append(operation[1])
            minima.append(min(operation[1], minima[-1] if minima else operation[1]))
        elif name == "pop":
            stack.pop()
            minima.pop()
        elif name == "top":
            value = stack[-1]
        elif name == "getMin":
            value = minima[-1]
        result.append(value)
    return result`,
"calculator-ii": `def solve(data):
    s = data["s"].replace(" ", "") + "+"
    stack, number, previous = [], 0, "+"
    for i, char in enumerate(s):
        if char.isdigit():
            number = number * 10 + int(char)
            continue
        if previous == "+": stack.append(number)
        elif previous == "-": stack.append(-number)
        elif previous == "*": stack[-1] *= number
        else:
            a = stack.pop()
            stack.append((abs(a) // number) * (1 if a >= 0 else -1))
        previous, number = char, 0
    return sum(stack)`,
"merge-intervals": `def solve(data):
    intervals = sorted(data["intervals"])
    result = []
    for start, end in intervals:
        if result and start <= result[-1][1]:
            result[-1][1] = max(result[-1][1], end)
        else:
            result.append([start, end])
    return result`,
"insert-interval": `def solve(data):
    intervals = data["intervals"]
    start, end = data["newInterval"]
    result, i = [], 0
    while i < len(intervals) and intervals[i][1] < start:
        result.append(intervals[i])
        i += 1
    while i < len(intervals) and intervals[i][0] <= end:
        start = min(start, intervals[i][0])
        end = max(end, intervals[i][1])
        i += 1
    return result + [[start, end]] + intervals[i:]`,
"meeting-rooms": `def solve(data):
    intervals = sorted(data["intervals"])
    heap, best = [], 0
    for start, end in intervals:
        while heap and heap[0] <= start:
            heapq.heappop(heap)
        heapq.heappush(heap, end)
        best = max(best, len(heap))
    return best`,
"burst-balloons-arrows": `def solve(data):
    intervals = sorted(data["points"], key=lambda pair: pair[1])
    arrows, boundary = 0, float('-inf')
    for start, end in intervals:
        if start > boundary:
            arrows += 1
            boundary = end
    return arrows`,
"reverse-list": `def solve(data):
    nodes, links = linked(data["values"])
    previous, current = -1, 0 if nodes else -1
    while current != -1:
        following = links[current]
        links[current] = previous
        previous, current = current, following
    result = []
    while previous != -1:
        result.append(nodes[previous])
        previous = links[previous]
    return result`,
"reorder-list": `def solve(data):
    nodes, links = linked(data["values"])
    if not nodes: return []
    slow = fast = 0
    while links[fast] != -1 and links[links[fast]] != -1:
        slow = links[slow]
        fast = links[links[fast]]
    current, previous = links[slow], -1
    links[slow] = -1
    while current != -1:
        following = links[current]
        links[current] = previous
        previous, current = current, following
    first, second = 0, previous
    while second != -1:
        a, b = links[first], links[second]
        links[first] = second
        links[second] = a
        first, second = a, b
    result, current = [], 0
    while current != -1:
        result.append(nodes[current])
        current = links[current]
    return result`,
"copy-random-list": `def solve(data):
    nodes = data["values"][:]
    random = data["random"]
    links = list(range(1, len(nodes))) + ([-1] if nodes else [])
    copies = {}
    for i, value in enumerate(nodes):
        copies[i] = {"value": value, "next": None, "random": None}
    for i in range(len(nodes)):
        copies[i]["next"] = copies.get(links[i])
        copies[i]["random"] = copies.get(random[i])
    identities = {id(node): i for i, node in copies.items()}
    return [[copies[i]["value"], identities.get(id(copies[i]["random"]))] for i in range(len(nodes))]`,
"reverse-k-group": `def solve(data):
    nodes, links = linked(data["values"])
    k = data["k"]
    head, tail, current = -1, -1, 0 if nodes else -1
    while current != -1:
        check = current
        for _ in range(k):
            if check == -1: break
            check = links[check]
        else:
            previous, start = check, current
            for _ in range(k):
                following = links[current]
                links[current] = previous
                previous, current = current, following
            if tail != -1: links[tail] = previous
            else: head = previous
            tail = start
            continue
        if tail != -1: links[tail] = current
        else: head = current
        break
    result = []
    while head != -1:
        result.append(nodes[head])
        head = links[head]
    return result`,
};
