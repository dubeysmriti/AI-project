import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AlgorithmSelector from "../components/AlgorithmSelector.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import { analyzeCase } from "../utils/api.js";

const STORAGE_KEY = "ai-legal-last-result";

const SAMPLE_PROBLEM =
  "A supplier stopped delivering after a dispute about contract terms. We sent a notice to cure, but delivery still failed. What arguments support breach and the availability of remedies?";

export default function Input() {
  const navigate = useNavigate();
  const [problemText, setProblemText] = useState(SAMPLE_PROBLEM);
  const [algoFocus, setAlgoFocus] = useState("bfs");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const trimmed = useMemo(() => problemText.trim(), [problemText]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (trimmed.length < 3) {
      setError("Please enter a brief legal problem description.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await analyzeCase({ problemText: trimmed });
      const payload = { result, algoFocus, problemText: trimmed, savedAt: Date.now() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      navigate("/results", { state: payload });
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="py-2"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <div className="flex-1">
          <div className="glass rounded-3xl border border-white/10 p-6">
            <h2 className="text-xl font-bold">Describe the legal issue</h2>
            <p className="mt-2 text-sm text-slate-300">
              The app simulates a legal reasoning graph from a small mock dataset. It is not legal advice.
            </p>

            <form onSubmit={onSubmit} className="mt-6">
              <label className="text-sm font-semibold text-slate-100">Case description</label>
              <textarea
                value={problemText}
                onChange={(e) => setProblemText(e.target.value)}
                rows={8}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-brand-500/30"
                placeholder="Enter the facts and the legal question..."
              />

              <div className="mt-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-100">Algorithm focus</div>
                    <div className="text-xs text-slate-400">Used for the initial highlight on Results.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProblemText(SAMPLE_PROBLEM)}
                    className="text-xs text-brand-200 hover:text-brand-100"
                  >
                    Use demo
                  </button>
                </div>
                <div className="mt-3">
                  <AlgorithmSelector value={algoFocus} onChange={setAlgoFocus} />
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={[
                    "inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold",
                    "bg-brand-500 text-white shadow-glass transition hover:bg-brand-400 disabled:opacity-60 disabled:hover:bg-brand-500",
                  ].join(" ")}
                >
                  {isLoading ? "Analyzing..." : "Analyze case"}
                </button>
                {isLoading ? <LoadingSpinner /> : null}
              </div>

              {error ? <div className="mt-4 text-sm text-rose-300">{error}</div> : null}
            </form>
          </div>
        </div>

        <div className="w-full lg:w-96">
          <div className="glass rounded-3xl border border-white/10 p-5">
            <div className="text-sm font-semibold text-slate-100">What you get</div>
            <div className="mt-3 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs font-semibold text-slate-200">Graph of legal reasoning</div>
                <div className="mt-1 text-xs text-slate-400">Nodes = mock cases, edges = citations/precedents.</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs font-semibold text-slate-200">3 traversal strategies</div>
                <div className="mt-1 text-xs text-slate-400">DFS (deep), BFS (shortest), UCS (weighted strength).</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs font-semibold text-slate-200">Explain + confidence</div>
                <div className="mt-1 text-xs text-slate-400">Step-by-step explanation and confidence meter per algorithm.</div>
              </div>
            </div>
          </div>

          <div className="mt-4 text-xs text-slate-500">
            Endpoint: `POST /analyze-case` on the backend (mock knowledge base).
          </div>
        </div>
      </div>
    </motion.div>
  );
}

