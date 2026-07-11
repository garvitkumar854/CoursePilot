import { Link } from "react-router-dom";
import { BookOpen, Github, GraduationCap, Heart, Terminal } from "lucide-react";

export default function Footer() {
  return (
    <footer id="app-footer" className="w-full bg-slate-900 text-slate-400 border-t border-slate-800">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 text-white shadow-lg shadow-teal-500/20">
                <GraduationCap size={18} />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                CoursePilot
              </span>
            </div>
            <p className="max-w-md text-xs sm:text-sm text-slate-400 leading-relaxed">
              Elevating academic organization. CoursePilot helps you plan subject tracks, structure recurring assignments, and stay pilot-focused on your educational milestone deadlines.
            </p>
          </div>

          {/* Links Column */}
          <div className="mt-8 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                  Navigation
                </h3>
                <ul className="mt-4 space-y-2">
                  <li>
                    <a href="/" className="text-xs text-slate-400 hover:text-white hover:underline transition-colors">
                      Home
                    </a>
                  </li>
                  <li>
                    <a href="/#subjects-anchor" className="text-xs text-slate-400 hover:text-white hover:underline transition-colors">
                      Subjects
                    </a>
                  </li>
                </ul>
              </div>
              <div className="mt-8 md:mt-0">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                  Legal
                </h3>
                <ul className="mt-4 space-y-2">
                  <li>
                    <Link to="/privacy" className="text-xs text-slate-400 hover:text-white hover:underline transition-colors">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link to="/terms" className="text-xs text-slate-400 hover:text-white hover:underline transition-colors">
                      Terms of Service
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col items-start justify-between sm:items-end">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                  Developer Platform
                </h3>
                <div className="mt-4 flex gap-4">
                  <a
                    href="https://github.com/garvitkumar854"
                    target="_blank"
                    referrerPolicy="no-referrer"
                    className="rounded-lg bg-slate-800 p-2 text-slate-400 hover:text-white hover:bg-slate-700 transition"
                  >
                    <Github size={16} />
                  </a>
                  <div
                    className="rounded-lg bg-slate-800 p-2 text-slate-400"
                    title="API Server Status: Connected"
                  >
                    <Terminal size={16} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-8 h-px bg-slate-800" />

        {/* Bottom Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} CoursePilot. Crafted with{" "}
            <Heart size={10} className="inline text-rose-500 fill-rose-500" /> for academic excellence.
          </p>

          <div className="flex items-center gap-2 rounded-full bg-slate-800/60 border border-slate-700/50 px-3.5 py-1 text-[11px] font-mono font-medium text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Version 26.7.5</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
