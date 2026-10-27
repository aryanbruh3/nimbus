import React, { useEffect, useRef } from "react";
import { AlertCircleIcon, CloseIcon, SpinnerIcon } from "./icons";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDestructive = false,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    // Autofocus cancel button for safety
    cancelBtnRef.current?.focus();

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5">
          <div className="flex items-start gap-3.5">
            {isDestructive && (
              <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
                <AlertCircleIcon size={20} />
              </div>
            )}
            <div className="flex-1">
              <h3 id="modal-title" className="text-base font-semibold text-slate-900">
                {title}
              </h3>
              <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                {description}
              </p>
            </div>
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
              aria-label="Close dialog"
            >
              <CloseIcon size={18} />
            </button>
          </div>
        </div>

        <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-medium rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
              isDestructive
                ? "bg-red-600 hover:bg-red-700 text-white shadow-xs focus-visible:outline-red-600"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-xs focus-visible:outline-blue-600"
            } disabled:opacity-50`}
          >
            {isLoading && <SpinnerIcon size={14} className="text-white" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
