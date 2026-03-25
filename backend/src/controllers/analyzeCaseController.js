const dataset = require("../data/legalDataset.json");
const { extractKeywords } = require("../utils/keywordExtraction");
const { buildGraphFromProblem } = require("../algorithms/graphBuilder");
const { dfsFindPath } = require("../algorithms/dfs");
const { bfsFindPath } = require("../algorithms/bfs");
const { ucsFindPath } = require("../algorithms/ucs");
const { buildDeterministicExplanation } = require("../algorithms/reconstructExplanation");

let openai = null;
if (process.env.OPENAI_API_KEY) {
  // Avoid loading OpenAI SDK unless explicitly configured.
  // eslint-disable-next-line global-require
  const OpenAI = require("openai");
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

async function maybeEnrichExplanationWithOpenAI({
  algoName,
  problemText,
  path,
  nodesById,
  edgesByPair,
}) {
  if (!openai) return null;

  // Keep prompt small and deterministic to reduce token costs.
  const nodeSummaries = path.map((id) => nodesById[id]).filter(Boolean);
  const citationSummaries = [];
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const edge = edgesByPair.get(`${a}::${b}`);
    if (edge) citationSummaries.push(edge);
  }

  const prompt = [
    "You are a legal reasoning assistant.",
    "Given a legal problem and a path of cited cases, produce a step-by-step explanation.",
    "Return ONLY valid JSON matching the schema below.",
    "",
    `Schema: { "explanation": string }`,
    "",
    `Algorithm: ${algoName}`,
    `Legal problem: ${problemText}`,
    `Cases (in order): ${JSON.stringify(
      nodeSummaries.map((n) => ({
        id: n.id,
        label: n.label,
        year: n.year,
        jurisdiction: n.jurisdiction,
        tags: n.tags.slice(0, 5),
      }))
    )}`,
    `Citations (between consecutive cases): ${JSON.stringify(
      citationSummaries.map((e) => ({
        source: e.source,
        target: e.target,
        citation: e.citation,
        proposition: e.proposition,
        importance: e.importance,
      }))
    )}`,
    "",
    "Explanation requirements:",
    "- Use numbered steps (1., 2., 3., ...).",
    "- Each step should mention the current case and the citation logic.",
    "- End with a short 'What this path suggests' sentence.",
  ].join("\n");

  try {
    const resp = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: "You output strict JSON only." },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const content = resp?.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed.explanation === "string") return parsed.explanation;
    return null;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("OpenAI enrichment failed; falling back to mock explanations.", err?.message || err);
    return null;
  }
}

function computeConfidence({ startRel, goalRel, path, algo, edgeImportances }) {
  const len = Math.max(1, (path?.length || 0) - 1);
  const base = 0.45 * (startRel || 0) + 0.55 * (goalRel || 0);
  const avgEdgeImportance =
    edgeImportances && edgeImportances.length
      ? edgeImportances.reduce((a, b) => a + b, 0) / edgeImportances.length
      : 0;

  if (!path || !path.length) return 0.05;
  if (path.length === 1) return Math.max(0.1, base * 0.6);

  if (algo === "BFS") {
    // Shorter justification paths are usually easier to follow.
    const lengthFactor = 1 / (1 + 0.35 * (len - 1));
    return clamp01(base * lengthFactor + 0.05);
  }

  if (algo === "DFS") {
    // DFS can be longer; reward depth when the path also uses reasonably strong citations.
    const lengthFactor = 1 / (1 + 0.25 * (len - 1));
    const citationFactor = 0.7 + 0.3 * clamp01(avgEdgeImportance / 10);
    return clamp01(base * lengthFactor * citationFactor + 0.03);
  }

  if (algo === "UCS") {
    // UCS is designed to minimize cost (maximize weighted precedent strength).
    const citationFactor = 0.4 + 0.6 * clamp01(avgEdgeImportance / 10);
    return clamp01(base * citationFactor + 0.08);
  }

  return clamp01(base + 0.05);
}

function clamp01(n) {
  return Math.max(0, Math.min(1, n));
}

function indexNodes(nodes) {
  const byId = new Map();
  for (const n of nodes) byId.set(n.id, n);
  return byId;
}

function indexEdges(links) {
  const byPair = new Map();
  for (const l of links) byPair.set(`${l.source}::${l.target}`, l);
  return byPair;
}

function decorateWithPathEdges(graph, path) {
  if (!path || path.length < 2) return [];
  const edges = [];
  for (let i = 0; i < path.length - 1; i++) {
    const source = path[i];
    const target = path[i + 1];
    const link = graph.links.find((l) => l.source === source && l.target === target);
    if (link) edges.push(link);
  }
  return edges;
}

async function analyzeCase(problemText) {
  // 1) Convert input into rough keywords.
  const keywords = extractKeywords(problemText);

  // 2) Build a small reasoning subgraph from the mocked legal knowledge base.
  const {
    graph,
    relevanceById,
    startId,
    goalId,
    matchedKeywordTerms,
  } = buildGraphFromProblem({ problemText, keywords, dataset, maxHops: 2, maxNodes: 14 });

  // 3) Index graph for explanation.
  const nodesById = indexNodes(graph.nodes);
  const edgesByPair = indexEdges(graph.links);

  // 4) Run three algorithms to find reasoning paths.
  const dfs = dfsFindPath(graph, startId, goalId, { maxDepth: 8 });
  const bfs = bfsFindPath(graph, startId, goalId);
  const ucs = ucsFindPath(graph, startId, goalId);

  const algos = [
    { key: "dfs", algoName: "DFS", res: dfs },
    { key: "bfs", algoName: "BFS", res: bfs },
    { key: "ucs", algoName: "UCS", res: ucs },
  ];

  const outputs = {};
  for (const a of algos) {
    const path = a.res.path || [startId];
    const pathEdges = decorateWithPathEdges(graph, path);
    const edgeImportances = pathEdges.map((e) => e.importance);

    const explanationMock = buildDeterministicExplanation({
      algoName: a.algoName,
      problemText,
      path,
      graph,
    });

    const confidence_score = computeConfidence({
      startRel: relevanceById[startId] || 0,
      goalRel: relevanceById[goalId] || 0,
      path,
      algo: a.algoName,
      edgeImportances,
    });

    // If OpenAI is configured, we try to enrich explanations while preserving fallback safety.
    const maybeOpenAiExplanation = await maybeEnrichExplanationWithOpenAI({
      algoName: a.algoName,
      problemText,
      path,
      nodesById: graph.nodes.reduce((acc, n) => {
        acc[n.id] = n;
        return acc;
      }, {}),
      edgesByPair,
    });

    outputs[a.key] = {
      path,
      explanation: maybeOpenAiExplanation || explanationMock,
      confidence_score,
    };
  }

  return {
    input: {
      problemText,
      extractedKeywords: keywords,
      matchedKeywordTerms,
      startId,
      goalId,
    },
    graph: graph,
    algorithms: outputs,
    datasetMeta: {
      nodeCount: dataset.nodes.length,
      edgeCount: dataset.edges.length,
      graphNodeCount: graph.nodes.length,
      graphEdgeCount: graph.links.length,
    },
  };
}

module.exports = { analyzeCase };

