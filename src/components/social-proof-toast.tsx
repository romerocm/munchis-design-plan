"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { ToastEvent } from "@/lib/social-proof/variants";

interface SocialProofToastProps {
  toast: ToastEvent | null;
  onDismiss: () => void;
}

export function SocialProofToast({ toast, onDismiss }: SocialProofToastProps) {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (toast) {
      setClosing(false);
      // Small delay to trigger entrance animation
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [toast?.id, toast]);

  function handleDismiss() {
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, 300);
  }

  if (!toast || typeof document === "undefined") return null;

  const borderAccent =
    toast.type === "low-stock"
      ? "border-l-4 border-amber"
      : toast.type === "sold-out"
        ? "border-l-4 border-red-text"
        : "";

  return createPortal(
    <div
      className={`
        fixed bottom-6 left-4 right-4
        lg:bottom-8 lg:left-8 lg:right-auto lg:max-w-sm
        z-[45] flex justify-center lg:justify-start
        transition-all duration-300 ease-out
        ${visible && !closing ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
      `}
      role="status"
      aria-live="polite"
    >
      <button
        type="button"
        onClick={handleDismiss}
        className={`
          flex items-start gap-3 px-4 py-3
          bg-forest/95 backdrop-blur-sm shadow-lg
          text-left cursor-pointer
          ${borderAccent}
        `}
      >
        <div className="min-w-0">
          <p className="text-cream font-semibold text-sm leading-tight">
            {toast.message}
          </p>
          <p className="text-cream/70 text-xs mt-0.5 leading-tight">
            {toast.submessage}
          </p>
        </div>
      </button>
    </div>,
    document.body
  );
}
