import { useEffect, useState } from "react";
import { Eye, EyeOff, X } from "lucide-react";

import api from "../api/axios";
import Button from "../components/ui/Button";
import useAuth from "../hooks/useAuth";

export default function Login({ open = false, onClose }) {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      const { data } = await api.post("/auth/login", {
        email: email.trim(),
        password,
      });

      if (data?.token) {
        login(data.token);
        onClose?.();
      }
    } catch (error) {
      if (error?.response?.status === 401) {
        setError("Invalid credentials. Please check your email and password.");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center px-6 backdrop-blur-xl"
      style={{ backgroundColor: "rgba(23, 32, 51, 0.45)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-[34px] border border-black/6 bg-white/90 p-8 shadow-[0_30px_90px_rgba(17,24,39,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#64748b]">
              Admin access
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#0f172a]">
              Sign in to manage the app.
            </h1>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#64748b] transition hover:bg-black/5 hover:text-[#0f172a]"
            aria-label="Close login dialog"
          >
            <X size={18} />
          </button>
        </div>

        <p className="mt-4 text-sm leading-6 text-[#64748b]">
          Sign in with your admin credentials to add subjects and assignments
          from the dashboard.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#64748b]">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-full border border-[#e2e8f0] bg-white px-4 py-3 outline-none transition focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#64748b]">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-full border border-[#e2e8f0] bg-white px-4 py-3 pr-12 outline-none transition focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10"
                placeholder="Enter your admin password"
              />

              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-[#64748b] transition hover:bg-black/5 hover:text-[#0f172a]"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-[#2563eb]/15 bg-[#2563eb]/8 px-4 py-3 text-sm text-[#0f172a]">
              {error}
            </div>
          ) : null}

          <Button
            type="submit"
            className="w-full bg-[#2563eb] text-[#f8fafc] hover:bg-[#1d4ed8]"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
