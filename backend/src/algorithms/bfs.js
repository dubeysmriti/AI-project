function buildAdjacency(graph) {
  const adj = new Map();
  for (const n of graph.nodes) adj.set(n.id, []);
  for (const l of graph.links) {
    if (!adj.has(l.source)) adj.set(l.source, []);
    adj.get(l.source).push(l);
  }
  for (const [k, list] of adj.entries()) {
    // Deterministic: higher precedent importance first.
    list.sort((a, b) => (b.importance || 0) - (a.importance || 0));
  }
  return adj;
}

function reconstruct(parent, startId, goalId) {
  const path = [];
  let cur = goalId;
  while (cur && cur !== startId) {
    path.push(cur);
    cur = parent[cur];
  }
  if (cur === startId) path.push(startId);
  path.reverse();
  return path;
}

function bfsFindPath(graph, startId, goalId) {
  if (!startId || !goalId) return { path: [], explored: 0 };
  if (startId === goalId) return { path: [startId], explored: 1 };

  const adj = buildAdjacency(graph);
  const visited = new Set([startId]);
  const parent = {};
  const queue = [startId];
  let explored = 0;

  while (queue.length) {
    const cur = queue.shift();
    explored += 1;
    const neighbors = adj.get(cur) || [];
    for (const e of neighbors) {
      if (visited.has(e.target)) continue;
      visited.add(e.target);
      parent[e.target] = cur;
      if (e.target === goalId) {
        return { path: reconstruct(parent, startId, goalId), explored };
      }
      queue.push(e.target);
    }
  }

  return { path: [startId], explored };
}

module.exports = { bfsFindPath };

