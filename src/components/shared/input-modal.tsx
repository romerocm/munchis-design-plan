"use client";

import { useState, useRef, useEffect } from "react";
import { useSwipeDismiss } from "@/hooks/use-swipe-dismiss";

interface Props {
  title: string;
  placeholder?: string;
  confirmLabel?: string;
  onConfirm: (value: string) => void;
  onClose: () => void;
}

export function InputModal({ title, placeholder, confirmLabel = "Add", onConfirm, onClose }: Props) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { sheetRef, onTouchStart, onTouchMove, onTouchEnd } = useSwipeDismiss(onClose);

  useEffect(() => {
    // Focus after slide-up animation
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
  }

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
        <p className="text-[11px] font-semibold text-forest/35 uppercase tracking-wider mb-2">{title}</p>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder={placeholder}
          className="w-full font-display font-black text-xl text-forest bg-white rounded-xl px-4 py-3 outline-none ring-1 ring-forest/10 focus:ring-2 focus:ring-amber/50"
        />
        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-forest/5 text-sm font-semibold text-forest/50 btn-press"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!value.trim()}
            className="flex-1 py-3 rounded-xl bg-forest text-white text-sm font-semibold btn-press disabled:opacity-30"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
