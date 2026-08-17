import { NextResponse } from "next/server";

export async function POST() {
    const response = NextResponse.json({ ok: true }, {
        headers: { "Cache-Control": "no-store, max-age=0" },
    });

    response.cookies.set("coursepilot_admin_session", "", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        priority: "high",
        maxAge: 0,
    });

    return response;
}
