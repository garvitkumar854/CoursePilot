"use client";

import { useMemo } from "react";

import SubjectCard from "@/components/subjects/subject-card";
import { useAdmin } from "@/components/admin/admin-provider";

function Capsule({ label, value }) {
  return (
    <span className="inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-[0.72rem] font-medium text-slate-500 shadow-sm sm:h-10 sm:px-4 sm:text-[0.8rem]">
      {label}
      <span className="font-semibold text-slate-900">{value}</span>
    </span>
  );
}

export default function Home() {
  const { isAdmin, openAddSubject, subjects } = useAdmin();

  // Both totals derive from the same live catalog cache that every mutation
  // writes back into, so adding/deleting an assignment updates them instantly.
  const { orderedSubjects, totalAssignments } = useMemo(() => {
    const ordered = subjects.slice().sort((left, right) => left.order - right.order);

    return {
      orderedSubjects: ordered,
      totalAssignments: ordered.reduce((total, subject) => {
        const fromGroups = (subject.dateGroups ?? []).reduce(
          (count, group) => count + (group.assignments?.length ?? 0),
          0,
        );
        return total + (fromGroups || Number(subject.assignmentCount) || 0);
      }, 0),
    };
  }, [subjects]);

  return (
    <main className="min-h-dvh px-2.5 py-4 sm:px-6 sm:py-6 lg:px-8">
      <section
        className="rounded-card mx-auto w-full border border-white/70 bg-(--panel) p-3.5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-7 lg:p-8"
        style={{ maxWidth: 1180 }}
      >
        <div className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div>
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-slate-400 sm:text-[0.7rem]">
              Subjects
            </p>
            <h1 className="mt-2 text-[1.7rem] font-bold tracking-[-0.04em] text-slate-900 sm:mt-2.5 sm:text-4xl">
              CoursePilot
            </h1>
            <p className="mt-2 max-w-2xl text-[0.82rem] font-normal leading-5 text-slate-500 sm:mt-2.5 sm:text-[0.95rem] sm:leading-6">
              Track assignments across subjects, keep the current queue visible, and move from the dashboard to the
              detailed task list in one click.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:items-end">
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <Capsule label="Total Subjects" value={orderedSubjects.length} />
              <Capsule label="Total Assignments" value={totalAssignments} />
            </div>

            {isAdmin ? (
              <button
                type="button"
                onClick={() => openAddSubject()}
                className="inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-full bg-blue-600 px-4 text-[0.82rem] font-semibold tracking-[-0.01em] text-white shadow-[0_12px_26px_rgba(37,99,235,0.2)] transition-transform hover:-translate-y-0.5 active:scale-95 sm:w-auto sm:px-5 sm:text-[0.88rem]"
              >
                Add Subject
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid auto-rows-fr gap-3.5 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
          {orderedSubjects.map((subject, index) => (
            <SubjectCard key={subject.slug} subject={subject} rank={index + 1} />
          ))}
        </div>
      </section>
    </main>
  );
}
