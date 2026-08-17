import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { getCourseCatalog } from "@/lib/course-db";
import { getAdminSession } from "@/lib/admin-session";
import { validateImportAssignments } from "@/lib/assignment-import";

function toUtcDate(value) {
    const [year, month, day] = String(value).split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day));
}

export async function POST(request, { params }) {
    const session = await getAdminSession();

    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const body = await request.json().catch(() => null);
    const incoming = Array.isArray(body?.assignments) ? body.assignments : null;

    if (!incoming) {
        return NextResponse.json({ message: "An assignments array is required." }, { status: 400 });
    }

    const validationErrors = validateImportAssignments(incoming);

    if (validationErrors.length) {
        return NextResponse.json({ message: validationErrors[0], errors: validationErrors }, { status: 400 });
    }

    const database = await getDatabase();
    const now = new Date();
    const subject = await database.collection("subjects").findOne({ slug });

    if (!subject) {
        return NextResponse.json({ message: "Subject not found." }, { status: 404 });
    }

    const updatedBy = session.username ?? session.email ?? "admin";

    const documents = incoming.map((assignment, index) => ({
        subjectId: subject._id,
        assignmentNumber: Number(assignment.number) || index + 1,
        title: String(assignment.title).trim(),
        description: String(assignment.description ?? "").trim(),
        assignedDate: toUtcDate(assignment.assignedDate),
        // Temporary order; the whole subject is re-sequenced below.
        order: index + 1,
        isActive: true,
        importedAt: now,
        updatedBy,
        createdAt: now,
        updatedAt: now,
    }));

    await database.collection("assignments").insertMany(documents);

    // Re-sequence every active assignment in the subject: by assigned date, then
    // by the order the rows arrived in the imported file.
    const allAssignments = await database
        .collection("assignments")
        .find({ subjectId: subject._id, isActive: { $ne: false } })
        .toArray();

    allAssignments.sort((left, right) => {
        const leftDate = new Date(left.assignedDate ?? left.createdAt ?? 0).getTime();
        const rightDate = new Date(right.assignedDate ?? right.createdAt ?? 0).getTime();

        if (leftDate !== rightDate) {
            return leftDate - rightDate;
        }

        const leftOrder = left.order ?? left.assignmentNumber ?? 0;
        const rightOrder = right.order ?? right.assignmentNumber ?? 0;

        return leftOrder - rightOrder;
    });

    if (allAssignments.length) {
        await database.collection("assignments").bulkWrite(
            allAssignments.map((assignment, index) => ({
                updateOne: {
                    filter: { _id: assignment._id },
                    update: { $set: { order: index + 1, updatedAt: now } },
                },
            })),
        );
    }

    await database.collection("subjects").updateOne(
        { _id: subject._id },
        {
            $set: {
                assignmentCount: allAssignments.length,
                lastUpdated: now,
                updatedAt: now,
            },
        },
    );

    await database.collection("notifications").insertOne({
        title: "Assignments imported",
        body: `${documents.length} assignment${documents.length === 1 ? "" : "s"} were imported into ${subject.name}.`,
        type: "assignments_imported",
        subjectSlug: slug,
        assignmentId: "",
        isRead: false,
        createdAt: now,
        updatedAt: now,
    });

    const subjects = await getCourseCatalog();
    return NextResponse.json({ subjects, importedCount: documents.length });
}
