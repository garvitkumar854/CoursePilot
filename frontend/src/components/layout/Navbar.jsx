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
            variant="secondary"
            onClick={logout}
            className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer"
          >
            <LogOut size={18} />
            Logout
          </Button>
        ) : (
          <Button
            onClick={openLogin}
            className="shadow-sm shadow-[#2563eb]/10"
          >
            <LogIn size={18} />
            Login
          </Button>
        )}
      </div>
    </header>
  );
}
