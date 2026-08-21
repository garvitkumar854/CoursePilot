/**
 * Pure assignment ordering / numbering pipeline (no server-only imports, so it
 * is directly unit-testable).
 *
 *   raw assignments
 *     -> chronological sort (assignedDate, then stored order, then createdAt, then _id)
 *     -> permanent display sequence 1..N   (oldest = 1)
 *     -> group by calendar day (groups returned oldest -> newest, with a numeric sortKey)
 *
 * The UI chooses the *display* direction from `sortKey`; the numbers are the
 * assignment's chronological identity and never change with the sort toggle.
 */

export function safeDate(value) {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

export function formatGroupLabel(value) {
    const date = safeDate(value);
    if (!date) return "Unassigned";

    return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
    }).format(date);
}

function startOfDayKey(date) {
    // Group by calendar day in UTC: the write routes store `assignedDate` as a
    // UTC midnight instant, so this is stable across server timezones.
    return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function normalizeAssignmentDocument(assignmentDocument, chronologicalNumber) {
    const assignedDate = assignmentDocument.assignedDate ?? assignmentDocument.createdAt ?? null;
    const createdAt = assignmentDocument.createdAt ?? null;
    const updatedAt = assignmentDocument.updatedAt ?? assignmentDocument.createdAt ?? null;

    return {
        id: String(assignmentDocument._id),
        // Continuous chronological sequence (oldest = 1). Derived on every
        // read — never persisted as a second source of truth.
        number: chronologicalNumber,
        order: assignmentDocument.assignmentNumber ?? assignmentDocument.order ?? chronologicalNumber,
        title: assignmentDocument.title ?? `Assignment ${chronologicalNumber}`,
        description: assignmentDocument.description ?? "",
        assignedDate: assignedDate ? new Date(assignedDate).toISOString() : null,
        createdAt: createdAt ? new Date(createdAt).toISOString() : null,
        updatedAt: updatedAt ? new Date(updatedAt).toISOString() : null,
        createdBy: assignmentDocument.createdBy ?? null,
        updatedBy: assignmentDocument.updatedBy ?? assignmentDocument.createdBy ?? null,
        isActive: assignmentDocument.isActive !== false,
    };
}

export function buildDateGroups(assignmentDocuments = []) {
    const chronological = assignmentDocuments
        .filter((assignment) => assignment.isActive !== false)
        .map((assignment) => {
            const assignedDate = safeDate(assignment.assignedDate ?? assignment.createdAt);

            return {
                document: assignment,
                time: assignedDate?.getTime() ?? 0,
                dayKey: assignedDate ? startOfDayKey(assignedDate) : 0,
                order: Number(assignment.order ?? assignment.assignmentNumber ?? 0) || 0,
                createdAt: safeDate(assignment.createdAt)?.getTime() ?? 0,
                id: String(assignment._id ?? ""),
            };
        })
        .sort((left, right) => {
            if (left.dayKey !== right.dayKey) return left.dayKey - right.dayKey;
            if (left.order !== right.order) return left.order - right.order;
            if (left.createdAt !== right.createdAt) return left.createdAt - right.createdAt;
            if (left.time !== right.time) return left.time - right.time;
            return left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
        });

    const groupsByKey = new Map();
    const assignmentRows = [];

    chronological.forEach((entry, index) => {
        const assignment = normalizeAssignmentDocument(entry.document, index + 1);
        assignmentRows.push(assignment);

        const key = String(entry.dayKey);

        if (!groupsByKey.has(key)) {
            groupsByKey.set(key, {
                label: formatGroupLabel(assignment.assignedDate),
                sortKey: entry.dayKey,
                assignments: [],
            });
        }

        groupsByKey.get(key).assignments.push(assignment);
    });

    const dateGroups = Array.from(groupsByKey.values()).sort((left, right) => left.sortKey - right.sortKey);

    return { assignmentRows, dateGroups };
}
