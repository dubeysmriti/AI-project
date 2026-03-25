import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";
import GraphViz from "../components/GraphViz.jsx";
import AlgorithmTabs from "../components/AlgorithmTabs.jsx";
import ConfidenceMeter from "../components/ConfidenceMeter.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import { exportElementAsPdf } from "../utils/exportPdf.js";

const STORAGE_KEY = "ai-legal-last-result";

function pickAlgoMeta(key) {
  if (key === "dfs") return { title: "DFS • Deep Legal Reasoning" };
  if (key === "bfs") return { title: "BFS • Shortest Justification Path" };
  return { title: "UCS • Strongest Argument Path" };
}

function safeAlgoOutput(algorithms, key) {
  return algorithms?.[key] || { path: [], explanation: "", confidence_score: 0 };
}

export default function Results() {
  const navigate = useNavigate();
  const location = useLocation();
  const printRef = useRef(null);

  const [payload, setPayload] = useState(location.state || null);
  const [activeAlgo, setActiveAlgo] = useState(location.state?.algoFocus || "bfs");
  const [compareMode, setCompareMode] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (payload) return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setPayload(JSON.parse(raw));
      } catch {
        // ignore
      }
    }
  }, [payload]);

  const result = payload?.result;
  const graph = result?.graph;
  const algorithms = result?.algorithms;

  const nodesById = useMemo(() => {
    const by = {};
    for (const n of graph?.nodes || []) by[n.id] = n;
    return by;
  }, [graph]);

  const paths = useMemo(() => {
    return {
      dfs: safeAlgoOutput(algorithms, "dfs"),
      bfs: safeAlgoOutput(algorithms, "bfs"),
      ucs: safeAlgoOutput(algorithms, "ucs"),
    };
  }, [algorithms]);

  const activeExplanation = safeAlgoOutput(algorithms, activeAlgo);
  const meta = pickAlgoMeta(activeAlgo);

  async function onExportPdf() {
    if (!printRef.current) return;
    setIsExporting(true);
    try {
      await exportElementAsPdf({ element: printRef.current, filename: "ai-legal-case-reasoning.pdf" });
    } finally {
      setIsExporting(false);
    }
  }

  if (!result) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="py-2">
        <div className="glass rounded-3xl border border-white/10 p-6">
          <h2 className="text-xl font-bold">No analysis found</h2>
          <p className="mt-2 text-sm text-slate-300">Run an analysis first.</p>
          <button
            type="button"
            onClick={() => navigate("/input")}
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-400"
          >
            Go to Input
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="py-2">
      <div className="flex flex-col gap-4">
        <div className="glass rounded-3xl border border-white/10 p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm text-slate-400">Analysis</div>
              <h2 className="text-xl font-bold">Reasoning paths with DFS/BFS/UCS</h2>
              <div className="mt-2 text-xs text-slate-400">
                Extracted keywords:{" "}
                <span className="text-slate-200">
                  {(result?.input?.extractedKeywords || []).slice(0, 6).join(", ") || "—"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCompareMode((v) => !v)}
                className={[
                  "rounded-xl px-3 py-2 text-xs font-semibold border transition",
                  compareMode ? "bg-brand-500/15 border-brand-500/30 text-brand-100" : "bg-white/5 border-white/10 text-slate-200",
                ].join(" ")}
              >
                {compareMode ? "Compare: ON" : "Compare: OFF"}
              </button>
              <button
                type="button"
                disabled={isExporting}
                onClick={onExportPdf}
                className={[
                  "rounded-xl px-3 py-2 text-xs font-semibold transition border",
                  "bg-white/5 border-white/10 text-slate-200 hover:bg-white/10",
                  "disabled:opacity-60",
                ].join(" ")}
              >
                {isExporting ? "Exporting..." : "Export PDF"}
              </button>
            </div>
          </div>
        </div>

        <div ref={printRef}>
          <GraphViz
            graph={graph}
            paths={paths}
            mode={compareMode ? "compare" : "single"}
            activeAlgo={activeAlgo}
          />

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <AnimatePresence mode="wait">
              {compareMode ? (
                <>
                  {["dfs", "bfs", "ucs"].map((key) => {
                    const out = safeAlgoOutput(algorithms, key);
                    const nPath = out.path || [];
                    const labelPath = nPath.map((id) => nodesById[id]?.label || id).slice(0, 6);

                    return (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="glass rounded-3xl border border-white/10 p-5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-bold">{pickAlgoMeta(key).title}</div>
                        </div>
                        <div className="mt-3">
                          <ConfidenceMeter algoKey={key} confidence_score={out.confidence_score} />
                        </div>
                        <div className="mt-3 text-xs text-slate-400">
                          Path nodes:{" "}
                          <span className="text-slate-200">{labelPath.join(" → ")}{nPath.length > 6 ? "…" : ""}</span>
                        </div>
                        <pre className="mt-3 whitespace-pre-wrap rounded-2xl border border-white/10 bg-white/5 p-3 text-xs leading-relaxed text-slate-200 max-h-56 overflow-auto">
                          {out.explanation}
                        </pre>
                      </motion.div>
                    );
                  })}
                </>
              ) : (
                <motion.div
                  key="single"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="lg:col-span-3 glass rounded-3xl border border-white/10 p-5"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-sm font-bold">{meta.title}</div>
                      <div className="mt-1 text-xs text-slate-400">
                        Highlighting this path on the graph.
                      </div>
                    </div>
                    <div className="w-full md:w-[320px]">
                      <AlgorithmTabs value={activeAlgo} onChange={setActiveAlgo} />
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <div className="lg:col-span-1">
                      <ConfidenceMeter algoKey={activeAlgo} confidence_score={activeExplanation.confidence_score} />
                      <div className="mt-3 text-xs text-slate-400">
                        Path nodes:{" "}
                        <span className="text-slate-200">
                          {(activeExplanation.path || []).map((id) => nodesById[id]?.label || id).slice(0, 7).join(" → ")}
                        </span>
                      </div>
                    </div>
                    <div className="lg:col-span-2">
                      <pre className="whitespace-pre-wrap rounded-2xl border border-white/10 bg-white/5 p-4 text-xs leading-relaxed text-slate-200 max-h-72 overflow-auto">
                        {activeExplanation.explanation}
                      </pre>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          Mock reasoning graph based on a small sample dataset. For production/legal usage, connect a real legal knowledge base.
        </div>
      </div>
    </motion.div>
  );
}

