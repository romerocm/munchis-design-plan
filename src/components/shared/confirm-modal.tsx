"use client";

import { useSwipeDismiss } from "@/hooks/use-swipe-dismiss";

interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({ title, message, confirmLabel = "Confirm", destructive = false, onConfirm, onClose }: Props) {
  const { sheetRef, onTouchStart, onTouchMove, onTouchEnd } = useSwipeDismiss(onClose);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Sheet */}
      <div
        ref={sheetRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="relative w-full max-w-lg bg-cream rounded-t-2xl p-5 pb-8 animate-slide-up"
      >
        <div className="w-10 h-1 rounded-full bg-forest/10 mx-auto mb-4 cursor-grab" />
        <p className="font-display font-black text-lg text-forest">{title}</p>
        <p className="text-[14px] text-forest/50 mt-1 leading-relaxed">{message}</p>
        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-forest/5 text-sm font-semibold text-forest/50 btn-press"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold btn-press ${
              destructive
                ? "bg-red-500 text-white"
                : "bg-forest text-white"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
