import { readCourseCatalog } from "@/lib/catalog-cache";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://coursepilot.app").replace(/\/$/, "");

export default async function sitemap() {
    const subjects = await readCourseCatalog();
    const now = new Date();

    return [
        {
            url: siteUrl,
            lastModified: now,
            changeFrequency: "daily",
            priority: 1,
        },
        ...subjects.map((subject) => ({
            url: `${siteUrl}/subjects/${encodeURIComponent(subject.slug)}`,
            lastModified: now,
            changeFrequency: "daily",
            priority: 0.8,
        })),
    ];
}
