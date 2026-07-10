import { useEffect, useState } from "react";

import { AUTH_TOKEN_KEY } from "../utils/constants";

function readToken() {
    if (typeof window === "undefined") {
        return "";
    }

    return window.localStorage.getItem(AUTH_TOKEN_KEY) || "";
}

let globalToken = readToken();
const listeners = new Set();

const updateListeners = () => {
    listeners.forEach((listener) => listener(globalToken));
};

export default function useAuth() {
    const [token, setToken] = useState(globalToken);

    useEffect(() => {
        listeners.add(setToken);

        const handleStorage = () => {
            const nextToken = readToken();
            if (nextToken !== globalToken) {
                globalToken = nextToken;
                updateListeners();
            }
        };

        window.addEventListener("storage", handleStorage);

        return () => {
            listeners.delete(setToken);
            window.removeEventListener("storage", handleStorage);
        };
    }, []);

    const login = (nextToken) => {
        window.localStorage.setItem(AUTH_TOKEN_KEY, nextToken);
        globalToken = nextToken;
        updateListeners();
    };

    const logout = () => {
        window.localStorage.removeItem(AUTH_TOKEN_KEY);
        globalToken = "";
        updateListeners();
    };

    return {
        token,
        isAuthenticated: Boolean(token),
        login,
        logout,
    };
}

