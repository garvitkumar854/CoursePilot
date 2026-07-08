import { useEffect, useState } from "react";

import api from "../api/axios";
import Hero from "../components/layout/Hero";
import SubjectCard from "../components/subject/SubjectCard";
import SearchInput from "../components/ui/SearchInput";
import Button from "../components/ui/Button";
import ModalShell from "../components/ui/ModalShell";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import useAuth from "../hooks/useAuth";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [editingSubject, setEditingSubject] = useState(null);
  const [subjectToDelete, setSubjectToDelete] = useState(null);
  const [subjectBusy, setSubjectBusy] = useState(false);
  const [subjectFormError, setSubjectFormError] = useState("");

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (!subjectModalOpen) {
      setSubjectFormError("");
    }
  }, [subjectModalOpen]);

  async function fetchSubjects() {
    try {
      setError("");
      const res = await api.get("/subjects");
      setSubjects(res.data);
    } catch (err) {
      console.error(err);
      setError("We could not load subjects right now.");
    } finally {
      setLoading(false);
    }
  }

  function openCreateSubject() {
    setEditingSubject(null);
    setSubjectName("");
    setSubjectFormError("");
    setSubjectModalOpen(true);
  }

  function openEditSubject(subject) {
    setEditingSubject(subject);
    setSubjectName(subject.name);
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
    setSubjectFormError("");
  }

  async function handleSubjectSubmit(event) {
    event.preventDefault();

    try {
      setSubjectBusy(true);
      setSubjectFormError("");

      const payload = { name: subjectName };

      if (editingSubject) {
        await api.put(`/subjects/${editingSubject._id}`, payload);
      } else {
        await api.post("/subjects/create", payload);
      }

      await fetchSubjects();
      closeSubjectModal();
    } catch (err) {
      setSubjectFormError(
        err?.response?.data?.message || "Could not save subject.",
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
      await fetchSubjects();
      setSubjectToDelete(null);
    } catch (err) {
      setSubjectFormError(
        err?.response?.data?.message || "Could not delete subject.",
      );
      setSubjectToDelete(null);
    } finally {
      setSubjectBusy(false);
    }
  }

  const filteredSubjects = subjects.filter((subject) => {
    const value = `${subject.name} ${subject.slug}`.toLowerCase();
    return value.includes(search.toLowerCase());
  });

  return (
    <>
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Hero />

        <section
          id="subjects"
          className="mt-10 rounded-4xl border border-black/6 bg-white/80 p-6 shadow-[0_20px_60px_rgba(17,24,39,0.06)] backdrop-blur-xl md:p-8"
        >
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-black/45">
                Subjects
              </p>
            </div>

            <div className="flex items-center gap-3">
              <p className="text-sm text-black/50">
                {subjects.length} subject{subjects.length === 1 ? "" : "s"}
              </p>

              {isAuthenticated ? (
                <Button onClick={openCreateSubject}>Add Subject</Button>
              ) : null}
            </div>
          </div>

          <SearchInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by subject name or slug"
          />

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
                <SubjectCard
                  key={subject._id}
                  subject={subject}
                  index={index}
                  isAdmin={isAuthenticated}
                  onEdit={openEditSubject}
                  onDelete={promptDeleteSubject}
                />
              ))}
            </div>
          )}
        </section>
      </main>

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
              className="w-full rounded-2xl border border-[#dbe4ee] bg-[#f8fbff] px-4 py-3 text-[#0f172a] outline-none transition placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:bg-white focus:ring-4 focus:ring-[#2563eb]/10"
            />

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
    </>
  );
}
