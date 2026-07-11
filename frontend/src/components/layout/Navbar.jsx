import { Link } from "react-router-dom";
import { GraduationCap, LogIn, LogOut } from "lucide-react";
import useAuth from "../../hooks/useAuth";
import { useAuthModal } from "../../context/AuthModalContext";

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const { openLogin } = useAuthModal();

  return (
    <header
      className="sticky top-0 z-50 border-b border-black/5 backdrop-blur-2xl bg-white/70 shadow-sm"
    >
      <div
        className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-6"
      >
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative flex h-11 w-11 items-center justify-center">
            {/* Pulsing halo */}
            <div className="absolute inset-0 rounded-2xl bg-[--cp-accent]/20 blur-sm scale-95 group-hover:scale-110 transition-all duration-300" />
            
            {/* Main brand icon body */}
            <div
              className="relative flex h-11 w-11 items-center justify-center rounded-2xl shadow-md bg-gradient-to-tr from-[--cp-accent] via-teal-600 to-emerald-400 text-white border border-white/10 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3"
            >
              <GraduationCap size={22} className="transition-transform duration-300 group-hover:rotate-[-6deg] group-hover:scale-110" />
              
              {/* Pilot Navigation Star / Dot Accent */}
              <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-amber-400 border-2 border-white shadow-sm animate-pulse" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-[--cp-accent] transition-colors duration-200">
              CoursePilot
            </h1>
            <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase text-[10px]">
              Academic Navigator
            </p>
          </div>
        </Link>
        {isAuthenticated ? (
          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-red-600 hover:border-red-200 hover:shadow-sm transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <LogOut size={14} className="sm:w-4 sm:h-4" />
            <span>Logout</span>
          </button>
        ) : (
          <button
            onClick={openLogin}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-6 py-2 sm:py-2.5 rounded-full bg-slate-900 text-xs sm:text-sm font-semibold text-white hover:bg-slate-800 hover:shadow-lg transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <LogIn size={14} className="sm:w-4 sm:h-4" />
            <span><span className="hidden min-[400px]:inline">Admin </span>Login</span>
          </button>
        )}
      </div>
    </header>
  );
}
