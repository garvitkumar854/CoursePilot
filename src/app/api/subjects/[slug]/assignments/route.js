import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { getCourseCatalog } from "@/lib/course-db";
import { getAdminSession } from "@/lib/admin-session";

export async function POST(request, { params }) {
    const session = await getAdminSession();

    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const { number, title, description, assignedDate } = await request.json();
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

    const latest = await database
        .collection("assignments")
        .find({ subjectId: subject._id, isActive: { $ne: false } })
        .sort({ order: -1, assignmentNumber: -1 })
        .limit(1)
        .toArray();
    const nextIndex = (latest[0]?.order ?? latest[0]?.assignmentNumber ?? 0) + 1;
    const assignmentNumber = Number(number) || nextIndex;

    const insertResult = await database.collection("assignments").insertOne({
        subjectId: subject._id,
        assignmentNumber,
        title: trimmedTitle,
        description: String(description ?? "").trim(),
        assignedDate: assignedDate ? new Date(assignedDate) : now,
        order: nextIndex,
        isActive: true,
        updatedBy: session.username ?? session.email ?? "admin",
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

    const subjects = await getCourseCatalog();
    return NextResponse.json({ subjects });
}