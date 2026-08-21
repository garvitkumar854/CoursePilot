import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { catalogJsonResponse } from "@/lib/catalog-cache";
import { getAdminSession } from "@/lib/admin-session";
import { adminDisplayName } from "@/lib/admin-identity";

export async function GET(_request, { params }) {
    const session = await getAdminSession();

    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const database = await getDatabase();
    const subject = await database.collection("subjects").findOne(
        { slug },
        { projection: { _id: 1 } },
    );

    if (!subject) {
        return NextResponse.json({ message: "Subject not found." }, { status: 404 });
    }

    const latest = await database.collection("assignments").findOne(
        { subjectId: subject._id, isActive: { $ne: false } },
        { sort: { assignmentNumber: -1 }, projection: { assignmentNumber: 1 } },
    );

    return NextResponse.json(
        { nextNumber: (Number(latest?.assignmentNumber) || 0) + 1 },
        { headers: { "Cache-Control": "no-store" } },
    );
}

export async function POST(request, { params }) {
    const session = await getAdminSession();

    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const { title, description, assignedDate } = await request.json();
    const trimmedTitle = String(title ?? "").trim();

    if (!trimmedTitle) {
        return NextResponse.json({ message: "Assignment title is required." }, { status: 400 });
    }

    const database = await getDatabase();
    const now = new Date();
    const subject = await database.collection("subjects").findOne({ slug });

    if (!subject) {
        return NextResponse.json({ message: "Subject not found." }, { status: 404 });
    }

    const [sequence] = await database.collection("assignments").aggregate([
        { $match: { subjectId: subject._id, isActive: { $ne: false } } },
        {
            $group: {
                _id: null,
                maximumOrder: { $max: "$order" },
                maximumNumber: { $max: "$assignmentNumber" },
            },
        },
    ]).toArray();
    const nextIndex = (Number(sequence?.maximumOrder) || 0) + 1;
    const assignmentNumber = (Number(sequence?.maximumNumber) || 0) + 1;

    const author = adminDisplayName(session);

    const insertResult = await database.collection("assignments").insertOne({
        subjectId: subject._id,
        assignmentNumber,
        title: trimmedTitle,
        // Only outer whitespace is trimmed so the author's blank lines and
        // paragraph breaks are stored exactly as typed.
        description: String(description ?? "").trim(),
        assignedDate: assignedDate ? new Date(assignedDate) : now,
        order: nextIndex,
        isActive: true,
        // Audit fields come from the verified server session only.
        createdBy: author,
        updatedBy: author,
        createdAt: now,
        updatedAt: now,
    });

    const nextCount = await database.collection("assignments").countDocuments({
        subjectId: subject._id,
        isActive: { $ne: false },
    });

    await database.collection("subjects").updateOne(
        { _id: subject._id },
        {
            $set: {
                assignmentCount: nextCount,
                lastUpdated: now,
                updatedAt: now,
            },
        },
    );

    await database.collection("notifications").insertOne({
        title: "Assignment created",
        body: `${trimmedTitle} was added to ${subject.name}.`,
        type: "assignment_created",
        subjectSlug: slug,
        assignmentId: String(insertResult.insertedId),
        isRead: false,
        createdAt: now,
        updatedAt: now,
    });

    return catalogJsonResponse({}, slug);
}