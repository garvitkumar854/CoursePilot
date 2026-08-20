"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

export type FloatingMenuProps = Readonly<{
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLElement | null>;
  children: ReactNode;
  className?: string;
}>;

/**
 * Portals a dropdown to `document.body` so overflow/stacking on neighboring
 * rows cannot clip it. Position is computed once from the trigger's box —
 * `top`/`left` are never transitioned.
 */
export function FloatingMenu({
  open,
  onClose,
  anchorRef,
  children,
  className = "w-40",
}: FloatingMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, ready: false });

  if (!open && coords.ready) {
    setCoords({ top: 0, left: 0, ready: false });
  }

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    const place = () => {
      const anchor = anchorRef.current;
      const menu = menuRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const menuWidth = menu?.offsetWidth ?? 160;
      const menuHeight = menu?.offsetHeight ?? 0;
      const gap = 8;
      const maxLeft = window.innerWidth - menuWidth - 8;
      const left = Math.min(Math.max(8, rect.right - menuWidth), Math.max(8, maxLeft));
      let top = rect.bottom + gap;

      if (menuHeight && top + menuHeight > window.innerHeight - 8) {
        top = Math.max(8, rect.top - menuHeight - gap);
      }

      setCoords({ top, left, ready: true });
    };

    place();
    window.addEventListener("resize", place);
    window.visualViewport?.addEventListener("resize", place);

    return () => {
      window.removeEventListener("resize", place);
      window.visualViewport?.removeEventListener("resize", place);
    };
  }, [anchorRef, open]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (menuRef.current?.contains(target) || anchorRef.current?.contains(target)) {
        return;
      }
      onClose();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [anchorRef, onClose, open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      className={`fixed z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_20px_50px_rgba(15,23,42,0.16)] ${className}`}
      style={{
        top: coords.top,
        left: coords.left,
        opacity: coords.ready ? 1 : 0,
        pointerEvents: coords.ready ? "auto" : "none",
      }}
    >
      {children}
    </div>,
    document.body,
  );
}

export default FloatingMenu;
