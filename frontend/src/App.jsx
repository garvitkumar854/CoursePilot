import { useEffect } from "react";
import { BrowserRouter, Navigate, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";

import Home from "./pages/Home";
import Subject from "./pages/Subject";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import useAuth from "./hooks/useAuth";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import LoginModal from "./pages/Login";
import { AuthModalProvider, useAuthModal } from "./context/AuthModalContext";

function RequireAdmin({ children }) {
  const { isAuthenticated } = useAuth();
  const { openLogin } = useAuthModal();

  useEffect(() => {
    if (!isAuthenticated) {
      openLogin();
    }
  }, [isAuthenticated, openLogin]);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
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

function LoginRedirect() {
  return <Navigate to="/" replace />;
}

const pageVariants = {
  initial: { opacity: 0, y: 15 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -15 }
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.3
};

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route 
          path="/" 
          element={
            <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="h-full">
              <Home />
            </motion.div>
          } 
        />

        <Route 
          path="/subject/:slug" 
          element={
            <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="h-full">
              <Subject />
            </motion.div>
          } 
        />

        <Route 
          path="/privacy" 
          element={
            <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="h-full">
              <PrivacyPolicy />
            </motion.div>
          } 
        />
        <Route 
          path="/terms" 
          element={
            <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="h-full">
              <TermsOfService />
            </motion.div>
          } 
        />

        <Route path="/login" element={<LoginRedirect />} />

        <Route 
          path="*" 
          element={
            <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="h-full">
              <Home />
            </motion.div>
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
          <main className="flex-1">
            <AnimatedRoutes />
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthModalProvider>
  );
}

