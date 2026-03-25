function buildAdjacency(graph) {
  const adj = new Map();
  for (const n of graph.nodes) adj.set(n.id, []);
  for (const l of graph.links) {
    if (!adj.has(l.source)) adj.set(l.source, []);
    adj.get(l.source).push(l);
  }
  // Deterministic neighbor order: prefer stronger precedent citations first.
  for (const [k, list] of adj.entries()) {
    list.sort((a, b) => (b.importance || 0) - (a.importance || 0));
  }
  return adj;
}

function dfsFindPath(graph, startId, goalId, { maxDepth = 8 } = {}) {
  if (!startId || !goalId) return { path: [], explored: 0 };
  if (startId === goalId) return { path: [startId], explored: 1 };

  const adj = buildAdjacency(graph);
  const visited = new Set();
  let explored = 0;

  function helper(current, depth, stack) {
    explored += 1;
    if (current === goalId) return [...stack];
    if (depth >= maxDepth) return null;

    visited.add(current);
    const neighbors = adj.get(current) || [];
    for (const edge of neighbors) {
      if (visited.has(edge.target)) continue;
      const res = helper(edge.target, depth + 1, [...stack, edge.target]);
      if (res) return res;
    }
    visited.delete(current);
    return null;
  }

  const path = helper(startId, 0, [startId]) || [startId];
  return { path, explored };
}

module.exports = { dfsFindPath };

