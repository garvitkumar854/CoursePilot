import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import { catalogJsonResponse } from "@/lib/catalog-cache";
import { getAdminSession } from "@/lib/admin-session";
import { adminDisplayName } from "@/lib/admin-identity";

/**
 * Applies a full reorder in one shot. The client sends the complete ordered
 * list of assignment ids for the subject, so a batch of drags is committed as
 * a single atomic write instead of one request per swap.
 */
export async function POST(request, { params }) {
    const session = await getAdminSession();

    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const body = await request.json().catch(() => null);
    const orderedIds = Array.isArray(body?.orderedIds) ? body.orderedIds.map(String) : null;

    if (!orderedIds || !orderedIds.length) {
        return NextResponse.json({ message: "An orderedIds array is required." }, { status: 400 });
    }

    if (orderedIds.some((id) => !ObjectId.isValid(id))) {
        return NextResponse.json({ message: "Invalid assignment id in payload." }, { status: 400 });
    }

    if (new Set(orderedIds).size !== orderedIds.length) {
        return NextResponse.json({ message: "Duplicate assignment id in payload." }, { status: 400 });
    }

    const database = await getDatabase();
    const now = new Date();
    const subject = await database.collection("subjects").findOne({ slug });

    if (!subject) {
        return NextResponse.json({ message: "Subject not found." }, { status: 404 });
    }

    const existing = await database
        .collection("assignments")
        .find({ subjectId: subject._id, isActive: { $ne: false } })
        .toArray();

    const existingIds = new Set(existing.map((assignment) => String(assignment._id)));

    // Every id must belong to this subject; reject partial lists so we can
    // never leave the collection with a half-applied ordering.
    if (orderedIds.length !== existingIds.size || orderedIds.some((id) => !existingIds.has(id))) {
        return NextResponse.json(
            { message: "The assignment list is out of date. Refresh and try again." },
            { status: 409 },
        );
    }

    const updatedBy = adminDisplayName(session);

    await database.collection("assignments").bulkWrite(
        orderedIds.map((id, index) => ({
            updateOne: {
                filter: { _id: new ObjectId(id) },
                update: {
                    $set: {
                        order: index + 1,
                        assignmentNumber: index + 1,
                        updatedAt: now,
                        updatedBy,
                    },
                },
            },
        })),
    );

    await database.collection("subjects").updateOne(
        { _id: subject._id },
        { $set: { assignmentCount: orderedIds.length, lastUpdated: now, updatedAt: now } },
    );

    return catalogJsonResponse({}, slug);
}
