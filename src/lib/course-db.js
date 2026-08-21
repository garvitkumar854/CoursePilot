import "server-only";

import { cache } from "react";
import { getDatabase } from "@/lib/mongodb";
import { subjects as fallbackSubjects } from "@/lib/course-data";
import { formatRelativeFromNow } from "@/lib/relative-time";
import { buildDateGroups, safeDate } from "@/lib/assignment-order";

const subjectFallbackPalette = ["#2563eb", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b", "#14b8a6", "#f97316", "#ef4444"];

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

    return formatRelativeFromNow(date.getTime(), Date.now());
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

function buildSubjectRecord(subjectDocument, assignmentDocuments = []) {
    const accentColor = subjectDocument.accentColor?.trim() || pickFallbackAccent(subjectDocument.order ?? 1);
    const { assignmentRows, dateGroups } = buildDateGroups(assignmentDocuments);

    const lastUpdatedSource = subjectDocument.lastUpdated ?? subjectDocument.updatedAt ?? subjectDocument.createdAt;
    const lastUpdatedDate = safeDate(lastUpdatedSource);
    // Always the live count of active assignments; the stored
    // `assignmentCount` field can drift and is only a cached mirror.
    const assignmentCount = assignmentRows.length;

    return {
        id: String(subjectDocument._id),
        dbId: String(subjectDocument._id),
        order: subjectDocument.order ?? 0,
        slug: subjectDocument.slug,
        name: subjectDocument.name,
        assignmentCount,
        // ISO source of truth so the browser can render an accurate relative
        // value; the string labels are the SSR-safe first paint.
        lastUpdatedAt: lastUpdatedDate ? lastUpdatedDate.toISOString() : null,
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
    updatedAt: 1,
    createdBy: 1,
    updatedBy: 1,
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