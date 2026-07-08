import { useEffect } from "react";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Subject from "./pages/Subject";
import useAuth from "./hooks/useAuth";
import Navbar from "./components/layout/Navbar";
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
        <AppShell />
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/subject/:slug" element={<Subject />} />

          <Route path="/login" element={<LoginRedirect />} />

          <Route path="*" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </AuthModalProvider>
  );
}
