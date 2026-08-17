import "server-only";

import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/jwt";

export async function getAdminSession() {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        return null;
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("coursepilot_admin_session")?.value;

    if (!token) {
        return null;
    }

    const payload = verifyJwt(token, secret);

    if (!payload || payload.role !== "admin") {
        return null;
    }

    return payload;
}