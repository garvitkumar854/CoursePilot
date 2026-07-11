import { Link, useLocation } from "react-router-dom";
import { GraduationCap, LogIn, LogOut } from "lucide-react";
import { motion, useScroll, useTransform } from "motion/react";
import useAuth from "../../hooks/useAuth";
import { useAuthModal } from "../../context/AuthModalContext";
import NotificationBell from "./NotificationBell";

// ✅ Entrance animation variants
const navVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 22,
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
};

// ✅ Button hover variants
const buttonVariants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.03,
    transition: { type: "spring", stiffness: 400, damping: 20 },
  },
  tap: {
    scale: 0.95,
    transition: { type: "spring", stiffness: 500, damping: 25 },
  },
};

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const { openLogin } = useAuthModal();
  const location = useLocation();

  // ✅ Scroll-aware — navbar shrinks slightly on scroll
  const { scrollY } = useScroll();
  const navbarHeight = useTransform(scrollY, [0, 100], [80, 64]);
  const shadowOpacity = useTransform(scrollY, [0, 50], [1, 0.6]);

  return (
    <motion.header
      variants={navVariants}
      initial="hidden"
      animate="visible"
      style={{ height: navbarHeight }}
      className="sticky top-0 z-50 border-b border-black/5 backdrop-blur-2xl bg-white/70 shadow-sm"
    >
      <motion.div
        style={{ opacity: shadowOpacity }}
        className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-6"
      >
        {/* ✅ Logo */}
        <motion.div variants={itemVariants}>
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative flex h-11 w-11 items-center justify-center">
              {/* Pulsing halo */}
              <motion.div
                className="absolute inset-0 rounded-2xl bg-[--cp-accent]/20 blur-sm"
                style={{ scale: 0.95 }}
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              />

              {/* Main brand icon */}
              <motion.div
                className="relative flex h-11 w-11 items-center justify-center rounded-2xl shadow-md bg-gradient-to-tr from-[--cp-accent] via-teal-600 to-emerald-400 text-white border border-white/10"
                whileHover={{ scale: 1.05, rotate: 3 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <GraduationCap
                  size={22}
                  className="transition-transform duration-300 group-hover:rotate-[-6deg] group-hover:scale-110"
                />

                {/* Notification dot */}
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.8, 1, 0.8],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-amber-400 border-2 border-white shadow-sm"
                />
              </motion.div>
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
        </motion.div>

        {/* ✅ Actions */}
        <motion.div
          variants={itemVariants}
          className="flex items-center gap-3"
        >
          <NotificationBell />

          {isAuthenticated ? (
            <motion.button
              variants={buttonVariants}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
              onClick={logout}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-red-600 hover:border-red-200 hover:shadow-sm transition-all whitespace-nowrap shrink-0"
            >
              <LogOut size={14} className="sm:w-4 sm:h-4" />
              <span>Logout</span>
            </motion.button>
          ) : (
            <motion.button
              variants={buttonVariants}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
              onClick={openLogin}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-6 py-2 sm:py-2.5 rounded-full bg-slate-900 text-xs sm:text-sm font-semibold text-white hover:bg-slate-800 hover:shadow-lg transition-all whitespace-nowrap shrink-0"
            >
              <LogIn size={14} className="sm:w-4 sm:h-4" />
              <span>
                <span className="hidden min-[400px]:inline">Admin </span>Login
              </span>
            </motion.button>
          )}
        </motion.div>
      </motion.div>
    </motion.header>
  );
}