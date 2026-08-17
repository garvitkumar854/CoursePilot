import "server-only";

import { getDatabase } from "@/lib/mongodb";

function toNotificationRecord(notificationDocument) {
    return {
        id: String(notificationDocument._id),
        title: notificationDocument.title,
        body: notificationDocument.body,
        type: notificationDocument.type,
        subjectSlug: notificationDocument.subjectSlug ?? "",
        assignmentId: notificationDocument.assignmentId ? String(notificationDocument.assignmentId) : "",
        createdAt: notificationDocument.createdAt ? new Date(notificationDocument.createdAt).toISOString() : null,
    };
}

export async function getNotifications(limit = 40) {
    try {
        const database = await getDatabase();
        const notificationDocuments = await database
            .collection("notifications")
            .find({})
            .sort({ createdAt: -1 })
            .limit(limit)
            .toArray();

        return {
            notifications: notificationDocuments.map(toNotificationRecord),
            generatedAt: new Date().toISOString(),
        };
    } catch {
        return {
            notifications: [],
            generatedAt: new Date().toISOString(),
        };
    }
}
