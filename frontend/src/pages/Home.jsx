import { useState, useEffect, useMemo, useRef } from "react";
import useSWR from "swr";
import api from "../api/axios";
import { fetcher } from "../utils/fetcher";
import Hero from "../components/layout/Hero";
import SubjectCard from "../components/subject/SubjectCard";
import Button from "../components/ui/Button";
import ModalShell from "../components/ui/ModalShell";
import { AnimatePresence } from "motion/react";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import useAuth from "../hooks/useAuth";

const SUBJECT_ACCENT_COLORS = [
  "#2563eb", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b",
  "#14b8a6", "#f97316", "#f43f5e", "#06b6d4", "#6366f1",
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [search, setSearch] = useState("");
  
  // Modals state
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [subjectAccentColor, setSubjectAccentColor] = useState(SUBJECT_ACCENT_COLORS[0]);
  const [editingSubject, setEditingSubject] = useState(null);
  const [subjectToDelete, setSubjectToDelete] = useState(null);
  const [subjectBusy, setSubjectBusy] = useState(false);
  const [subjectFormError, setSubjectFormError] = useState("");
  const hasRestoredScroll = useRef(false);

  const { data: subjects = [], error: swrError, isLoading: loading, mutate } = useSWR("/subjects", fetcher);
  const error = swrError ? "We could not load subjects right now." : "";

  // Scroll position retention
  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem("home_scroll_y", window.scrollY.toString());
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (loading || hasRestoredScroll.current) return;

    hasRestoredScroll.current = true;
    const savedScrollY = sessionStorage.getItem("home_scroll_y");
    if (!savedScrollY) return;

    const targetScroll = parseInt(savedScrollY, 10);
    const frameId = requestAnimationFrame(() => {
      window.scrollTo({ top: targetScroll, behavior: "instant" });
    });

    return () => cancelAnimationFrame(frameId);
  }, [loading]);

  useEffect(() => {
    if (!subjectModalOpen) {
      setSubjectFormError("");
    }
  }, [subjectModalOpen]);

  function openCreateSubject() {
    setEditingSubject(null);
    setSubjectName("");
    setSubjectAccentColor(SUBJECT_ACCENT_COLORS[0]);
    setSubjectFormError("");
    setSubjectModalOpen(true);
  }

  function openEditSubject(subject) {
    setEditingSubject(subject);
    setSubjectName(subject.name);
    setSubjectAccentColor(subject.accentColor || SUBJECT_ACCENT_COLORS[0]);
    setSubjectFormError("");
    setSubjectModalOpen(true);
  }

  function closeSubjectModal() {
    if (subjectBusy) {
      return;
    }
    setSubjectModalOpen(false);
    setEditingSubject(null);
    setSubjectName("");
    setSubjectAccentColor(SUBJECT_ACCENT_COLORS[0]);
    setSubjectFormError("");
  }

  async function handleSubjectSubmit(event) {
    event.preventDefault();
    try {
      setSubjectBusy(true);
      setSubjectFormError("");
      const payload = { name: subjectName, accentColor: subjectAccentColor };
      
      if (editingSubject) {
        await api.put(`/subjects/${editingSubject._id}`, payload);
      } else {
        await api.post("/subjects/create", payload);
      }
      
      await mutate();
      closeSubjectModal();
    } catch (err) {
      setSubjectFormError(
        err?.response?.data?.message || "Could not save subject."
      );
    } finally {
      setSubjectBusy(false);
    }
  }

  function promptDeleteSubject(subject) {
    setSubjectToDelete(subject);
  }

  async function handleDeleteSubject() {
    if (!subjectToDelete) {
      return;
    }
    try {
      setSubjectBusy(true);
      await api.delete(`/subjects/${subjectToDelete._id}`);
      await mutate();
      setSubjectToDelete(null);
    } catch (err) {
      setSubjectFormError(
        err?.response?.data?.message || "Could not delete subject."
      );
      setSubjectToDelete(null);
    } finally {
      setSubjectBusy(false);
    }
  }

  const filteredSubjects = useMemo(() => {
    const s = search.toLowerCase();
    return subjects.filter((subject) => {
      const value = `${subject.name} ${subject.slug}`.toLowerCase();
      return value.includes(s);
    });
  }, [subjects, search]);

  return (
    <>
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <Hero search={search} setSearch={setSearch} />

        <section
          id="subjects"
          className="mt-6 rounded-[28px] sm:rounded-4xl border border-black/6 bg-white/80 p-4 sm:p-6 shadow-[0_20px_60px_rgba(17,24,39,0.06)] backdrop-blur-xl md:p-8"
        >
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-black/45">
                Subjects
              </p>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-sm text-black/50">
                {subjects.length} Subject{subjects.length === 1 ? "" : "s"}
              </p>
              {isAuthenticated ? (
                <Button onClick={openCreateSubject}>Add Subject</Button>
              ) : null}
      
      
            </div>
          </div>

          {error ? (
            <div className="rounded-[28px] border border-dashed border-black/10 bg-black/2 p-10 text-center text-black/60">
              {error}
            </div>
          ) : loading ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="h-52 animate-pulse rounded-[30px] bg-black/5"
                />
              ))}
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-black/10 bg-black/2 p-10 text-center text-black/60">
              No subjects match your search.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredSubjects.map((subject, index) => (
                <div key={subject._id}>
                  <SubjectCard
                    subject={subject}
                    index={index}
                    isAdmin={isAuthenticated}
                    onEdit={openEditSubject}
                    onDelete={promptDeleteSubject}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <AnimatePresence>
        {subjectModalOpen ? (
          <ModalShell
            title={editingSubject ? "Edit subject" : "Add subject"}
            description="Create a new subject card or update the current one."
            onClose={closeSubjectModal}
          >
            <form className="space-y-4" onSubmit={handleSubjectSubmit}>
              <input
                type="text"
                value={subjectName}
                onChange={(event) => setSubjectName(event.target.value)}
                placeholder="Subject name"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 font-medium"
              />
              <fieldset>
                <legend className="mb-2 block text-sm font-semibold text-slate-700">
                  Accent color
                </legend>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Subject accent color">
                  {SUBJECT_ACCENT_COLORS.map((color) => {
                    const selected = subjectAccentColor === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        aria-label={`Use ${color} as the subject accent color`}
                        onClick={() => setSubjectAccentColor(color)}
                        className={`h-8 w-8 rounded-full border-2 transition focus:outline-none focus:ring-4 focus:ring-slate-400/25 ${
                          selected ? "scale-110 border-slate-900 ring-2 ring-slate-900/15" : "border-white hover:scale-105"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    );
                  })}
                </div>
              </fieldset>
              {subjectFormError ? (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {subjectFormError}
                </p>
              ) : null}
        
        
              <div className="flex flex-wrap justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={closeSubjectModal}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={subjectBusy}>
                  {editingSubject ? "Save changes" : "Create subject"}
                </Button>
              </div>
            </form>
          </ModalShell>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {subjectToDelete ? (
          <ConfirmDialog
            title="Delete subject?"
            description={`This will permanently remove ${subjectToDelete.name} and its assignments.`}
            confirmLabel={subjectBusy ? "Deleting..." : "Delete subject"}
            destructive
            onClose={() => setSubjectToDelete(null)}
            onConfirm={handleDeleteSubject}
          />
        ) : null}
      </AnimatePresence>
      
      
    </>
  );
}
