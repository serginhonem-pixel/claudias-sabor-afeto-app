"use client";
import { useEffect, ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
}

export function Modal({ open, onClose, title, children, size = "md" }: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!open) return null;

  const widths = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50" onClick={onClose}>
      <div
        className={`bg-white w-full ${widths[size]} flex flex-col rounded-t-2xl sm:rounded-xl shadow-xl max-h-[88vh] mb-16 sm:mb-0`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-rose-light/60 shrink-0">
          <h2 className="font-heading font-semibold text-dark text-[0.95rem]">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-md text-muted hover:text-dark hover:bg-rose-light transition">
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
