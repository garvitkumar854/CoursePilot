import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useSWR from "swr";
import api from "../api/axios";
import { fetcher } from "../utils/fetcher";
import useAuth from "../hooks/useAuth";

import SubjectHeader from "../components/subject/SubjectHeader";
import { GooeyInput } from "../components/ui/gooey-input";
import AssignmentList from "../components/assignment/AssignmentList";
import Button from "../components/ui/Button";
import ModalShell from "../components/ui/ModalShell";
import { AnimatePresence } from "motion/react";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import DatePicker from "../components/ui/DatePicker";

export default function Subject() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [search, setSearch] = useState("");

  const { data, error: swrError, isLoading: loading, mutate } = useSWR(`/subjects/${slug}`, fetcher);
  const subject = data?.subject;
  const assignmentsData = data?.assignments || [];
  const error = swrError ? "Unable to load subject." : "";

  const [assignments, setAssignments] = useState([]);
  const [isOrderChanged, setIsOrderChanged] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);

  // Sync SWR data to local state for reordering
  useEffect(() => {
    if (data?.assignments) {
      setAssignments(data.assignments);
    }
  }, [data]);

  // Scroll to top on mount if there is no hash
  useEffect(() => {
    if (!window.location.hash) {
      window.scrollTo(0, 0);
    }
  }, []);

  // Automatic scroll and glow for target assignment on load
  useEffect(() => {
    if (!loading && assignments.length > 0 && window.location.hash) {
      const targetId = window.location.hash.substring(1);
      const element = document.getElementById(targetId);
      if (element) {
        const timerId = setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.classList.add("highlight-pulse");
          
          const removeTimer = setTimeout(() => {
            element.classList.remove("highlight-pulse");
          }, 4500);
          return () => clearTimeout(removeTimer);
        }, 400);
        return () => clearTimeout(timerId);
      }
    }
  }, [loading, assignments]);

  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [assignmentNumber, setAssignmentNumber] = useState(1);
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentDescription, setAssignmentDescription] = useState("");
  const [assignmentDate, setAssignmentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [assignmentToDelete, setAssignmentToDelete] = useState(null);
  const [assignmentBusy, setAssignmentBusy] = useState(false);
  const [assignmentError, setAssignmentError] = useState("");

  function openAssignmentModal() {
    setEditingAssignment(null);
    setAssignmentNumber(assignments.length + 1);
    setAssignmentTitle("");
    setAssignmentDescription("");
    setAssignmentDate(new Date().toISOString().split("T")[0]);
    setAssignmentError("");
    setAssignmentModalOpen(true);
  }

  function openEditAssignment(assignment) {
    setEditingAssignment(assignment);
    setAssignmentNumber(assignment.assignmentNumber);
    setAssignmentTitle(assignment.title);
    setAssignmentDescription(assignment.description);
    setAssignmentDate(
      new Date(assignment.assignedDate).toISOString().split("T")[0]
    );
    setAssignmentError("");
    setAssignmentModalOpen(true);
  }

  function closeAssignmentModal() {
    if (assignmentBusy) return;
    setAssignmentModalOpen(false);
    setEditingAssignment(null);
  }

  async function handleAssignmentSubmit(event) {
    event.preventDefault();
    if (!subject) return;

    try {
      setAssignmentBusy(true);
      setAssignmentError("");

      const payload = {
        subjectId: subject._id,
        assignmentNumber,
        title: assignmentTitle,
        description: assignmentDescription,
        assignedDate: assignmentDate,
      };

      if (editingAssignment) {
        await api.put(`/assignments/${editingAssignment._id}`, payload);
      } else {
        await api.post("/assignments/create", payload);
      }

      await mutate();
      closeAssignmentModal();
    } catch (err) {
      setAssignmentError(
        err?.response?.data?.message || "Could not save assignment."
      );
    } finally {
      setAssignmentBusy(false);
    }
  }

  async function handleDeleteAssignment() {
    if (!assignmentToDelete) return;
    try {
      setAssignmentBusy(true);
      await api.delete(`/assignments/${assignmentToDelete._id}`);
      await mutate();
      setAssignmentToDelete(null);
    } catch (err) {
      setAssignmentError(
        err?.response?.data?.message || "Could not delete assignment."
      );
      setAssignmentToDelete(null);
    } finally {
      setAssignmentBusy(false);
    }
  }

  function handleMoveAssignment(assignmentId, direction) {
    const idx = assignments.findIndex(a => a._id === assignmentId);
    if (idx === -1) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= assignments.length) return;

    const reordered = [...assignments];
    const [moved] = reordered.splice(idx, 1);
    reordered.splice(targetIdx, 0, moved);
    setAssignments(reordered);
    setIsOrderChanged(true);
  }

  function handleReorderAssignments(draggedId, targetId, newDate) {
    const draggedIdx = assignments.findIndex((a) => a._id === draggedId);
    if (draggedIdx === -1) return;

    const reordered = [...assignments];
    const [draggedAssignment] = reordered.splice(draggedIdx, 1);
    
    if (newDate) {
      draggedAssignment.assignedDate = newDate;
    }

    if (draggedId === targetId) {
      // If we just changed group but didn't drop on a specific item, append to group
      reordered.push(draggedAssignment);
    } else {
      const targetIdx = reordered.findIndex((a) => a._id === targetId);
      if (targetIdx !== -1) {
        reordered.splice(targetIdx, 0, draggedAssignment);
      } else {
        reordered.push(draggedAssignment);
      }
    }

    setAssignments(reordered);
    setIsOrderChanged(true);
  }

  async function handleSaveOrder() {
    try {
      setSavingOrder(true);
      await Promise.all(
        assignments.map((assignment, index) =>
          api.put(`/assignments/${assignment._id}`, {
            order: index + 1,
            assignedDate: assignment.assignedDate,
          })
        )
      );
      setIsOrderChanged(false);
      await mutate();
    } catch (err) {
      console.error("Failed to save assignment order:", err);
    } finally {
      setSavingOrder(false);
    }
  }

  if (loading) {
    return (
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
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="rounded-4xl border border-dashed border-black/10 bg-white/80 p-8 text-center shadow-sm">
          <h2 className="text-2xl font-bold text-[#172033]">
            Unable to load subject
          </h2>
          <p className="mt-2 text-black/60">{error}</p>
          <div className="mt-6">
            <Button onClick={() => mutate()}>Try again</Button>
          </div>
        </div>
      </main>
    );
  }

  const filteredAssignments = assignments.filter((assignment) =>
    `${assignment.title} ${assignment.description}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  if (!subject) {
    return (
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
    );
  }

  return (
    <>
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10">
        <SubjectHeader subject={subject} />

        {isAuthenticated ? (
          <div className="mt-3 flex justify-end gap-3 sm:mt-4">
            {isOrderChanged && (
              <Button
                onClick={handleSaveOrder}
                disabled={savingOrder}
                className="bg-green-600 text-white hover:bg-green-700 hover:shadow-md transition-all font-semibold"
              >
                {savingOrder ? "Saving..." : "Save Order"}
              </Button>
            )}
            <Button onClick={openAssignmentModal}>Add Assignment</Button>
          </div>
        ) : null}
      
      

        <div className="mt-3 sm:mt-4">
          <GooeyInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assignments..."
            mode="local"
          />
        </div>

        <div className="mt-3 sm:mt-4">
          <AssignmentList
            assignments={filteredAssignments}
            onEdit={openEditAssignment}
            onDelete={setAssignmentToDelete}
            onMoveUp={(id) => handleMoveAssignment(id, "up")}
            onMoveDown={(id) => handleMoveAssignment(id, "down")}
            onReorder={handleReorderAssignments}
          />
        </div>
      </main>

      {assignmentModalOpen ? (
        <ModalShell
          title={editingAssignment ? "Edit Assignment" : "Add Assignment"}
          description={
            editingAssignment
              ? `Edit details below.`
              : `Create a new assignment under ${subject?.name || "this subject"}.`
          }
          onClose={closeAssignmentModal}
          maxWidth="max-w-lg"
        >
          <form className="space-y-3.5" onSubmit={handleAssignmentSubmit}>
            <div className="grid gap-3 grid-cols-[100px_1fr]">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#64748b]">
                  No.
                </label>
                <input
                  type="number"
                  min="1"
                  value={assignmentNumber}
                  onChange={(event) =>
                    setAssignmentNumber(Number(event.target.value) || 1)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 font-medium text-sm"
                  placeholder="No."
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#64748b]">
                  Assignment Title
                </label>
                <input
                  type="text"
                  value={assignmentTitle}
                  onChange={(event) => setAssignmentTitle(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 font-medium text-sm"
                  placeholder="Assignment title"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#64748b]">
                Description (Optional)
              </label>
              <textarea
                value={assignmentDescription}
                onChange={(event) => setAssignmentDescription(event.target.value)}
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 font-medium text-xs leading-relaxed"
                placeholder="Brief assignment details, resources, or links..."
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#64748b]">
                Assigned Date
              </label>
              <DatePicker
                value={assignmentDate}
                onChange={setAssignmentDate}
              />
            </div>

            {assignmentError ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-medium text-red-700">
                {assignmentError}
              </p>
            ) : null}

            <div className="flex flex-wrap justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="secondary"
                onClick={closeAssignmentModal}
                className="rounded-full px-4 py-2 text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={assignmentBusy} className="rounded-full px-5 py-2 text-xs font-bold">
                {editingAssignment ? "Save Changes" : "Create Assignment"}
              </Button>
            </div>
          </form>
        </ModalShell>
      ) : null}
      
      
      

      {assignmentToDelete ? (
        <ConfirmDialog
          title="Delete assignment?"
          description={`Are you sure you want to delete assignment "${assignmentToDelete.title}"? This action cannot be undone.`}
          confirmLabel={assignmentBusy ? "Deleting..." : "Delete"}
          destructive
          onClose={() => setAssignmentToDelete(null)}
          onConfirm={handleDeleteAssignment}
        />
      ) : null}
      
      
    </>
  );
}
