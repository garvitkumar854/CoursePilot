import { useEffect, useState } from "react";

import { AUTH_TOKEN_KEY } from "../utils/constants";

function readToken() {
    if (typeof window === "undefined") {
        return "";
    }

    return window.localStorage.getItem(AUTH_TOKEN_KEY) || "";
}

export default function useAuth() {
    const [token, setToken] = useState(readToken());

    useEffect(() => {
        const handleStorage = () => {
            setToken(readToken());
        };

        window.addEventListener("storage", handleStorage);

        return () => window.removeEventListener("storage", handleStorage);
    }, []);

    const login = (nextToken) => {
        window.localStorage.setItem(AUTH_TOKEN_KEY, nextToken);
        setToken(nextToken);
    };

    const logout = () => {
        window.localStorage.removeItem(AUTH_TOKEN_KEY);
        setToken("");
    };

    return {
        token,
        isAuthenticated: Boolean(token),
        login,
        logout,
    };
}
