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

/** Request-deduped subject record. Metadata + page share one Mongo round-trip. */
export const readSubjectBySlug = cache((slug) => getSubjectDetailsBySlug(slug));

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
