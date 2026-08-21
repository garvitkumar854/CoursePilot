/**
 * Human-readable label for the authenticated admin, taken ONLY from the
 * verified JWT session payload. Client-supplied names are never trusted for
 * audit fields (`createdBy` / `updatedBy`).
 */
export function adminDisplayName(session) {
    if (!session) {
        return "admin";
    }

    return (
        session.name?.trim() ||
        session.username?.trim() ||
        session.email?.trim() ||
        "admin"
    );
}
