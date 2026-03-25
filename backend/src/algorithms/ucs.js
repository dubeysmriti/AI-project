class MinHeap {
  constructor() {
    this.arr = [];
  }

  push(item) {
    this.arr.push(item);
    this._bubbleUp(this.arr.length - 1);
  }

  pop() {
    if (this.arr.length === 0) return null;
    const top = this.arr[0];
    const end = this.arr.pop();
    if (this.arr.length > 0) {
      this.arr[0] = end;
      this._bubbleDown(0);
    }
    return top;
  }

  _bubbleUp(i) {
    while (i > 0) {
      const p = Math.floor((i - 1) / 2);
      if (this.arr[p].cost <= this.arr[i].cost) break;
      [this.arr[p], this.arr[i]] = [this.arr[i], this.arr[p]];
      i = p;
    }
  }

  _bubbleDown(i) {
    const n = this.arr.length;
    while (true) {
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      let smallest = i;
      if (l < n && this.arr[l].cost < this.arr[smallest].cost) smallest = l;
      if (r < n && this.arr[r].cost < this.arr[smallest].cost) smallest = r;
      if (smallest === i) break;
      [this.arr[i], this.arr[smallest]] = [this.arr[smallest], this.arr[i]];
      i = smallest;
    }
  }

  get size() {
    return this.arr.length;
  }
}

function buildAdjacency(graph) {
  const adj = new Map();
  for (const n of graph.nodes) adj.set(n.id, []);
  for (const l of graph.links) {
    if (!adj.has(l.source)) adj.set(l.source, []);
    adj.get(l.source).push(l);
  }
  return adj;
}

function edgeCost(edge) {
  const importance = Number(edge.importance || 1);
  // UCS minimizes total cost. We want stronger precedents (higher importance) to be "cheaper".
  return importance > 0 ? 1 / importance : 1;
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

function ucsFindPath(graph, startId, goalId) {
  if (!startId || !goalId) return { path: [], explored: 0 };
  if (startId === goalId) return { path: [startId], explored: 1 };

  const adj = buildAdjacency(graph);
  const dist = {};
  const parent = {};

  const heap = new MinHeap();
  dist[startId] = 0;
  heap.push({ node: startId, cost: 0 });

  const bestVisited = new Set();
  let explored = 0;

  while (heap.size) {
    const cur = heap.pop();
    if (!cur) break;
    explored += 1;

    if (cur.node === goalId) {
      return { path: reconstruct(parent, startId, goalId), explored };
    }

    if (bestVisited.has(cur.node)) continue;
    bestVisited.add(cur.node);

    const neighbors = adj.get(cur.node) || [];
    for (const e of neighbors) {
      const next = e.target;
      const alt = dist[cur.node] + edgeCost(e);
      if (dist[next] === undefined || alt < dist[next]) {
        dist[next] = alt;
        parent[next] = cur.node;
        heap.push({ node: next, cost: alt });
      }
    }
  }

  return { path: [startId], explored };
}

module.exports = { ucsFindPath };

