function jaccard(a, b) {
  const A = new Set(a || []);
  const B = new Set(b || []);
  const inter = [...A].filter((x) => B.has(x)).length;
  const union = new Set([...A, ...B]).size;
  return union === 0 ? 0 : inter / union;
}

function getNeighborsUndirected(dataset, id) {
  const out = [];
  for (const e of dataset.edges) {
    if (e.source === id) out.push(e.target);
    else if (e.target === id) out.push(e.source);
  }
  return out;
}

function buildGraphFromProblem({ problemText, keywords, dataset, maxHops = 2, maxNodes = 14 }) {
  // Compute relevance scores against node tags.
  const relevanceById = {};
  for (const n of dataset.nodes) {
    relevanceById[n.id] = jaccard(keywords, n.tags);
  }

  const ranked = dataset.nodes
    .map((n) => ({ id: n.id, score: relevanceById[n.id] || 0 }))
    .sort((a, b) => b.score - a.score);

  const matched = ranked.filter((r) => r.score > 0).slice(0, 4);
  const matchedKeywordTerms = keywords.slice(0, 6);

  // Fallback if no keyword overlap happened.
  const startId = matched.length ? matched[0].id : dataset.nodes[0].id;
  const goalId = matched.length >= 2 ? matched[1].id : startId;

  // Expand neighborhood from the top matched cases.
  const seedIds = matched.length ? matched.map((m) => m.id) : [startId];
  const inSet = new Set(seedIds);
  let frontier = [...seedIds];
  for (let depth = 0; depth < maxHops; depth++) {
    const next = [];
    for (const id of frontier) {
      const neigh = getNeighborsUndirected(dataset, id);
      for (const x of neigh) {
        if (!inSet.has(x)) {
          inSet.add(x);
          next.push(x);
        }
      }
    }
    frontier = next;
  }

  // Limit nodes by relevance to keep visualization readable.
  const nodeById = new Map(dataset.nodes.map((n) => [n.id, n]));
  const rankedByRel = [...inSet].map((id) => ({ id, score: relevanceById[id] || 0 }))
    .sort((a, b) => b.score - a.score);

  const chosen = rankedByRel.slice(0, maxNodes).map((x) => x.id);
  // Ensure start/goal are always included (if possible).
  if (!chosen.includes(startId)) chosen.unshift(startId);
  if (goalId !== startId && !chosen.includes(goalId)) {
    chosen.push(goalId);
  }

  const chosenSet = new Set(chosen);

  const graphNodes = dataset.nodes
    .filter((n) => chosenSet.has(n.id))
    .map((n) => ({
      id: n.id,
      label: n.label,
      year: n.year,
      jurisdiction: n.jurisdiction,
      tags: n.tags,
      summary: n.summary,
      importance: n.importance,
    }));

  const graphLinks = dataset.edges
    .filter((e) => chosenSet.has(e.source) && chosenSet.has(e.target))
    .map((e) => ({
      source: e.source,
      target: e.target,
      citation: e.citation,
      proposition: e.proposition,
      importance: e.importance,
    }));

  return {
    graph: { nodes: graphNodes, links: graphLinks },
    relevanceById,
    startId,
    goalId,
    matchedKeywordTerms,
  };
}

module.exports = { buildGraphFromProblem };

