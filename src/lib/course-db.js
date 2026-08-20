import "server-only";

import { cache } from "react";
import { getDatabase } from "@/lib/mongodb";
import { subjects as fallbackSubjects } from "@/lib/course-data";

const subjectFallbackPalette = ["#2563eb", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b", "#14b8a6", "#f97316", "#ef4444"];

function safeDate(value) {
    if (!value) {
        return null;
    }

    const date = value instanceof Date ? value : new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
}

function formatAbsoluteDate(value) {
    const date = safeDate(value);

    if (!date) {
        return "Recently";
    }

    return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(date);
}

function formatRelativeDate(value) {
    const date = safeDate(value);

    if (!date) {
        return "Recently";
    }

    const diffMs = Date.now() - date.getTime();
    const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    if (diffDays === 0) {
        return "Today";
    }

    if (diffDays === 1) {
        return "1 day ago";
    }

    return `${diffDays} days ago`;
}

function formatGroupLabel(value) {
    const date = safeDate(value);

    if (!date) {
        return "Unassigned";
    }

    return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(date);
}

function formatHexToTint(color, fallback = "#2563eb") {
    const hex = (color || fallback).replace("#", "");

    if (hex.length !== 6) {
        return "rgba(37, 99, 235, 0.12)";
    }

    const red = parseInt(hex.slice(0, 2), 16);
    const green = parseInt(hex.slice(2, 4), 16);
    const blue = parseInt(hex.slice(4, 6), 16);

    return `rgba(${red}, ${green}, ${blue}, 0.12)`;
}

function pickFallbackAccent(order) {
    return subjectFallbackPalette[(order - 1) % subjectFallbackPalette.length] ?? subjectFallbackPalette[0];
}

function normalizeAssignmentDocument(assignmentDocument, index) {
    const assignedDate = assignmentDocument.assignedDate ?? assignmentDocument.createdAt ?? null;

    return {
        id: String(assignmentDocument._id),
        order: assignmentDocument.assignmentNumber ?? assignmentDocument.order ?? index + 1,
        title: assignmentDocument.title ?? `Assignment ${index + 1}`,
        description: assignmentDocument.description ?? "",
        assignedDate: assignedDate ? new Date(assignedDate).toISOString() : null,
        isActive: assignmentDocument.isActive !== false,
    };
}

function buildSubjectRecord(subjectDocument, assignmentDocuments = []) {
    const accentColor = subjectDocument.accentColor?.trim() || pickFallbackAccent(subjectDocument.order ?? 1);
    const assignmentRows = assignmentDocuments
        .filter((assignment) => assignment.isActive !== false)
        .sort((left, right) => {
            const leftOrder = left.assignmentNumber ?? left.order ?? 0;
            const rightOrder = right.assignmentNumber ?? right.order ?? 0;

            if (leftOrder !== rightOrder) {
                return leftOrder - rightOrder;
            }

            const leftDate = safeDate(left.assignedDate ?? left.createdAt)?.getTime() ?? 0;
            const rightDate = safeDate(right.assignedDate ?? right.createdAt)?.getTime() ?? 0;

            return leftDate - rightDate;
        })
        .map((assignment, index) => normalizeAssignmentDocument(assignment, index));

    const groupsByLabel = new Map();

    for (const assignment of assignmentRows) {
        const label = formatGroupLabel(assignment.assignedDate);
        const sortKey = safeDate(assignment.assignedDate)?.getTime() ?? 0;

        if (!groupsByLabel.has(label)) {
            groupsByLabel.set(label, {
                label,
                sortKey,
                assignments: [],
            });
        }

        groupsByLabel.get(label).assignments.push(assignment);
    }

    const dateGroups = Array.from(groupsByLabel.values())
        .sort((left, right) => right.sortKey - left.sortKey)
        .map((group) => ({
            label: group.label,
            assignments: group.assignments.sort((left, right) => left.order - right.order),
        }));

    const lastUpdatedSource = subjectDocument.lastUpdated ?? subjectDocument.updatedAt ?? subjectDocument.createdAt;
    const assignmentCount = subjectDocument.assignmentCount ?? assignmentRows.length;

    return {
        id: String(subjectDocument._id),
        dbId: String(subjectDocument._id),
        order: subjectDocument.order ?? 0,
        slug: subjectDocument.slug,
        name: subjectDocument.name,
        assignmentCount,
        lastUpdatedLabel: formatRelativeDate(lastUpdatedSource),
        lastUpdatedDisplay: formatAbsoluteDate(lastUpdatedSource),
        accentColor,
        tint: formatHexToTint(accentColor),
        summary: subjectDocument.summary ?? "",
        dateGroups,
    };
}

const SUBJECT_PROJECTION = {
    name: 1,
    slug: 1,
    order: 1,
    assignmentCount: 1,
    lastUpdated: 1,
    accentColor: 1,
    summary: 1,
    createdAt: 1,
    updatedAt: 1,
};

const ASSIGNMENT_PROJECTION = {
    subjectId: 1,
    assignmentNumber: 1,
    order: 1,
    title: 1,
    description: 1,
    assignedDate: 1,
    createdAt: 1,
    isActive: 1,
};

export async function getCourseCatalog() {
    try {
        const database = await getDatabase();
        const [subjectDocuments, assignmentDocuments] = await Promise.all([
            database.collection("subjects").find({}, { projection: SUBJECT_PROJECTION }).sort({ order: 1, createdAt: 1 }).toArray(),
            database.collection("assignments").find({ isActive: { $ne: false } }, { projection: ASSIGNMENT_PROJECTION }).sort({ order: 1, assignmentNumber: 1, createdAt: 1 }).toArray(),
        ]);

        const assignmentsBySubjectId = new Map();

        for (const assignmentDocument of assignmentDocuments) {
            const key = String(assignmentDocument.subjectId);

            if (!assignmentsBySubjectId.has(key)) {
                assignmentsBySubjectId.set(key, []);
            }

            assignmentsBySubjectId.get(key).push(assignmentDocument);
        }

        return subjectDocuments.map((subjectDocument) =>
            buildSubjectRecord(subjectDocument, assignmentsBySubjectId.get(String(subjectDocument._id)) ?? []),
        );
    } catch {
        return fallbackSubjects;
    }
}

export const getSubjectDetailsBySlug = cache(async function getSubjectDetailsBySlug(slug) {
    try {
        const database = await getDatabase();
        const subjectDocument = await database.collection("subjects").findOne(
            { slug },
            { projection: SUBJECT_PROJECTION },
        );

        if (!subjectDocument) {
            return fallbackSubjects.find((subject) => subject.slug === slug) ?? null;
        }

        const assignmentDocuments = await database
            .collection("assignments")
            .find(
                { subjectId: subjectDocument._id, isActive: { $ne: false } },
                { projection: ASSIGNMENT_PROJECTION },
            )
            .sort({ order: 1, assignmentNumber: 1, createdAt: 1 })
            .toArray();

        return buildSubjectRecord(subjectDocument, assignmentDocuments);
    } catch {
        return fallbackSubjects.find((subject) => subject.slug === slug) ?? null;
    }
});