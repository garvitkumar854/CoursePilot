import { Link } from "react-router-dom";
import { GraduationCap, LogIn, LogOut } from "lucide-react";

import useAuth from "../../hooks/useAuth";
import { useAuthModal } from "../../context/AuthModalContext";
import Button from "../ui/Button";

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const { openLogin } = useAuthModal();

  return (
    <header
      className="sticky top-0 z-50 border-b border-black/5 backdrop-blur-2xl"
      style={{ backgroundColor: "rgba(248, 250, 252, 0.85)" }}
    >
      <div
        className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-6"
        style={{ color: "#172033" }}
      >
        <Link to="/" className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-2xl shadow-lg"
            style={{
              backgroundColor: "#2563eb",
              color: "#f8fafc",
              boxShadow: "0 12px 30px rgba(37, 99, 235, 0.18)",
            }}
          >
            <GraduationCap size={22} />
          </div>

          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              CoursePilot
            </h1>
            <p className="text-xs text-[#64748b]">
              Assignment tracker for students
            </p>
          </div>
        </Link>

        {isAuthenticated ? (
          <Button
            onClick={logout}
            className="border border-[#e2e8f0] bg-white/80 text-[#0f172a] hover:bg-white"
          >
            <LogOut size={18} />
            Logout
          </Button>
        ) : (
          <button
            type="button"
            onClick={openLogin}
            className="inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-[#f8fafc] transition hover:opacity-90"
            style={{ backgroundColor: "#2563eb" }}
          >
            <LogIn size={18} />
            Login
          </button>
        )}
      </div>
    </header>
  );
}
