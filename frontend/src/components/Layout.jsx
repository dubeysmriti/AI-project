import { Link, NavLink } from "react-router-dom";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen grain">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-brand-600/30 ring-1 ring-brand-500/40 grid place-items-center">
              <span className="font-mono text-sm text-brand-100">AI</span>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-slate-100">AI Legal Case</div>
              <div className="text-xs text-slate-400">Reasoning Path</div>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-3">
            <NavLink to="/input" className={({ isActive }) => (isActive ? "text-brand-200" : "text-slate-300 hover:text-slate-100")}>
              Input
            </NavLink>
            <NavLink to="/results" className={({ isActive }) => (isActive ? "text-brand-200" : "text-slate-300 hover:text-slate-100")}>
              Results
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 pb-12 pt-6">{children}</main>
      <footer className="mx-auto w-full max-w-6xl px-4 text-xs text-slate-500">
        <div className="mt-8 border-t border-white/10 pt-6">
          Mock dataset and traversal logic for demonstration; not legal advice.
        </div>
      </footer>
    </div>
  );
}

