import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function SubjectHeader({ subject }) {
  return (
    <div className="mb-6 rounded-[34px] border border-black/6 bg-white/80 p-6 shadow-[0_20px_60px_rgba(17,24,39,0.06)] backdrop-blur-xl md:p-8">
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[#64748b] transition hover:text-[#2563eb]"
      >
        <ArrowLeft size={18} />
        Back to Subjects
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl font-bold tracking-tight text-[#0f172a] md:text-5xl capitalize">
          {subject.name}
        </h1>

        <span className="rounded-full bg-[rgba(100,116,139,0.12)] px-4 py-2 text-sm font-semibold text-[#64748b]">
          Last updated{" "}
          {new Date(
            subject.lastUpdated || subject.updatedAt,
          ).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>

      <div className="mt-4 inline-flex rounded-full border border-[#e2e8f0] bg-white px-4 py-2 text-sm font-semibold text-[#0f172a]">
        Total assignments {subject.assignmentCount}
      </div>
    </div>
  );
}
