import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";

const COLORS = {
  dfs: "#22d3ee",
  bfs: "#6366f1",
  ucs: "#8b5cf6",
};

function truncate(s, n = 28) {
  if (!s) return "";
  const str = String(s);
  return str.length > n ? `${str.slice(0, n - 1)}…` : str;
}

function makeEdgeKey(source, target) {
  return `${source}::${target}`;
}

function getPathSets(path) {
  const nodeSet = new Set(path || []);
  const edgeSet = new Set();
  if (path && path.length >= 2) {
    for (let i = 0; i < path.length - 1; i++) {
      edgeSet.add(makeEdgeKey(path[i], path[i + 1]));
    }
  }
  return { nodeSet, edgeSet };
}

function nodeFill({ compare, highlightFor, nodeId, setsByAlgo }) {
  if (!compare) return highlightFor.has(nodeId) ? "rgba(34,211,238,0.18)" : "rgba(148,163,184,0.18)";
  // compare mode: pick first matching algorithm for deterministic coloring
  for (const algo of ["dfs", "bfs", "ucs"]) {
    const { nodeSet } = setsByAlgo[algo];
    if (nodeSet.has(nodeId)) return hexToRgba(COLORS[algo], 0.18);
  }
  return "rgba(148,163,184,0.18)";
}

function hexToRgba(hex, a) {
  const h = String(hex).replace("#", "");
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${a})`;
}

export default function GraphViz({
  graph,
  paths,
  mode = "single", // "single" | "compare"
  activeAlgo = "bfs",
}) {
  const svgRef = useRef(null);
  const [layout, setLayout] = useState({ nodes: [], links: graph?.links || [] });

  const { compareSets, activeSets } = useMemo(() => {
    const setsByAlgo = {
      dfs: getPathSets(paths?.dfs?.path),
      bfs: getPathSets(paths?.bfs?.path),
      ucs: getPathSets(paths?.ucs?.path),
    };
    return {
      compareSets: setsByAlgo,
      activeSets: getPathSets(paths?.[activeAlgo]?.path),
    };
  }, [paths, activeAlgo]);

  const size = { w: 900, h: 460 };

  useEffect(() => {
    if (!graph?.nodes?.length) return;

    // Make a stable-ish layout in one shot (no continuous re-render).
    const nodes = graph.nodes.map((n) => ({ ...n }));
    const links = graph.links.map((l) => ({ ...l }));

    const width = size.w;
    const height = size.h;

    // Initialize around a circle.
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.32;
    const angleStep = (2 * Math.PI) / Math.max(1, nodes.length);

    nodes.forEach((n, i) => {
      const a = i * angleStep;
      n.x = centerX + Math.cos(a) * radius;
      n.y = centerY + Math.sin(a) * radius;
      n.vx = 0;
      n.vy = 0;
    });

    const sim = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance((l) => {
            const imp = Number(l.importance || 1);
            // Stronger precedents bring nodes a bit closer.
            return 110 - Math.min(70, imp * 6);
          })
          .strength((l) => {
            const imp = Number(l.importance || 1);
            return 0.15 + Math.min(0.75, imp / 12);
          })
      )
      .force("charge", d3.forceManyBody().strength(-220))
      .force("center", d3.forceCenter(centerX, centerY))
      .force("collide", d3.forceCollide().radius(28));

    // Run ticks to settle.
    sim.stop();
    for (let i = 0; i < 160; i++) sim.tick();

    setLayout({ nodes, links });
  }, [graph]);

  const highlightEdgeSet = mode === "single" ? activeSets.edgeSet : null;
  const highlightNodeSet = mode === "single" ? activeSets.nodeSet : null;

  return (
    <div className="glass w-full overflow-hidden rounded-3xl border border-white/10">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="text-sm font-semibold text-slate-100">Reasoning Graph</div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          {mode === "compare" ? (
            <>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: COLORS.dfs }} /> DFS
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: COLORS.bfs }} /> BFS
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: COLORS.ucs }} /> UCS
              </span>
            </>
          ) : (
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: COLORS[activeAlgo] }} />
              Highlight: {activeAlgo.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${size.w} ${size.h}`}
        className="w-full h-[460px] block"
        role="img"
        aria-label="Legal reasoning graph"
      >
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="10"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(148,163,184,0.35)" />
          </marker>
        </defs>

        {/* Links */}
        {layout.links.map((l, idx) => {
          const edgeKey = makeEdgeKey(l.source, l.target);
          const isHighlighted = mode === "single" ? highlightEdgeSet.has(edgeKey) : false;

          let stroke = "rgba(148,163,184,0.30)";
          let sw = 1.25;
          let alpha = 0.9;

          if (mode === "single") {
            if (isHighlighted) {
              stroke = hexToRgba(COLORS[activeAlgo], 0.95);
              sw = 2.6;
              alpha = 1;
            }
          } else {
            const inEdges = [];
            for (const algo of ["dfs", "bfs", "ucs"]) {
              if (compareSets[algo]?.edgeSet?.has(edgeKey)) inEdges.push(algo);
            }
            if (inEdges.length) {
              const chosen = inEdges[0];
              stroke = hexToRgba(COLORS[chosen], 0.95);
              sw = 2.6;
              alpha = 1;
            }
          }

          return (
            <g key={`${l.source}-${l.target}-${idx}`}>
              <line
                x1={layout.nodes.find((n) => n.id === l.source)?.x || 0}
                y1={layout.nodes.find((n) => n.id === l.source)?.y || 0}
                x2={layout.nodes.find((n) => n.id === l.target)?.x || 0}
                y2={layout.nodes.find((n) => n.id === l.target)?.y || 0}
                stroke={stroke}
                strokeWidth={sw}
                opacity={alpha}
                markerEnd="url(#arrow)"
              >
                <title>
                  {l.citation} | {l.proposition} | importance {l.importance}/10
                </title>
              </line>
            </g>
          );
        })}

        {/* Nodes */}
        {layout.nodes.map((n) => {
          const isHighlighted = mode === "single" ? highlightNodeSet.has(n.id) : false;

          let stroke = "rgba(148,163,184,0.35)";
          let fill = "rgba(148,163,184,0.18)";
          let r = 18;

          if (mode === "single") {
            if (isHighlighted) {
              stroke = hexToRgba(COLORS[activeAlgo], 0.95);
              fill = hexToRgba(COLORS[activeAlgo], 0.20);
              r = 22;
            }
          } else {
            for (const algo of ["dfs", "bfs", "ucs"]) {
              const sets = compareSets[algo];
              if (sets?.nodeSet?.has(n.id)) {
                stroke = hexToRgba(COLORS[algo], 0.95);
                fill = hexToRgba(COLORS[algo], 0.20);
                r = 22;
                break;
              }
            }
          }

          return (
            <g key={n.id} transform={`translate(${n.x || 0}, ${n.y || 0})`} style={{ cursor: "default" }}>
              <circle cx="0" cy="0" r={r} fill={fill} stroke={stroke} strokeWidth="1.5" />
              <title>
                {n.label} ({n.year}) | tags: {n.tags?.slice(0, 5).join(", ")}
              </title>
              <text
                x="0"
                y="5"
                textAnchor="middle"
                fontSize="11"
                fill="rgba(226,232,240,0.92)"
                style={{ pointerEvents: "none" }}
              >
                {truncate(n.label, 14)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

