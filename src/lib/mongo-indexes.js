import "server-only";

/**
 * Idempotent index bootstrap. `createIndex` is a no-op when the spec already
 * exists, so this is safe on every warm instance. Called once per process.
 */
export async function ensureMongoIndexes(database) {
    await Promise.all([
        database.collection("subjects").createIndexes([
            { key: { slug: 1 }, name: "subjects_slug" },
            { key: { order: 1, createdAt: 1 }, name: "subjects_order_created" },
        ]),
        database.collection("assignments").createIndexes([
            {
                key: { subjectId: 1, isActive: 1, assignmentNumber: -1 },
                name: "assignments_subject_active_number",
            },
            {
                key: { subjectId: 1, isActive: 1, order: 1 },
                name: "assignments_subject_active_order",
            },
        ]),
        database.collection("notifications").createIndexes([
            { key: { createdAt: -1 }, name: "notifications_createdAt" },
        ]),
    ]);
}
