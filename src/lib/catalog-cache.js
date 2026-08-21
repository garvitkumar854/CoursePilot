import "server-only";

import { cache } from "react";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import { getCourseCatalog, getSubjectDetailsBySlug } from "@/lib/course-db";

const CATALOG_TAG = "course-catalog";

const loadCachedCatalog = unstable_cache(
    async () => getCourseCatalog(),
    [CATALOG_TAG],
    { tags: [CATALOG_TAG], revalidate: 60 },
);

/** Request-deduped, cross-request cached catalog for HTML and public GET. */
export const readCourseCatalog = cache(() => loadCachedCatalog());

/**
 * Request-deduped subject record.
 *
 * The root layout already loads (and caches) the whole catalog for the admin
 * provider, so a subject page can be served from that same cached payload
 * instead of issuing a second, sequential `findOne` + `find` pair. Metadata and
 * the page therefore share ONE data read, and opening a subject costs no extra
 * database round-trip. A direct read is only used if the slug is missing from
 * the cached catalog (e.g. a page rendered between a write and a revalidate).
 */
export const readSubjectBySlug = cache(async (slug) => {
    const catalog = await loadCachedCatalog();
    const fromCatalog = catalog.find((subject) => subject.slug === slug);

    return fromCatalog ?? getSubjectDetailsBySlug(slug);
});

export function invalidateCourseCatalog(slug) {
    revalidateTag(CATALOG_TAG, "max");
    revalidatePath("/");
    if (slug) {
        revalidatePath(`/subjects/${slug}`);
    }
}

/** Fresh catalog after a write, plus cache invalidation for the next read. */
export async function catalogJsonResponse(extra = {}, slug) {
    invalidateCourseCatalog(slug);
    const subjects = await getCourseCatalog();
    return NextResponse.json({ subjects, ...extra });
}
