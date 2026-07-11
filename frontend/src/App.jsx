import { useEffect } from "react";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";

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

export default function App() {
  return (
    <AuthModalProvider>
      <BrowserRouter>
        <div className="flex min-h-screen flex-col bg-slate-50/50">
          <AppShell />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />

              <Route path="/subject/:slug" element={<Subject />} />

              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />

              <Route path="/login" element={<LoginRedirect />} />

              <Route path="*" element={<Home />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthModalProvider>
  );
}
