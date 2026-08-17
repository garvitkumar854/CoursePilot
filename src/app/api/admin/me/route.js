import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/jwt";

export async function GET() {
    const responseOptions = { headers: { "Cache-Control": "no-store, max-age=0" } };

    try {
        const secret = process.env.JWT_SECRET;
        const cookieStore = await cookies();
        const token = cookieStore.get("coursepilot_admin_session")?.value;

        if (!secret || !token) {
            return NextResponse.json({ user: null }, responseOptions);
        }

        const payload = verifyJwt(token, secret);
        if (!payload || payload.role !== "admin") {
            const response = NextResponse.json({ user: null }, responseOptions);
            response.cookies.set("coursepilot_admin_session", "", {
                httpOnly: true,
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
                path: "/",
                maxAge: 0,
            });
            return response;
        }

        return NextResponse.json(
            {
                user: {
                    id: payload.sub,
                    name: payload.name,
                    username: payload.username,
                    email: payload.email,
                    role: payload.role,
                },
            },
            responseOptions,
        );
    } catch {
        return NextResponse.json({ user: null }, responseOptions);
    }
}
