import { useEffect, useState } from "react";

import { AUTH_TOKEN_KEY } from "../utils/constants";

function getCookie(name) {
    if (typeof window === "undefined") return "";
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    if (match) return decodeURIComponent(match[2]);
    return "";
}

function setCookie(name, value, days) {
    if (typeof window === "undefined") return;
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + encodeURIComponent(value || "") + expires + "; path=/; SameSite=Strict";
}

function eraseCookie(name) {
    if (typeof window === "undefined") return;
    document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict';
}

function readToken() {
    if (typeof window === "undefined") {
        return "";
    }

    // Try cookie first
    const cookieToken = getCookie("auth_token");
    if (cookieToken) return cookieToken;

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

    const login = (nextToken, remember = false) => {
        if (remember) {
            window.localStorage.setItem(AUTH_TOKEN_KEY, nextToken);
            setCookie("auth_token", nextToken, 30); // Save for 30 days
        } else {
            window.localStorage.removeItem(AUTH_TOKEN_KEY); // Session only, clear localStorage
            setCookie("auth_token", nextToken); // Session cookie (expires on close)
        }
        globalToken = nextToken;
        updateListeners();
    };

    const logout = () => {
        window.localStorage.removeItem(AUTH_TOKEN_KEY);
        eraseCookie("auth_token");
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

