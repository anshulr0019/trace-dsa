from collections import deque

def linked(values, pos=-1):
    nodes = list(values)
    if not -1 <= pos < len(nodes) and pos != -1:
        raise ValueError("pos must be -1 or a valid node index")
    return nodes, [i+1 if i+1 < len(nodes) else pos for i in range(len(nodes))]

def tree(values):
    if not values or values[0] is None:
        return [], [], []
    nodes, left, right = [values[0]], [-1], [-1]
    queue, index = deque([0]), 1
    while queue and index < len(values):
        parent = queue.popleft()
        for children in (left, right):
            if index >= len(values): break
            value = values[index]
            index += 1
            if value is not None:
                children[parent] = len(nodes)
                queue.append(len(nodes))
                nodes.append(value)
                left.append(-1)
                right.append(-1)
    return nodes, left, right
