import { motion } from "framer-motion";

export default function LoadingSpinner({ label = "AI thinking..." }) {
  return (
    <div className="flex items-center gap-3">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="h-6 w-6 rounded-full border-2 border-brand-400/50 border-t-brand-300"
      />
      <div className="text-sm text-slate-200">{label}</div>
    </div>
  );
}

