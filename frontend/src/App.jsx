import { useEffect, useRef, lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";

const Home = lazy(() => import("./pages/Home"));
const Subject = lazy(() => import("./pages/Subject"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import LoginModal from "./pages/Login";
import { AuthModalProvider, useAuthModal } from "./context/AuthModalContext";

// A short fade and lift keeps navigation clear without a jarring directional spring.
const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.12, ease: "easeOut" },
  },
};
// ✅ Reusable PageWrapper — no more repeated motion.div on every route
function PageWrapper({ children }) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className="h-full"
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  );
}

// ✅ Simple 404 page — no separate file needed
function NotFound() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-20 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
      >
        <p className="text-8xl font-extrabold text-slate-200 select-none">
          404
        </p>
        <h2 className="mt-4 text-2xl font-bold text-slate-800">
          Page not found
        </h2>
        <p className="mt-2 text-slate-500">
          The page you are looking for does not exist.
        </p>
        <motion.a
          href="/"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-[#2563eb] px-6 py-3 text-sm font-semibold text-white hover:bg-[#1d4ed8] transition-colors"
        >
          Go Home
        </motion.a>
      </motion.div>
    </main>
  );
}

function AppShell() {
  const { open, closeLogin } = useAuthModal();

  return (
    <>
      <Navbar />
      <LoginModal open={open} onClose={closeLogin} />
    </>
  );
}

// ✅ Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (prevPathname.current !== pathname) {
      window.scrollTo({ top: 0, behavior: "instant" });
      prevPathname.current = pathname;
    }
  }, [pathname]);

  return null;
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <PageWrapper>
              <Home />
            </PageWrapper>
          }
        />
        <Route
          path="/subject/:slug"
          element={
            <PageWrapper>
              <Subject />
            </PageWrapper>
          }
        />
        <Route
          path="/privacy"
          element={
            <PageWrapper>
              <PrivacyPolicy />
            </PageWrapper>
          }
        />
        <Route
          path="/terms"
          element={
            <PageWrapper>
              <TermsOfService />
            </PageWrapper>
          }
        />

        {/* ✅ /login redirects to home — login is a modal */}
        <Route path="/login" element={<Navigate to="/" replace />} />

        {/* ✅ Proper 404 page */}
        <Route
          path="*"
          element={
            <PageWrapper>
              <NotFound />
            </PageWrapper>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AuthModalProvider>
      <BrowserRouter>
        <div className="flex min-h-screen flex-col bg-slate-50/50">
          <AppShell />
          <ScrollToTop />
          <main className="flex-1">
            <Suspense fallback={
              <div className="flex min-h-[50vh] w-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2563eb] border-t-transparent"></div>
              </div>
            }>
              <AnimatedRoutes />
            </Suspense>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthModalProvider>
  );
}