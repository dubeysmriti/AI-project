import { motion } from "framer-motion";

const OPTIONS = [
  { key: "dfs", label: "DFS" },
  { key: "bfs", label: "BFS" },
  { key: "ucs", label: "UCS" },
];

export default function AlgorithmSelector({ value, onChange }) {
  const activeKey = value || "bfs";
  return (
    <div className="glass rounded-2xl border border-white/10 p-1">
      <div className="flex gap-1">
        {OPTIONS.map((opt) => {
          const active = opt.key === activeKey;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => onChange?.(opt.key)}
              className={[
                "relative flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition",
                active ? "bg-brand-500/25 text-brand-100" : "text-slate-300 hover:text-slate-100",
              ].join(" ")}
            >
              {active && (
                <motion.span
                  layoutId="active-algo-pill"
                  className="absolute inset-0 rounded-xl bg-brand-500/20"
                  aria-hidden="true"
                />
              )}
              <span className="relative">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

