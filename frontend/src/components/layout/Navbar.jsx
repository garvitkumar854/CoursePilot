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
          <div
            className="flex h-11 w-11 items-center justify-center rounded-2xl shadow-lg bg-gradient-to-r from-blue-600 to-indigo-500 text-white transition-transform group-hover:scale-105"
          >
            <GraduationCap size={22} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
              CoursePilot
            </h1>
            <p className="text-xs font-medium text-slate-500">
              Assignment tracker
            </p>
          </div>
        </Link>
        {isAuthenticated ? (
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-red-600 hover:border-red-200 hover:shadow-sm transition-all cursor-pointer"
          >
            <LogOut size={16} />
            Logout
          </button>
        ) : (
          <button
            onClick={openLogin}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-slate-900 text-sm font-semibold text-white hover:bg-slate-800 hover:shadow-lg transition-all cursor-pointer"
          >
            <LogIn size={16} />
            Admin Login
          </button>
        )}
      </div>
    </header>
  );
}
