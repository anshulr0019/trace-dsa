export const pythonAdvanced: Record<string,string> = {
"subsets": `def solve(data):
    nums, result, path = data["nums"], [], []
    def visit(start):
        result.append(path[:])
        for i in range(start, len(nums)):
            path.append(nums[i])
            visit(i + 1)
            path.pop()
    visit(0)
    return result`,
"combination-sum": `def solve(data):
    candidates = sorted(set(data["candidates"]))
    result, path = [], []
    def visit(start, remaining):
        if remaining == 0:
            result.append(path[:])
            return
        for i in range(start, len(candidates)):
            if candidates[i] > remaining: break
            path.append(candidates[i])
            visit(i, remaining - candidates[i])
            path.pop()
    visit(0, data["target"])
    return result`,
"phone-letters": `def solve(data):
    digits = data["digits"]
    letters = {"2":"abc", "3":"def", "4":"ghi", "5":"jkl", "6":"mno", "7":"pqrs", "8":"tuv", "9":"wxyz"}
    result, path = [], []
    def visit(i):
        if i == len(digits):
            result.append("".join(path))
            return
        for ch in letters[digits[i]]:
            path.append(ch)
            visit(i + 1)
            path.pop()
    if digits: visit(0)
    return result`,
"n-queens": `def solve(data):
    n = data["n"]
    columns, diagonal, antidiagonal = set(), set(), set()
    board, result = [["."] * n for _ in range(n)], []
    def visit(row):
        if row == n:
            result.append(["".join(line) for line in board])
            return
        for col in range(n):
            if col in columns or row-col in diagonal or row+col in antidiagonal: continue
            board[row][col] = "Q"
            columns.add(col)
            diagonal.add(row-col)
            antidiagonal.add(row+col)
            visit(row + 1)
            board[row][col] = "."
            columns.remove(col)
            diagonal.remove(row-col)
            antidiagonal.remove(row+col)
    visit(0)
    return result`,
"climbing-stairs": `def solve(data):
    n = data["n"]
    dp = [1] * (n + 1)
    for i in range(2, n + 1):
        dp[i] = dp[i-1] + dp[i-2]
    return dp[n]`,
"house-robber": `def solve(data):
    nums = data["nums"]
    dp = [0] * (len(nums) + 2)
    for i, value in enumerate(nums):
        dp[i+2] = max(dp[i+1], dp[i] + value)
    return dp[-1]`,
"palindromic-substrings": `def solve(data):
    s, count = data["s"], 0
    dp = [[False] * len(s) for _ in s]
    for left in range(len(s)-1, -1, -1):
        for right in range(left, len(s)):
            dp[left][right] = s[left] == s[right] and (right-left < 2 or dp[left+1][right-1])
            if dp[left][right]: count += 1
    return count`,
"decode-ways": `def solve(data):
    s = data["s"]
    if not s: return 0
    dp = [0] * (len(s) + 1)
    dp[0] = 1
    for i in range(1, len(s) + 1):
        if s[i-1] != "0": dp[i] += dp[i-1]
        if i >= 2 and 10 <= int(s[i-2:i]) <= 26: dp[i] += dp[i-2]
    return dp[-1]`,
"unique-paths": `def solve(data):
    m, n = data["m"], data["n"]
    if m <= 0 or n <= 0: return 0
    dp = [[1] * n for _ in range(m)]
    for row in range(1, m):
        for col in range(1, n):
            dp[row][col] = dp[row-1][col] + dp[row][col-1]
    return dp[-1][-1]`,
"longest-common-subsequence": `def solve(data):
    a, b = data["text1"], data["text2"]
    dp = [[0] * (len(b)+1) for _ in range(len(a)+1)]
    for i in range(1, len(a)+1):
        for j in range(1, len(b)+1):
            dp[i][j] = 1 + dp[i-1][j-1] if a[i-1] == b[j-1] else max(dp[i-1][j], dp[i][j-1])
    return dp[-1][-1]`,
"edit-distance": `def solve(data):
    a, b = data["word1"], data["word2"]
    dp = [[0] * (len(b)+1) for _ in range(len(a)+1)]
    for i in range(len(a)+1): dp[i][0] = i
    for j in range(len(b)+1): dp[0][j] = j
    for i in range(1, len(a)+1):
        for j in range(1, len(b)+1):
            dp[i][j] = dp[i-1][j-1] if a[i-1] == b[j-1] else 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
    return dp[-1][-1]`,
"burst-balloons-dp": `def solve(data):
    nums = [1] + data["nums"] + [1]
    n = len(nums)
    dp = [[0] * n for _ in range(n)]
    for width in range(2, n):
        for left in range(n-width):
            right = left + width
            for k in range(left+1, right):
                dp[left][right] = max(dp[left][right], dp[left][k] + nums[left]*nums[k]*nums[right] + dp[k][right])
    return dp[0][-1]`,
"coin-change": `def solve(data):
    coins, amount = data["coins"], data["amount"]
    dp = [0] + [amount+1] * amount
    for i in range(1, amount+1):
        for coin in coins:
            if coin <= i: dp[i] = min(dp[i], 1 + dp[i-coin])
    return dp[amount] if dp[amount] <= amount else -1`,
"target-sum": `def solve(data):
    dp = {0: 1}
    for i, value in enumerate(data["nums"]):
        next_dp = defaultdict(int)
        for total, count in dp.items():
            next_dp[total+value] += count
            next_dp[total-value] += count
        dp = dict(next_dp)
    return dp.get(data["target"], 0)`,
"stock-cooldown": `def solve(data):
    hold, sold, rest = float("-inf"), float("-inf"), 0
    dp = []
    for i, price in enumerate(data["prices"]):
        hold, sold, rest = max(hold, rest-price), hold+price, max(rest, sold)
        dp.append([hold, sold, rest])
    return max(sold, rest)`,
"regex-matching": `def solve(data):
    s, p = data["s"], data["p"]
    dp = [[False] * (len(p)+1) for _ in range(len(s)+1)]
    dp[0][0] = True
    for j in range(2, len(p)+1):
        if p[j-1] == "*": dp[0][j] = dp[0][j-2]
    for i in range(1, len(s)+1):
        for j in range(1, len(p)+1):
            if p[j-1] == "*" and j >= 2:
                dp[i][j] = dp[i][j-2] or ((p[j-2] == "." or p[j-2] == s[i-1]) and dp[i-1][j])
            elif p[j-1] == "." or p[j-1] == s[i-1]:
                dp[i][j] = dp[i-1][j-1]
    return dp[-1][-1]`,
"jump-game": `def solve(data):
    nums, farthest = data["nums"], 0
    for i, jump in enumerate(nums):
        if i > farthest: return False
        farthest = max(farthest, i + jump)
    return bool(nums)`,
"jump-game-ii": `def solve(data):
    nums = data["nums"]
    if not nums: return -1
    end, farthest, jumps = 0, 0, 0
    for i in range(len(nums)-1):
        farthest = max(farthest, i + nums[i])
        if i == end:
            if farthest <= i: return -1
            jumps += 1
            end = farthest
    return jumps`,
"gas-station": `def solve(data):
    gas, cost = data["gas"], data["cost"]
    total, tank, start = 0, 0, 0
    for i in range(len(gas)):
        delta = gas[i] - cost[i]
        total += delta
        tank += delta
        if tank < 0:
            start = i + 1
            tank = 0
    return start if gas and total >= 0 else -1`,
"candy": `def solve(data):
    ratings = data["ratings"]
    candies = [1] * len(ratings)
    for i in range(1, len(ratings)):
        if ratings[i] > ratings[i-1]: candies[i] = candies[i-1] + 1
    for i in range(len(ratings)-2, -1, -1):
        if ratings[i] > ratings[i+1]: candies[i] = max(candies[i], candies[i+1] + 1)
    return sum(candies)`,
"single-number": `def solve(data):
    result = 0
    for i, value in enumerate(data["nums"]):
        result ^= value
    return result`,
"counting-bits": `def solve(data):
    dp = [0] * (data["n"]+1)
    for i in range(1, len(dp)):
        dp[i] = dp[i >> 1] + (i & 1)
    return dp`,
"reverse-bits": `def solve(data):
    n, result = data["n"], 0
    for i in range(32):
        result = (result << 1) | (n & 1)
        n >>= 1
    return result`,
"sum-two-integers": `def solve(data):
    a, b = data["a"], data["b"]
    mask = 0xFFFFFFFF
    a, b = a & mask, b & mask
    while b:
        carry = (a & b) << 1
        a = (a ^ b) & mask
        b = carry & mask
    return a if a <= 0x7FFFFFFF else ~(a ^ mask)`,
"strstr": `def solve(data):
    haystack, needle = data["haystack"], data["needle"]
    if not needle: return 0
    lps, j = [0] * len(needle), 0
    for i in range(1, len(needle)):
        while j and needle[i] != needle[j]: j = lps[j-1]
        if needle[i] == needle[j]: j += 1
        lps[i] = j
    j = 0
    for i, ch in enumerate(haystack):
        while j and ch != needle[j]: j = lps[j-1]
        if ch == needle[j]: j += 1
        if j == len(needle): return i-j+1
    return -1`,
"repeated-dna": `def solve(data):
    s = data["s"]
    codes = {"A":0, "C":1, "G":2, "T":3}
    seen, repeated, result = set(), set(), []
    rolling = 0
    for i, ch in enumerate(s):
        rolling = ((rolling << 2) | codes[ch]) & ((1 << 20)-1)
        if i < 9: continue
        if rolling in seen and rolling not in repeated:
            result.append(s[i-9:i+1])
            repeated.add(rolling)
        seen.add(rolling)
    return result`,
"happy-prefix": `def solve(data):
    s = data["s"]
    if not s: return ""
    lps, j = [0] * len(s), 0
    for i in range(1, len(s)):
        while j and s[i] != s[j]: j = lps[j-1]
        if s[i] == s[j]: j += 1
        lps[i] = j
    return s[:lps[-1]]`,
"shortest-palindrome": `def solve(data):
    s = data["s"]
    sequence = list(s) + [None] + list(s[::-1])
    lps, j = [0] * len(sequence), 0
    for i in range(1, len(sequence)):
        while j and sequence[i] != sequence[j]: j = lps[j-1]
        if sequence[i] == sequence[j]: j += 1
        lps[i] = j
    return s[lps[-1]:][::-1] + s`,
};
