import { createContext, useContext, useMemo, useState } from "react";

const AuthModalContext = createContext(null);

export function AuthModalProvider({ children }) {
  const [open, setOpen] = useState(false);

  const value = useMemo(
    () => ({
      open,
      openLogin: () => setOpen(true),
      closeLogin: () => setOpen(false),
    }),
    [open],
  );

  return (
    <AuthModalContext.Provider value={value}>
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);

  if (!context) {
    throw new Error("useAuthModal must be used within AuthModalProvider");
  }

  return context;
}
