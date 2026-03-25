function buildDeterministicExplanation({ algoName, problemText, path, graph }) {
  const nodesById = new Map(graph.nodes.map((n) => [n.id, n]));

  const pathEdges = [];
  for (let i = 0; i < path.length - 1; i++) {
    const source = path[i];
    const target = path[i + 1];
    const edge = graph.links.find((l) => l.source === source && l.target === target);
    if (edge) pathEdges.push(edge);
  }

  const steps = [];
  const start = nodesById.get(path[0]);
  const goal = nodesById.get(path[path.length - 1]);

  const intro = (() => {
    if (algoName === "DFS") {
      return `DFS (deep reasoning) searches through a single chain of citations, preferring stronger precedent links first, until it reaches the closest target.`;
    }
    if (algoName === "BFS") {
      return `BFS (shortest justification) finds the minimum number of citation steps from the closest match to the target issue.`;
    }
    return `UCS (strongest argument) uses weighted precedent importance: stronger citations are treated as lower cost, so the path with the best cumulative authority is preferred.`;
  })();

  steps.push(`1. Context: The input describes: "${problemText}". ${intro}`);

  if (!start || !goal) {
    steps.push(`2. No clear path was found in the current reasoning subgraph.`);
    return steps.join("\n");
  }

  steps.push(
    `2. Start case: ${start.label}. This case is used as the starting anchor because its tags align with the core legal themes in the input.`
  );

  for (let i = 0; i < path.length - 1; i++) {
    const curId = path[i];
    const nextId = path[i + 1];
    const cur = nodesById.get(curId);
    const next = nodesById.get(nextId);

    const edge = pathEdges[i];
    const citationLine = edge
      ? `${cur?.label || curId} cites ${next?.label || nextId} for: ${edge.proposition}`
      : `${cur?.label || curId} connects to ${next?.label || nextId} in the reasoning graph.`;

    steps.push(
      `${i + 3}. Citation logic: ${citationLine}${edge ? ` (precedent importance: ${edge.importance}/10).` : ""}`
    );
  }

  const endStep = `Final: This citation path suggests how courts may move from the input issue to the target legal rule by relying on the selected precedents.`;
  steps.push(endStep);
  return steps.join("\n");
}

module.exports = { buildDeterministicExplanation };

