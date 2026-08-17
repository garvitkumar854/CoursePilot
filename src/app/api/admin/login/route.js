import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { signJwt } from "@/lib/jwt";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 6;
const attempts = global._coursepilotLoginAttempts ?? new Map();
global._coursepilotLoginAttempts = attempts;

function requestKey(request, identifier) {
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const ip = forwarded || request.headers.get("x-real-ip") || "unknown";
    return `${ip}:${identifier.toLowerCase()}`;
}

function rateLimitState(key) {
    const now = Date.now();
    const current = attempts.get(key);

    if (!current || now - current.startedAt > WINDOW_MS) {
        attempts.delete(key);
        return { blocked: false, retryAfter: 0 };
    }

    return {
        blocked: current.count >= MAX_ATTEMPTS,
        retryAfter: Math.max(1, Math.ceil((WINDOW_MS - (now - current.startedAt)) / 1000)),
    };
}

function recordFailure(key) {
    const now = Date.now();
    const current = attempts.get(key);

    if (!current || now - current.startedAt > WINDOW_MS) {
        attempts.set(key, { count: 1, startedAt: now });
        return;
    }

    attempts.set(key, { ...current, count: current.count + 1 });
}

export async function POST(request) {
    const body = await request.json().catch(() => null);
    const normalizedIdentifier = String(body?.identifier ?? "").trim();
    const password = String(body?.password ?? "");
    const rememberMe = body?.rememberMe === true;

    if (!normalizedIdentifier || !password) {
        return NextResponse.json({ message: "Username/email and password are required." }, { status: 400 });
    }

    if (normalizedIdentifier.length > 160 || password.length > 1024) {
        return NextResponse.json({ message: "Invalid credentials." }, { status: 401 });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        return NextResponse.json({ message: "Admin login is not configured." }, { status: 503 });
    }

    const key = requestKey(request, normalizedIdentifier);
    const limit = rateLimitState(key);

    if (limit.blocked) {
        return NextResponse.json(
            { message: "Too many sign-in attempts. Please wait a few minutes and try again." },
            { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
        );
    }

    try {
        const database = await getDatabase();
        const adminUser = await database.collection("users").findOne(
            {
                role: "admin",
                $or: [{ username: normalizedIdentifier }, { email: normalizedIdentifier }],
            },
            { collation: { locale: "en", strength: 2 } },
        );

        if (!adminUser?.password || !(await bcrypt.compare(password, adminUser.password))) {
            recordFailure(key);
            return NextResponse.json({ message: "Invalid credentials." }, { status: 401 });
        }

        attempts.delete(key);

        const user = {
            id: String(adminUser._id),
            name: adminUser.name,
            username: adminUser.username,
            email: adminUser.email,
            role: adminUser.role,
        };

        const persistentSeconds = 60 * 60 * 24 * 30;
        const sessionSeconds = 60 * 60 * 12;
        const token = signJwt(
            {
                sub: user.id,
                role: user.role,
                username: user.username,
                email: user.email,
                name: user.name,
            },
            secret,
            rememberMe ? persistentSeconds : sessionSeconds,
        );

        const response = NextResponse.json({ user, remembered: rememberMe });
        response.headers.set("Cache-Control", "no-store");
        response.cookies.set("coursepilot_admin_session", token, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            priority: "high",
            ...(rememberMe ? { maxAge: persistentSeconds } : {}),
        });

        return response;
    } catch {
        return NextResponse.json({ message: "Login failed. Please try again." }, { status: 500 });
    }
}
