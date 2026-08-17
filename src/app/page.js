"use client";

import SubjectCard from "@/components/subjects/subject-card";
import { useAdmin } from "@/components/admin/admin-provider";

export default function Home() {
  const { isAdmin, openAddSubject, subjects } = useAdmin();

  return (
    <main className="min-h-screen px-2.5 py-4 sm:px-6 sm:py-6 lg:px-8">
      <section className="mx-auto w-full rounded-[24px] border border-white/70 bg-(--panel) p-3.5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:rounded-[34px] sm:p-8 lg:p-10" style={{ maxWidth: 1180 }}>
        <div className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div>
            <p className="text-[0.65rem] font-black uppercase tracking-[0.3em] text-slate-400 sm:text-xs sm:tracking-[0.34em]">Subjects</p>
            <h1 className="mt-2 text-[1.75rem] font-black tracking-[-0.065em] text-slate-900 sm:mt-3 sm:text-5xl">
              CoursePilot
            </h1>
            <p className="mt-2.5 max-w-2xl text-[0.82rem] leading-5.5 text-slate-500 sm:mt-3 sm:text-base sm:leading-6">
              Track assignments across subjects, keep the current queue visible, and move from the dashboard to the
              detailed task list in one click.
            </p>
          </div>

          <div className="flex w-full items-center gap-2.5 sm:w-auto sm:gap-3">
            <div className="inline-flex h-9 items-center rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-500 shadow-sm sm:h-10 sm:px-4 sm:text-sm">
              {subjects.length} Subjects
            </div>
            {isAdmin ? (
              <button
                type="button"
                onClick={() => openAddSubject()}
                className="inline-flex h-9 flex-1 cursor-pointer items-center justify-center rounded-full bg-blue-600 px-3 text-xs font-black tracking-[-0.02em] text-white shadow-[0_14px_30px_rgba(37,99,235,0.2)] transition-transform hover:-translate-y-0.5 active:scale-95 sm:h-10 sm:flex-none sm:px-5 sm:text-sm"
              >
                Add Subject
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid auto-rows-fr gap-3.5 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
          {subjects
            .slice()
            .sort((left, right) => left.order - right.order)
            .map((subject, index) => (
              <SubjectCard key={subject.slug} subject={subject} rank={index + 1} />
            ))}
        </div>
      </section>
    </main>
  );
}