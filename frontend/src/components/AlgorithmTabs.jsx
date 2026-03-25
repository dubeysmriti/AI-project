import { motion } from "framer-motion";

const tabs = [
  { key: "dfs", label: "DFS" },
  { key: "bfs", label: "BFS" },
  { key: "ucs", label: "UCS" },
];

export default function AlgorithmTabs({ value, onChange }) {
  const active = value || "bfs";
  return (
    <div className="glass rounded-2xl border border-white/10 p-1">
      <div className="flex gap-1">
        {tabs.map((t) => {
          const isActive = t.key === active;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => onChange?.(t.key)}
              className={[
                "relative flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition",
                isActive ? "text-slate-100" : "text-slate-300 hover:text-slate-100",
              ].join(" ")}
            >
              {isActive && (
                <motion.span
                  layoutId="active-algo-tab"
                  className="absolute inset-0 rounded-xl bg-white/10 ring-1 ring-white/15"
                  aria-hidden="true"
                />
              )}
              <span className="relative">{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

