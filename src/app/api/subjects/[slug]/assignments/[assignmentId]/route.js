import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import { getCourseCatalog } from "@/lib/course-db";
import { getAdminSession } from "@/lib/admin-session";

function parseAssignmentId(value) {
    if (!ObjectId.isValid(value)) {
        return null;
    }

    return new ObjectId(value);
}

export async function DELETE(_request, { params }) {
    const session = await getAdminSession();

    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { slug, assignmentId } = await params;
    const objectId = parseAssignmentId(assignmentId);

    if (!objectId) {
        return NextResponse.json({ message: "Invalid assignment id." }, { status: 400 });
    }

    const database = await getDatabase();
    const now = new Date();
    const subject = await database.collection("subjects").findOne({ slug });

    if (!subject) {
        return NextResponse.json({ message: "Subject not found." }, { status: 404 });
    }

    const assignment = await database.collection("assignments").findOne({ _id: objectId, subjectId: subject._id });

    if (!assignment) {
        return NextResponse.json({ message: "Assignment not found." }, { status: 404 });
    }

    await database.collection("assignments").deleteOne({ _id: objectId });

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
        title: "Assignment deleted",
        body: `${assignment.title} was removed from ${subject.name}.`,
        type: "assignment_deleted",
        subjectSlug: slug,
        assignmentId,
        isRead: false,
        createdAt: now,
        updatedAt: now,
    });

    const subjects = await getCourseCatalog();
    return NextResponse.json({ subjects });
}

export async function PATCH(request, { params }) {
    const session = await getAdminSession();

    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { slug, assignmentId } = await params;
    const { direction } = await request.json();
    const objectId = parseAssignmentId(assignmentId);

    if (!objectId || ![-1, 1].includes(Number(direction))) {
        return NextResponse.json({ message: "Invalid reorder payload." }, { status: 400 });
    }

    const database = await getDatabase();
    const now = new Date();
    const subject = await database.collection("subjects").findOne({ slug });

    if (!subject) {
        return NextResponse.json({ message: "Subject not found." }, { status: 404 });
    }

    const assignment = await database.collection("assignments").findOne({ _id: objectId, subjectId: subject._id, isActive: { $ne: false } });

    if (!assignment) {
        return NextResponse.json({ message: "Assignment not found." }, { status: 404 });
    }

    const neighbor = await database
        .collection("assignments")
        .find({
            subjectId: subject._id,
            isActive: { $ne: false },
            order: Number(direction) > 0 ? { $gt: assignment.order } : { $lt: assignment.order },
        })
        .sort({ order: Number(direction) > 0 ? 1 : -1 })
        .limit(1)
        .toArray();

    if (neighbor[0]) {
        await Promise.all([
            database.collection("assignments").updateOne(
                { _id: assignment._id },
                {
                    $set: {
                        order: neighbor[0].order,
                        updatedAt: now,
                        updatedBy: session.username ?? session.email ?? "admin",
                    },
                },
            ),
            database.collection("assignments").updateOne(
                { _id: neighbor[0]._id },
                {
                    $set: {
                        order: assignment.order,
                        updatedAt: now,
                        updatedBy: session.username ?? session.email ?? "admin",
                    },
                },
            ),
        ]);

        await database.collection("subjects").updateOne(
            { _id: subject._id },
            {
                $set: {
                    lastUpdated: now,
                    updatedAt: now,
                },
            },
        );
    }

    const subjects = await getCourseCatalog();
    return NextResponse.json({ subjects });
}

export async function PUT(request, { params }) {
    const session = await getAdminSession();

    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { slug, assignmentId } = await params;
    const objectId = parseAssignmentId(assignmentId);

    if (!objectId) {
        return NextResponse.json({ message: "Invalid assignment id." }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    const title = String(body?.title ?? "").trim();
    const description = String(body?.description ?? "").trim();
    const assignedDate = String(body?.assignedDate ?? "").trim();

    if (!title) {
        return NextResponse.json({ message: "Assignment title is required." }, { status: 400 });
    }

    if (assignedDate && !/^\d{4}-\d{2}-\d{2}$/.test(assignedDate)) {
        return NextResponse.json({ message: "Assigned date must be YYYY-MM-DD." }, { status: 400 });
    }

    const database = await getDatabase();
    const now = new Date();
    const subject = await database.collection("subjects").findOne({ slug });

    if (!subject) {
        return NextResponse.json({ message: "Subject not found." }, { status: 404 });
    }

    const assignment = await database
        .collection("assignments")
        .findOne({ _id: objectId, subjectId: subject._id, isActive: { $ne: false } });

    if (!assignment) {
        return NextResponse.json({ message: "Assignment not found." }, { status: 404 });
    }

    const update = {
        title,
        description,
        updatedAt: now,
        updatedBy: session.username ?? session.email ?? "admin",
    };

    if (assignedDate) {
        const [year, month, day] = assignedDate.split("-").map(Number);
        update.assignedDate = new Date(Date.UTC(year, month - 1, day));
    }

    await database.collection("assignments").updateOne({ _id: objectId }, { $set: update });

    await database.collection("subjects").updateOne(
        { _id: subject._id },
        { $set: { lastUpdated: now, updatedAt: now } },
    );

    await database.collection("notifications").insertOne({
        title: "Assignment updated",
        body: `${title} was updated in ${subject.name}.`,
        type: "assignment_updated",
        subjectSlug: slug,
        assignmentId,
        isRead: false,
        createdAt: now,
        updatedAt: now,
    });

    const subjects = await getCourseCatalog();
    return NextResponse.json({ subjects });
}
