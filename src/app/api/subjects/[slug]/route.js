import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import { catalogJsonResponse } from "@/lib/catalog-cache";
import { getAdminSession } from "@/lib/admin-session";

export async function PATCH(request, { params }) {
    const session = await getAdminSession();

    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const { name, accentColor } = await request.json();
    const trimmedName = String(name ?? "").trim();

    if (!trimmedName) {
        return NextResponse.json({ message: "Subject name is required." }, { status: 400 });
    }

    const database = await getDatabase();
    const now = new Date();
    const subject = await database.collection("subjects").findOne({ slug });

    if (!subject) {
        return NextResponse.json({ message: "Subject not found." }, { status: 404 });
    }

    await database.collection("subjects").updateOne(
        { _id: subject._id },
        {
            $set: {
                name: trimmedName,
                accentColor: String(accentColor ?? "").trim(),
                lastUpdated: now,
                updatedAt: now,
            },
        },
    );

    await database.collection("notifications").insertOne({
        title: "Subject updated",
        body: `${trimmedName} details were updated.`,
        type: "subject_updated",
        subjectSlug: slug,
        assignmentId: "",
        isRead: false,
        createdAt: now,
        updatedAt: now,
    });

    return catalogJsonResponse({}, slug);
}

export async function DELETE(_request, { params }) {
    const session = await getAdminSession();

    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const database = await getDatabase();
    const now = new Date();
    const subject = await database.collection("subjects").findOne({ slug });

    if (!subject) {
        return NextResponse.json({ message: "Subject not found." }, { status: 404 });
    }

    await database.collection("subjects").deleteOne({ _id: subject._id });
    await database.collection("assignments").deleteMany({ subjectId: new ObjectId(String(subject._id)) });

    await database.collection("notifications").insertOne({
        title: "Subject deleted",
        body: `${subject.name} and all linked assignments were deleted.`,
        type: "subject_deleted",
        subjectSlug: slug,
        assignmentId: "",
        isRead: false,
        createdAt: now,
        updatedAt: now,
    });

    return catalogJsonResponse({}, slug);
}