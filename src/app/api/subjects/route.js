import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { getCourseCatalog } from "@/lib/course-db";
import { getAdminSession } from "@/lib/admin-session";

function slugify(value) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export async function GET() {
    const subjects = await getCourseCatalog();
    return NextResponse.json({ subjects });
}

export async function POST(request) {
    const session = await getAdminSession();

    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { name, accentColor } = await request.json();
    const trimmedName = String(name ?? "").trim();

    if (!trimmedName) {
        return NextResponse.json({ message: "Subject name is required." }, { status: 400 });
    }

    const database = await getDatabase();
    const now = new Date();
    const baseSlug = slugify(trimmedName);
    const subjectCount = await database.collection("subjects").countDocuments({});
    const slug = baseSlug || `subject-${subjectCount + 1}`;
    const existing = await database.collection("subjects").findOne({ slug });
    const finalSlug = existing ? `${slug}-${subjectCount + 1}` : slug;
    const topSubject = await database.collection("subjects").find({}).sort({ order: -1 }).limit(1).toArray();
    const nextOrder = (topSubject[0]?.order ?? 0) + 1;

    const subjectDocument = {
        name: trimmedName,
        slug: finalSlug,
        assignmentCount: 0,
        lastUpdated: now,
        accentColor: String(accentColor ?? "").trim(),
        order: nextOrder,
        createdAt: now,
        updatedAt: now,
    };

    await database.collection("subjects").insertOne(subjectDocument);

    await database.collection("notifications").insertOne({
        title: "Subject created",
        body: `${trimmedName} was added.`,
        type: "subject_created",
        subjectSlug: finalSlug,
        assignmentId: "",
        isRead: false,
        createdAt: now,
        updatedAt: now,
    });

    const subjects = await getCourseCatalog();
    return NextResponse.json({ subjects });
}