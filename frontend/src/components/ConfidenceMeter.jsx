const ALGO_META = {
  dfs: { label: "DFS", color: "bg-cyan-500/20", bar: "bg-cyan-400", ring: "ring-cyan-400/40" },
  bfs: { label: "BFS", color: "bg-brand-500/20", bar: "bg-brand-300", ring: "ring-brand-300/40" },
  ucs: { label: "UCS", color: "bg-violet-500/20", bar: "bg-violet-400", ring: "ring-violet-400/40" },
};

export default function ConfidenceMeter({ algoKey = "bfs", confidence_score = 0 }) {
  const meta = ALGO_META[algoKey] || ALGO_META.bfs;
  const val = Math.max(0, Math.min(1, Number(confidence_score || 0)));
  const pct = Math.round(val * 100);

  return (
    <div className={`rounded-xl border border-white/10 bg-white/5 p-3 ${meta.color}`}>
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-slate-100">{meta.label}</div>
        <div className="text-xs text-slate-200">{pct}%</div>
      </div>
      <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
        <div className={`${meta.bar} h-2`} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2 text-[11px] text-slate-400">
        Confidence is a heuristic based on relevance + path structure (mock dataset).
      </div>
    </div>
  );
}

