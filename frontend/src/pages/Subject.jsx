import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import api from "../api/axios";
import SubjectHeader from "../components/subject/SubjectHeader";
import AssignmentList from "../components/assignment/AssignmentList";
import SearchInput from "../components/ui/SearchInput";
import Button from "../components/ui/Button";
import ModalShell from "../components/ui/ModalShell";
import useAuth from "../hooks/useAuth";

export default function Subject() {
  const { slug } = useParams();
  const { isAuthenticated } = useAuth();

  const [subject, setSubject] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentDescription, setAssignmentDescription] = useState("");
  const [assignmentDate, setAssignmentDate] = useState("");
  const [assignmentNumber, setAssignmentNumber] = useState(1);
  const [assignmentBusy, setAssignmentBusy] = useState(false);
  const [assignmentError, setAssignmentError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetchSubject();
  }, [slug]);

  useEffect(() => {
    if (!assignmentModalOpen) {
      setAssignmentError("");
    }
  }, [assignmentModalOpen]);

  async function fetchSubject() {
    try {
      setError("");
      const res = await api.get(`/subjects/${slug}`);

      setSubject(res.data.subject);
      setAssignments(res.data.assignments);
    } catch (error) {
      console.error(error);
      setSubject(null);
      setAssignments([]);
      setError("Subject data could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  function openAssignmentModal() {
    setAssignmentNumber(assignments.length + 1);
    setAssignmentTitle("");
    setAssignmentDescription("");
    setAssignmentDate(new Date().toISOString().slice(0, 10));
    setAssignmentError("");
    setAssignmentModalOpen(true);
  }

  function closeAssignmentModal() {
    if (assignmentBusy) {
      return;
    }

    setAssignmentModalOpen(false);
    setAssignmentError("");
  }

  async function handleCreateAssignment(event) {
    event.preventDefault();

    if (!subject) {
      return;
    }

    try {
      setAssignmentBusy(true);
      setAssignmentError("");

      await api.post("/assignments/create", {
        subjectId: subject._id,
        assignmentNumber,
        title: assignmentTitle,
        description: assignmentDescription,
        assignedDate: assignmentDate,
      });

      await fetchSubject();
      closeAssignmentModal();
    } catch (err) {
      setAssignmentError(
        err?.response?.data?.message || "Could not create assignment.",
      );
    } finally {
      setAssignmentBusy(false);
    }
  }

  if (loading) {
    return (
      <>
        <main className="mx-auto max-w-6xl px-6 py-10">
          <div className="rounded-4xl border border-black/6 bg-white/80 p-8 shadow-sm">
            <div className="h-8 w-44 animate-pulse rounded-full bg-black/5" />
            <div className="mt-6 h-12 w-2/3 animate-pulse rounded-2xl bg-black/5" />
            <div className="mt-4 h-4 w-full animate-pulse rounded-full bg-black/5" />
            <div className="mt-8 h-14 w-full animate-pulse rounded-full bg-black/5" />
            <div className="mt-6 space-y-4">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-24 animate-pulse rounded-3xl bg-black/5"
                />
              ))}
            </div>
          </div>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <main className="mx-auto max-w-6xl px-6 py-10">
          <div className="rounded-4xl border border-dashed border-black/10 bg-white/80 p-8 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-[#172033]">
              Unable to load subject
            </h2>
            <p className="mt-2 text-black/60">{error}</p>
            <div className="mt-6">
              <Button onClick={fetchSubject}>Try again</Button>
            </div>
          </div>
        </main>
      </>
    );
  }

  const filteredAssignments = assignments.filter((assignment) =>
    `${assignment.title} ${assignment.description}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  if (!subject) {
    return (
      <>
        <main className="mx-auto max-w-6xl px-6 py-10">
          <div className="rounded-4xl border border-dashed border-black/10 bg-white/80 p-8 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-[#172033]">
              Subject not found
            </h2>
            <p className="mt-2 text-black/60">
              The subject may have been removed.
            </p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <main className="mx-auto max-w-6xl px-6 py-8 sm:py-10">
        <SubjectHeader subject={subject} />

        {isAuthenticated ? (
          <div className="mt-4 flex justify-end sm:mt-5">
            <Button onClick={openAssignmentModal}>Add Assignment</Button>
          </div>
        ) : null}

        <div className="mt-4 sm:mt-5">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assignments"
          />
        </div>

        <div className="mt-4 sm:mt-5">
          <AssignmentList assignments={filteredAssignments} />
        </div>
      </main>

      {assignmentModalOpen ? (
        <ModalShell
          title="Add assignment"
          description={`Create a new assignment under ${subject?.name || "this subject"}.`}
          onClose={closeAssignmentModal}
          maxWidth="max-w-2xl"
        >
          <form className="space-y-4" onSubmit={handleCreateAssignment}>
            <div className="grid gap-4 md:grid-cols-[140px_1fr]">
              <input
                type="number"
                min="1"
                value={assignmentNumber}
                onChange={(event) =>
                  setAssignmentNumber(Number(event.target.value) || 1)
                }
                className="w-full rounded-2xl border border-[#dbe4ee] bg-[#f8fbff] px-4 py-3 text-[#0f172a] outline-none transition focus:border-[#2563eb] focus:bg-white focus:ring-4 focus:ring-[#2563eb]/10"
                placeholder="No."
              />

              <input
                type="text"
                value={assignmentTitle}
                onChange={(event) => setAssignmentTitle(event.target.value)}
                className="w-full rounded-2xl border border-[#dbe4ee] bg-[#f8fbff] px-4 py-3 text-[#0f172a] outline-none transition placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:bg-white focus:ring-4 focus:ring-[#2563eb]/10"
                placeholder="Assignment title"
              />
            </div>

            <textarea
              value={assignmentDescription}
              onChange={(event) => setAssignmentDescription(event.target.value)}
              rows={4}
              className="w-full rounded-[28px] border border-[#dbe4ee] bg-[#f8fbff] px-4 py-3 text-[#0f172a] outline-none transition placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:bg-white focus:ring-4 focus:ring-[#2563eb]/10"
              placeholder="Assignment description"
            />

            <input
              type="date"
              value={assignmentDate}
              onChange={(event) => setAssignmentDate(event.target.value)}
              className="w-full rounded-2xl border border-[#dbe4ee] bg-[#f8fbff] px-4 py-3 text-[#0f172a] outline-none transition focus:border-[#2563eb] focus:bg-white focus:ring-4 focus:ring-[#2563eb]/10"
            />

            {assignmentError ? (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {assignmentError}
              </p>
            ) : null}

            <div className="flex flex-wrap justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={closeAssignmentModal}
              >
                Cancel
              </Button>

              <Button type="submit" disabled={assignmentBusy}>
                Create assignment
              </Button>
            </div>
          </form>
        </ModalShell>
      ) : null}
    </>
  );
}
