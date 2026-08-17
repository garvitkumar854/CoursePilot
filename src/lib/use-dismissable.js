"use client";

import { useEffect, useRef } from "react";

/**
 * Closes a floating surface (dropdown / popover / menu) when the user clicks
 * or taps outside of it, or presses Escape. Returns the ref to attach to the
 * element that should stay open.
 */
export function useDismissable(isOpen, onDismiss) {
    const ref = useRef(null);
    const handlerRef = useRef(onDismiss);

    useEffect(() => {
        handlerRef.current = onDismiss;
    }, [onDismiss]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handlePointerDown = (event) => {
            if (ref.current && !ref.current.contains(event.target)) {
                handlerRef.current?.();
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                handlerRef.current?.();
            }
        };

        // `pointerdown` covers mouse, touch and pen in one listener.
        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen]);

    return ref;
}
