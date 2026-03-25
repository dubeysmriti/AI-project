import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const demoProblem =
  "A vendor stopped delivering after a dispute about contract terms. We gave notice to cure, but delivery still failed. What arguments could support breach and remedies?";

export default function Home() {
  return (
    <div className="py-2">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="glass relative overflow-hidden rounded-3xl border-white/10 p-7"
      >
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute -left-20 -bottom-24 h-72 w-72 rounded-full bg-brand-500/10 blur-3xl" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-300" />
            DFS • BFS • UCS over a legal-citation graph
          </div>

          <h1 className="mt-4 text-3xl font-bold leading-tight md:text-5xl">
            AI Legal Case Reasoning Path
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
            Model cases as nodes and legal citations as edges. Explore deep reasoning (DFS), the shortest justification (BFS),
            and the strongest precedent chain (UCS) with confidence signals and exportable results.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/input"
              className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow-glass transition hover:bg-brand-400"
            >
              Start reasoning
            </Link>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-xs font-semibold text-slate-200">Demo prompt</div>
              <div className="mt-1 text-xs leading-5 text-slate-400 line-clamp-3">{demoProblem}</div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

