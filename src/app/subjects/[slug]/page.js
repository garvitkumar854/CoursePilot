import { notFound } from "next/navigation";
import { readSubjectBySlug } from "@/lib/catalog-cache";
import SubjectDetailClient from "@/components/subjects/subject-detail-client";

export const revalidate = 60;

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const subject = await readSubjectBySlug(slug);

    if (!subject) {
        return {
            title: "Subject not found",
            robots: { index: false, follow: false },
        };
    }

    const description = `View and manage ${subject.assignmentCount} assignment${subject.assignmentCount === 1 ? "" : "s"} for ${subject.name} in CoursePilot.`;

    return {
        title: subject.name,
        description,
        alternates: { canonical: `/subjects/${subject.slug}` },
        openGraph: {
            type: "website",
            url: `/subjects/${subject.slug}`,
            title: `${subject.name} | CoursePilot`,
            description,
        },
        twitter: {
            card: "summary",
            title: `${subject.name} | CoursePilot`,
            description,
        },
    };
}

export default async function SubjectPage({ params }) {
    const { slug } = await params;
    const subject = await readSubjectBySlug(slug);

    if (!subject) notFound();

    return <SubjectDetailClient subject={subject} slug={slug} />;
}
