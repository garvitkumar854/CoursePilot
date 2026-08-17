const BRACKET_PATTERN = /\[([^\]]*)\]/g;

export const IMPORT_FORMAT_SAMPLE = `[2026-08-01]
[1] [Assignment title] [Optional description]
[2] [Another title] [Optional description]

[2026-08-08]
[3] [Next assignment] [Description]`;

function readBracketSegments(line) {
    BRACKET_PATTERN.lastIndex = 0;

    const segments = [];
    let match = BRACKET_PATTERN.exec(line);

    while (match) {
        segments.push(match[1].trim());
        match = BRACKET_PATTERN.exec(line);
    }

    return segments;
}

function isDateLike(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function isValidIsoDate(value) {
    if (!isDateLike(value)) {
        return false;
    }

    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    );
}

export function formatImportDateLabel(value) {
    if (!isValidIsoDate(value)) {
        return "Unassigned";
    }

    const [year, month, day] = value.split("-").map(Number);

    return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
    }).format(new Date(Date.UTC(year, month - 1, day)));
}

/**
 * Parses the bracketed import format into a flat, ordered assignment list.
 *
 * [2026-08-01]
 * [1] [Assignment title] [Optional description]
 */
export function parseAssignmentFile(rawText) {
    const text = String(rawText ?? "").replace(/\r\n?/g, "\n");
    const lines = text.split("\n");

    const assignments = [];
    const errors = [];

    let currentDate = null;
    let sequence = 0;

    lines.forEach((rawLine, index) => {
        const lineNumber = index + 1;
        const line = rawLine.trim();

        if (!line || line.startsWith("#") || line.startsWith("//")) {
            return;
        }

        const segments = readBracketSegments(line);

        if (!segments.length) {
            errors.push({
                line: lineNumber,
                message: `Line ${lineNumber} is not in the required [bracket] format.`,
            });
            return;
        }

        const withoutBrackets = line.replace(BRACKET_PATTERN, "").trim();

        if (withoutBrackets) {
            errors.push({
                line: lineNumber,
                message: `Line ${lineNumber} has text outside of brackets: "${withoutBrackets}".`,
            });
            return;
        }

        // Date section header: a lone bracket group holding a date.
        if (segments.length === 1 && isDateLike(segments[0])) {
            if (!isValidIsoDate(segments[0])) {
                errors.push({
                    line: lineNumber,
                    message: `Line ${lineNumber} has an invalid date "${segments[0]}". Use YYYY-MM-DD.`,
                });
                return;
            }

            currentDate = segments[0];
            return;
        }

        if (!currentDate) {
            errors.push({
                line: lineNumber,
                message: `Line ${lineNumber} appears before any [YYYY-MM-DD] date section.`,
            });
            return;
        }

        const [numberSegment, titleSegment, ...rest] = segments;
        const parsedNumber = Number(numberSegment);
        const hasLeadingNumber = numberSegment !== "" && Number.isFinite(parsedNumber);

        const title = (hasLeadingNumber ? titleSegment : numberSegment) ?? "";
        const description = (hasLeadingNumber ? rest : [titleSegment, ...rest])
            .filter(Boolean)
            .join(" ")
            .trim();

        if (!title) {
            errors.push({
                line: lineNumber,
                message: `Line ${lineNumber} is missing an assignment title.`,
            });
            return;
        }

        sequence += 1;

        assignments.push({
            key: `import-${lineNumber}-${sequence}`,
            line: lineNumber,
            sequence,
            number: hasLeadingNumber ? parsedNumber : sequence,
            title,
            description,
            assignedDate: currentDate,
        });
    });

    if (!assignments.length && !errors.length) {
        errors.push({ line: 0, message: "No assignments were found in this file." });
    }

    return { assignments, errors };
}

/** Groups a parsed/edited assignment list by date, oldest section first. */
export function groupAssignmentsByDate(assignments) {
    const groups = new Map();

    for (const assignment of assignments) {
        const key = assignment.assignedDate || "unassigned";

        if (!groups.has(key)) {
            groups.set(key, { date: key, label: formatImportDateLabel(key), assignments: [] });
        }

        groups.get(key).assignments.push(assignment);
    }

    return Array.from(groups.values()).sort((left, right) => left.date.localeCompare(right.date));
}

/** Shared validation used by both the preview UI and the bulk API. */
export function validateImportAssignments(assignments) {
    const errors = [];

    if (!Array.isArray(assignments) || !assignments.length) {
        return ["Add at least one assignment before importing."];
    }

    assignments.forEach((assignment, index) => {
        const position = index + 1;

        if (!String(assignment?.title ?? "").trim()) {
            errors.push(`Assignment ${position} needs a title.`);
        }

        if (!isValidIsoDate(String(assignment?.assignedDate ?? ""))) {
            errors.push(`Assignment ${position} needs a valid date (YYYY-MM-DD).`);
        }
    });

    return errors;
}
