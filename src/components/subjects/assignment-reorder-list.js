"use client";

import { Reorder, useDragControls, useMotionValue } from "framer-motion";
import { useState } from "react";
import { AssignmentRowBody } from "@/components/subjects/assignment-row";

const EASE = [0.22, 1, 0.36, 1];

function GripIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
            <g fill="currentColor">
                <circle cx="9" cy="6" r="1.6" />
                <circle cx="15" cy="6" r="1.6" />
                <circle cx="9" cy="12" r="1.6" />
                <circle cx="15" cy="12" r="1.6" />
                <circle cx="9" cy="18" r="1.6" />
                <circle cx="15" cy="18" r="1.6" />
            </g>
        </svg>
    );
}

function ReorderAssignmentRow({ assignment, isAdmin, onEdit, onInfo, onDelete }) {
    const dragControls = useDragControls();
    const [isDragging, setIsDragging] = useState(false);
    const y = useMotionValue(0);

    return (
        <Reorder.Item
            value={assignment}
            id={`assignment-${assignment.id}`}
            style={{ y }}
            dragListener={false}
            dragControls={dragControls}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => setIsDragging(false)}
            transition={{ duration: 0.2, ease: EASE }}
            className={`assignment-target relative z-0 scroll-mt-24 border-t border-slate-200/80 bg-white first:border-t-0 ${isDragging ? "z-20 shadow-[0_18px_45px_rgba(15,23,42,0.16)]" : ""}`}
        >
            <AssignmentRowBody
                assignment={assignment}
                isAdmin={isAdmin}
                showGrip
                gripIcon={<GripIcon />}
                onGripPointerDown={(event) => dragControls.start(event)}
                onEdit={onEdit}
                onInfo={onInfo}
                onDelete={onDelete}
            />
        </Reorder.Item>
    );
}

/** Admin-only drag list. Dynamically imported so public subject pages never parse Framer Motion. */
export default function AssignmentReorderList({
    assignments,
    isAdmin,
    onReorder,
    onEdit,
    onInfo,
    onDelete,
}) {
    return (
        <Reorder.Group
            axis="y"
            as="ul"
            values={assignments}
            onReorder={onReorder}
            className="relative m-0 list-none p-0"
        >
            {assignments.map((assignment) => (
                <ReorderAssignmentRow
                    key={assignment.id}
                    assignment={assignment}
                    isAdmin={isAdmin}
                    onEdit={onEdit}
                    onInfo={onInfo}
                    onDelete={onDelete}
                />
            ))}
        </Reorder.Group>
    );
}
