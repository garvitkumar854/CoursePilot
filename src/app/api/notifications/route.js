import { NextResponse } from "next/server";
import { getNotifications } from "@/lib/notification-db";

export async function GET() {
    const result = await getNotifications();
    return NextResponse.json(result, {
        headers: {
            "Cache-Control": "no-store, max-age=0",
        },
    });
}
